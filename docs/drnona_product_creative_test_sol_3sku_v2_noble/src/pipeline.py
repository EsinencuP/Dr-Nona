from __future__ import annotations

import shutil
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from PIL import Image, ImageColor

from .catalog_reader import ProductRecord, read_catalog
from .compositor import compose_product, crop_to_alpha
from .cost_tracker import BudgetGuard
from .creative_director import build_scene_plan
from .exporter import create_output_zip, validate_outputs
from .image_export import export_asset, export_thumbnail
from .manifest import write_manifest
from .product_analyzer import analyze_product
from .prompt_builder import build_prompts
from .providers import (
    FolderBackgroundProvider,
    MockImageProvider,
)
from .quality_control import (
    difference_hash,
    evaluate_composite,
    hash_similarity,
    scene_detail_score,
)
from .reference_analyzer import analyze_references
from .review_gallery import create_review_html
from .utils import (
    ensure_project_dirs,
    load_rgba,
    load_yaml,
    prompt_hash,
    save_png,
    sha256_file,
    utc_now,
    write_json,
    redact_secrets,
)


@dataclass
class PipelineOptions:
    plan_only: bool = True
    pilot: bool = False
    batch: bool = False
    confirm_batch: bool = False
    max_products: int | None = None
    max_api_requests: int | None = None
    skip_existing: bool = False
    regenerate: bool = False
    product: str | None = None
    asset_type: str | None = None
    provider: str = "folder"
    quality: str = "high"
    dry_run: bool = False
    generation_mode: str | None = None


class CatalogCreativePipeline:
    def __init__(self, project_root: Path, options: PipelineOptions, logger: Any) -> None:
        self.root = project_root.resolve()
        self.options = options
        self.logger = logger
        load_dotenv(self.root / ".env", override=False)
        self.settings = load_yaml(self.root / "config" / "settings.yaml")
        if options.generation_mode:
            self.settings["generation_mode"] = options.generation_mode
        self.presets = load_yaml(self.root / "config" / "scene-presets.yaml")["presets"]
        negative = load_yaml(self.root / "config" / "negative-prompts.yaml")
        self.global_negative = negative.get("global", [])
        ensure_project_dirs(self.root)
        budget = self.settings["budget"]
        self.guard = BudgetGuard(
            max_products=options.max_products or int(budget["max_products_per_run"]),
            max_api_requests=options.max_api_requests or int(budget["max_api_requests_per_run"]),
            max_candidates_per_asset=int(budget["max_candidates_per_asset"]),
        )
        self.manifest_rows: list[dict[str, Any]] = []
        self.review_items: list[dict[str, Any]] = []
        self.report_items: list[dict[str, Any]] = []
        self.failed_items: list[dict[str, Any]] = []
        self.scene_hashes: list[tuple[str, str]] = []

    def _provider(self):
        if self.options.provider == "mock":
            return MockImageProvider()
        if self.options.provider == "folder":
            return FolderBackgroundProvider(self.root / "input" / "backgrounds")
        raise ValueError(f"Provider '{self.options.provider}' is not implemented.")

    def _select_products(self, records: list[ProductRecord]) -> list[ProductRecord]:
        selected = records
        if self.options.product:
            selected = [
                record
                for record in records
                if record.product_slug == self.options.product
                or record.source_path.name == self.options.product
            ]
        if self.options.pilot:
            selected = selected[: self.options.max_products or 5]
        elif self.options.max_products:
            selected = selected[: self.options.max_products]
        return selected

    def _solid_background(self, size: int, color_value: str | None = None) -> Image.Image:
        color = ImageColor.getrgb(color_value or self.settings["canvas"]["background"])
        return Image.new("RGBA", (size, size), (*color, 255))

    def _clean_card_background(self, record: ProductRecord, size: int) -> Image.Image:
        clean_settings = self.settings.get("clean_card", {})
        is_lord = (
            record.product_line.strip().lower() == "lord"
            or "lord" in record.product_slug.lower()
            or "lord" in record.product_name.lower()
        )
        color_value = (
            clean_settings.get("lord_background", "#071827")
            if is_lord
            else clean_settings.get("default_background", "#F7FBFC")
        )
        return self._solid_background(size, color_value)

    def _write_master(self, record: ProductRecord, product_dir: Path) -> Image.Image:
        image = load_rgba(record.source_path)
        master = product_dir / "master"
        master.mkdir(parents=True, exist_ok=True)
        save_png(image, master / "source.png")
        save_png(image, master / "normalized.png")
        image.getchannel("A").save(master / "mask.png", "PNG")
        return image

    def _manifest_row(
        self,
        record: ProductRecord,
        analysis: dict[str, Any],
        scene_plan: dict[str, Any],
        asset_type: str,
        output_path: Path,
        qa: dict[str, Any],
        provider: str,
        model: str,
        prompt: str,
        request_id: str,
        attempts: int,
        estimated_cost: float,
        elapsed: float,
        candidate_number: int = 1,
    ) -> dict[str, Any]:
        with Image.open(output_path) as image:
            width, height = image.size
        return {
            "sku": record.sku,
            "product_name": record.product_name,
            "product_slug": record.product_slug,
            "category": analysis["category"],
            "preset": scene_plan["preset"],
            "source_filename": record.source_path.name,
            "asset_type": asset_type,
            "candidate_number": candidate_number,
            "output_filename": output_path.relative_to(self.root).as_posix(),
            "provider": provider,
            "model": model,
            "prompt_hash": prompt_hash(prompt) if prompt else "",
            "source_sha256": sha256_file(record.source_path),
            "output_sha256": sha256_file(output_path),
            "width": width,
            "height": height,
            "quality": self.options.quality,
            "generation_mode": scene_plan["generation_mode"],
            "api_request_id": request_id,
            "api_attempts": attempts,
            "estimated_cost": estimated_cost,
            "qa_status": qa["status"],
            "product_fidelity_score": qa["product_fidelity_score"],
            "silhouette_score": qa["silhouette_score"],
            "scene_detail_score": qa.get("scene_detail_score", ""),
            "scene_similarity_max": qa.get("scene_similarity_max", ""),
            "background_text_detected": qa["background_text_detected"],
            "duplicate_product_detected": qa["duplicate_product_detected"],
            "warnings": ";".join(qa["warnings"]),
            "created_at": utc_now(),
            "processing_time_seconds": round(elapsed, 3),
        }

    def _save_final_copies(
        self, record: ProductRecord, asset_type: str, image: Image.Image, qa_status: str
    ) -> tuple[Path, Path]:
        product_dir = self.root / "output" / "products" / record.product_slug / "final"
        order = {
            "clean-card": "01",
            "hero": "02",
            "ingredients": "03",
            "lifestyle": "04",
        }[asset_type]
        png_path = product_dir / f"{order}-{asset_type}.png"
        webp_path = product_dir / f"{order}-{asset_type}.webp"
        export_asset(
            image,
            png_path,
            webp_path,
            int(self.settings["exports"]["webp_quality"]),
            int(self.settings["exports"]["png_compress_level"]),
        )
        bucket = {
            "PASS": "approved",
            "REVIEW": "review",
            "REJECT": "rejected",
        }.get(qa_status, "review")
        bucket_dir = self.root / "output" / bucket / record.product_slug
        bucket_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(png_path, bucket_dir / png_path.name)
        shutil.copy2(webp_path, bucket_dir / webp_path.name)
        if asset_type == "clean-card":
            export_thumbnail(
                image,
                bucket_dir / "01-clean-card-thumbnail.webp",
                int(self.settings["canvas"]["thumbnail_size"]),
                int(self.settings["exports"]["thumbnail_quality"]),
            )
        return png_path, webp_path

    def _process_product(self, record: ProductRecord, provider: Any | None) -> None:
        started = time.perf_counter()
        product_dir = self.root / "output" / "products" / record.product_slug
        if self.options.skip_existing and (product_dir / "metadata.json").exists() and not self.options.regenerate:
            self.logger.info("Skipping existing product: %s", record.product_slug)
            return
        for relative in ("master", "plans", "candidates", "final", "qa"):
            (product_dir / relative).mkdir(parents=True, exist_ok=True)
        product = self._write_master(record, product_dir)
        analysis = analyze_product(
            record, float(self.settings["qa"]["classification_review_threshold"])
        )
        references = analyze_references(self.root, record, analysis["category"])
        scene_plan = build_scene_plan(
            record,
            analysis,
            references,
            self.presets,
            self.settings["generation_mode"],
        )
        preset = self.presets[scene_plan["preset"]]
        prompts = build_prompts(
            analysis, scene_plan, preset, self.global_negative
        )
        write_json(product_dir / "plans" / "analysis.json", analysis)
        write_json(product_dir / "plans" / "reference_analysis.json", references)
        write_json(product_dir / "plans" / "scene-plan.json", scene_plan)
        write_json(product_dir / "plans" / "prompts.json", prompts)

        assets: dict[str, str] = {}
        product_statuses: list[str] = []
        warnings = list(analysis["warnings"])
        total_estimated = 0.0
        provider_name = "plan-only" if provider is None else provider.name
        generation_allowed = (
            analysis["has_transparency"]
            and "EMPTY_ALPHA_MASK" not in analysis["warnings"]
        )

        if generation_allowed and "clean-card" in scene_plan["assets"] and (
            not self.options.asset_type or self.options.asset_type == "clean-card"
        ):
            result = compose_product(
                product,
                self._clean_card_background(
                    record, int(self.settings["canvas"]["catalog_size"])
                ),
                float(self.settings["canvas"]["catalog_fill_ratio"]),
                float(self.settings["canvas"]["safe_padding_ratio"]),
                bool(self.settings["canvas"]["allow_upscale"]),
                self.settings["clean_card"]["shadow"],
                base_y_ratio=float(self.settings["canvas"]["catalog_base_y_ratio"]),
                max_width_ratio=float(self.settings["canvas"]["catalog_max_width_ratio"]),
            )
            qa = evaluate_composite(
                crop_to_alpha(product)[0],
                result.placed_product,
                result.image,
                result.bbox,
                self.settings["qa"],
                result.warnings,
            ).to_dict()
            png_path, _ = self._save_final_copies(
                record, "clean-card", result.image, qa["status"]
            )
            assets["clean-card"] = png_path.relative_to(self.root / "output").as_posix()
            self.manifest_rows.append(
                self._manifest_row(
                    record,
                    analysis,
                    scene_plan,
                    "clean-card",
                    png_path,
                    qa,
                    "local-compositor",
                    "Pillow/OpenCV",
                    "",
                    "",
                    0,
                    0.0,
                    time.perf_counter() - started,
                )
            )
            product_statuses.append(qa["status"])
            warnings.extend(qa["warnings"])

        generated_qa: list[dict[str, Any]] = []
        if provider is not None and generation_allowed:
            for asset_type, prompt_data in prompts["items"].items():
                if self.options.asset_type and self.options.asset_type != asset_type:
                    continue
                count = 1
                count = min(count, self.guard.max_candidates_per_asset)
                candidates = []
                for candidate_number in range(1, count + 1):
                    if hasattr(provider, "set_context"):
                        provider.set_context(
                            record.product_slug, asset_type, candidate_number
                        )
                    estimated = provider.estimate_cost(
                        1, self.options.quality, (2048, 2048)
                    )
                    if provider.name not in {"folder", "mock"}:
                        self.guard.reserve(1, estimated)
                    candidate_dir = product_dir / "candidates" / asset_type
                    if scene_plan["generation_mode"] == "GENERATIVE_EDIT":
                        protected_base = compose_product(
                            product,
                            self._solid_background(2048),
                            float(self.settings["canvas"]["hero_fill_ratio"]),
                            float(self.settings["canvas"]["safe_padding_ratio"]),
                            bool(self.settings["canvas"]["allow_upscale"]),
                            base_y_ratio=float(self.settings["canvas"]["hero_base_y_ratio"]),
                            max_width_ratio=float(self.settings["canvas"]["hero_max_width_ratio"]),
                        )
                        base_path = candidate_dir / f"edit-base-{candidate_number:02d}.png"
                        mask_path = candidate_dir / f"edit-mask-{candidate_number:02d}.png"
                        save_png(protected_base.image, base_path)
                        mask = Image.new("RGBA", (2048, 2048), (0, 0, 0, 0))
                        protected_mask = Image.new(
                            "RGBA", protected_base.placed_product.size, (255, 255, 255, 0)
                        )
                        protected_mask.putalpha(
                            protected_base.placed_product.getchannel("A")
                        )
                        mask.alpha_composite(
                            protected_mask, protected_base.product_position
                        )
                        save_png(mask, mask_path)
                        generated = provider.edit_scene(
                            base_path,
                            mask_path,
                            prompt_data["prompt"]
                            + "\nChange only the background and environment. Keep the protected product pixels unchanged.",
                            (2048, 2048),
                            self.options.quality,
                        )
                        write_json(
                            candidate_dir
                            / f"request-metadata-edit-{candidate_number:02d}.json",
                            {
                                "provider": generated.provider,
                                "model": generated.model,
                                "request_id": generated.request_id,
                                "usage": generated.usage or {},
                                "estimated_cost": generated.estimated_cost,
                                "prompt_hash": prompt_hash(prompt_data["prompt"]),
                                "created_at": utc_now(),
                            },
                        )
                        composite = protected_base
                        composite.image = generated.image
                        background_path = candidate_dir / f"edited-scene-{candidate_number:02d}.png"
                        save_png(generated.image, background_path)
                        candidate_product = generated.image.crop(protected_base.bbox)
                    else:
                        generated = provider.generate_background(
                            prompt_data["prompt"],
                            prompt_data["negative_prompt"],
                            (2048, 2048),
                            self.options.quality,
                        )
                        write_json(
                            candidate_dir
                            / f"request-metadata-{candidate_number:02d}.json",
                            {
                                "provider": generated.provider,
                                "model": generated.model,
                                "request_id": generated.request_id,
                                "usage": generated.usage or {},
                                "estimated_cost": generated.estimated_cost,
                                "prompt_hash": prompt_hash(prompt_data["prompt"]),
                                "created_at": utc_now(),
                            },
                        )
                        background_path = candidate_dir / f"background-{candidate_number:02d}.png"
                        save_png(generated.image, background_path)
                        composite = compose_product(
                            product,
                            generated.image,
                            float(self.settings["canvas"]["hero_fill_ratio"]),
                            float(self.settings["canvas"]["safe_padding_ratio"]),
                            bool(self.settings["canvas"]["allow_upscale"]),
                            self.settings["shadow"],
                            self.settings["reflection"],
                            reflection_enabled=(
                                "polished" in preset["surface"]
                                or "glass" in preset["surface"]
                                or "water" in preset["surface"]
                            ),
                            base_y_ratio=float(self.settings["canvas"]["hero_base_y_ratio"]),
                            max_width_ratio=float(self.settings["canvas"]["hero_max_width_ratio"]),
                        )
                        candidate_product = None
                    qa = evaluate_composite(
                        crop_to_alpha(product)[0],
                        composite.placed_product,
                        composite.image,
                        composite.bbox,
                        self.settings["qa"],
                        composite.warnings,
                        candidate_product=candidate_product,
                    ).to_dict()
                    api_attempts = 1
                    if (
                        scene_plan["generation_mode"] == "GENERATIVE_EDIT"
                        and qa["status"] == "REJECT"
                    ):
                        rejected_candidate = (
                            self.root
                            / "output"
                            / "rejected"
                            / record.product_slug
                            / f"{asset_type}-generative-edit-rejected-{candidate_number:02d}.png"
                        )
                        save_png(generated.image, rejected_candidate)
                        fallback_estimated = provider.estimate_cost(
                            1, self.options.quality, (2048, 2048)
                        )
                        if provider.name not in {"folder", "mock"}:
                            self.guard.reserve(1, fallback_estimated)
                        generated = provider.generate_background(
                            prompt_data["prompt"],
                            prompt_data["negative_prompt"],
                            (2048, 2048),
                            self.options.quality,
                        )
                        write_json(
                            candidate_dir
                            / f"request-metadata-fallback-{candidate_number:02d}.json",
                            {
                                "provider": generated.provider,
                                "model": generated.model,
                                "request_id": generated.request_id,
                                "usage": generated.usage or {},
                                "estimated_cost": generated.estimated_cost,
                                "prompt_hash": prompt_hash(prompt_data["prompt"]),
                                "created_at": utc_now(),
                                "reason": "GENERATIVE_EDIT_REJECTED_SAFE_FALLBACK",
                            },
                        )
                        composite = compose_product(
                            product,
                            generated.image,
                            float(self.settings["canvas"]["hero_fill_ratio"]),
                            float(self.settings["canvas"]["safe_padding_ratio"]),
                            bool(self.settings["canvas"]["allow_upscale"]),
                            self.settings["shadow"],
                            self.settings["reflection"],
                            reflection_enabled=(
                                "polished" in preset["surface"]
                                or "glass" in preset["surface"]
                                or "water" in preset["surface"]
                            ),
                            base_y_ratio=float(self.settings["canvas"]["hero_base_y_ratio"]),
                            max_width_ratio=float(self.settings["canvas"]["hero_max_width_ratio"]),
                        )
                        qa = evaluate_composite(
                            crop_to_alpha(product)[0],
                            composite.placed_product,
                            composite.image,
                            composite.bbox,
                            self.settings["qa"],
                            composite.warnings
                            + ["GENERATIVE_EDIT_REJECTED_SAFE_FALLBACK"],
                        ).to_dict()
                        api_attempts = 2
                    candidate_path = (
                        product_dir
                        / "candidates"
                        / asset_type
                        / f"composite-{candidate_number:02d}.png"
                    )
                    save_png(composite.image, candidate_path)
                    candidates.append(
                        (qa, composite, generated, candidate_number, api_attempts)
                    )
                best = max(
                    candidates,
                    key=lambda item: (
                        item[0]["status"] == "PASS",
                        item[0]["product_fidelity_score"],
                        item[0]["silhouette_score"],
                    ),
                )
                qa, composite, generated, candidate_number, api_attempts = best
                detail = scene_detail_score(generated.image)
                scene_hash = difference_hash(generated.image)
                similarities = [
                    hash_similarity(scene_hash, previous_hash)
                    for previous_slug, previous_hash in self.scene_hashes
                    if previous_slug != record.product_slug
                ]
                max_similarity = max(similarities, default=0.0)
                qa["scene_detail_score"] = detail
                qa["scene_similarity_max"] = max_similarity
                if detail < float(self.settings["qa"]["min_scene_detail_score"]):
                    qa["warnings"].append("SCENE_TOO_SPARSE")
                    if qa["status"] == "PASS":
                        qa["status"] = "REVIEW"
                if max_similarity > float(
                    self.settings["qa"]["max_cross_product_scene_similarity"]
                ):
                    qa["warnings"].append("SCENE_TOO_SIMILAR_TO_PREVIOUS_PRODUCT")
                    if qa["status"] == "PASS":
                        qa["status"] = "REVIEW"
                if generated.provider == "mock":
                    qa["warnings"].append("MOCK_PROVIDER_TEST_ONLY")
                    if qa["status"] == "PASS":
                        qa["status"] = "REVIEW"
                qa["warnings"] = sorted(set(qa["warnings"]))
                self.scene_hashes.append((record.product_slug, scene_hash))
                png_path, _ = self._save_final_copies(
                    record, asset_type, composite.image, qa["status"]
                )
                assets[asset_type] = png_path.relative_to(self.root / "output").as_posix()
                self.manifest_rows.append(
                    self._manifest_row(
                        record,
                        analysis,
                        scene_plan,
                        asset_type,
                        png_path,
                        qa,
                        generated.provider,
                        generated.model,
                        prompt_data["prompt"],
                        generated.request_id,
                        api_attempts,
                        generated.estimated_cost,
                        time.perf_counter() - started,
                        candidate_number,
                    )
                )
                generated_qa.append(qa)
                product_statuses.append(qa["status"])
                warnings.extend(qa["warnings"])
                total_estimated += generated.estimated_cost

        status = (
            "REJECT"
            if "REJECT" in product_statuses
            else "REVIEW"
            if (
                "REVIEW" in product_statuses
                or analysis["needs_review"]
                or not generation_allowed
            )
            else "PASS"
            if product_statuses
            else "PLANNED"
        )
        all_qa = generated_qa + [
            {
                "product_fidelity_score": row["product_fidelity_score"],
                "silhouette_score": row["silhouette_score"],
            }
            for row in self.manifest_rows
            if row["product_slug"] == record.product_slug
        ]
        fidelity = min(
            (float(item["product_fidelity_score"]) for item in all_qa),
            default=0.0,
        )
        silhouette = min(
            (float(item["silhouette_score"]) for item in all_qa),
            default=0.0,
        )
        qa_report = {
            "product_slug": record.product_slug,
            "status": status,
            "product_fidelity_score": round(fidelity, 4),
            "silhouette_score": round(silhouette, 4),
            "warnings": sorted(set(warnings)),
            "assets": assets,
        }
        write_json(product_dir / "qa" / "report.json", qa_report)
        write_json(product_dir / "qa" / "warnings.json", qa_report["warnings"])
        metadata = {
            "record": record.to_dict(),
            "analysis": analysis,
            "scene_plan": scene_plan,
            "status": status,
            "provider": provider_name,
            "estimated_cost": total_estimated,
            "processing_time_seconds": round(time.perf_counter() - started, 3),
        }
        write_json(product_dir / "metadata.json", metadata)
        source_preview = (product_dir / "master" / "source.png").relative_to(
            self.root / "output"
        ).as_posix()
        self.review_items.append(
            {
                "product_name": record.product_name,
                "product_slug": record.product_slug,
                "category": analysis["category"],
                "preset": scene_plan["preset"],
                "status": status,
                "provider": provider_name,
                "source_preview": source_preview,
                "assets": assets,
                "prompts": prompts,
                "qa_score": round((fidelity + silhouette) / 2, 4) if all_qa else "",
                "fidelity_score": round(fidelity, 4) if all_qa else "",
                "warnings": sorted(set(warnings)),
                "estimated_cost": total_estimated,
            }
        )
        self.report_items.append(metadata)
        self.logger.info("%s: %s", record.product_slug, status)

    def _record_failure(self, record: ProductRecord, exc: Exception) -> None:
        reason = redact_secrets(str(exc))
        product_dir = self.root / "output" / "products" / record.product_slug
        failure = {
            "record": record.to_dict(),
            "status": "REJECT",
            "provider": self.options.provider,
            "error": reason,
            "warnings": ["PROCESSING_FAILED"],
        }
        write_json(product_dir / "qa" / "report.json", failure)
        write_json(product_dir / "qa" / "warnings.json", failure["warnings"])
        self.failed_items.append(failure)
        self.report_items.append(failure)
        source_preview = product_dir / "master" / "source.png"
        self.review_items.append(
            {
                "product_name": record.product_name,
                "product_slug": record.product_slug,
                "category": record.category or "unknown",
                "preset": record.scene_preset or "neutral_premium",
                "status": "REJECT",
                "provider": self.options.provider,
                "source_preview": (
                    source_preview.relative_to(self.root / "output").as_posix()
                    if source_preview.exists()
                    else None
                ),
                "assets": {},
                "prompts": {"items": {}},
                "qa_score": "",
                "fidelity_score": "",
                "warnings": ["PROCESSING_FAILED", reason],
                "estimated_cost": 0.0,
            }
        )
        self.logger.error("%s failed: %s", record.product_slug, reason)

    def run(self) -> dict[str, Any]:
        started_at = utc_now()
        records = self._select_products(read_catalog(self.root))
        if self.options.batch and not self.options.confirm_batch:
            raise RuntimeError("BATCH_REQUIRES_CONFIRMATION: add --confirm-batch.")
        plan_only = self.options.plan_only or self.options.dry_run
        provider = None
        provider_message = "PLAN_ONLY"
        if not plan_only:
            provider = self._provider()
            ready, provider_message = provider.validate_configuration()
            if not ready:
                self.logger.warning("%s Falling back to PLAN_ONLY.", provider_message)
                provider = None
                plan_only = True
        for record in records:
            try:
                self._process_product(record, provider)
            except Exception as exc:
                self._record_failure(record, exc)
        write_manifest(self.root / "manifest.csv", self.manifest_rows)
        statuses = [item["status"] for item in self.review_items]
        report = {
            "started_at": started_at,
            "finished_at": utc_now(),
            "coordinator_model": "gpt-5.6-sol",
            "image_generation_route": "built-in-imagegen",
            "external_image_providers_enabled": False,
            "mode": "PLAN_ONLY" if plan_only else "BATCH" if self.options.batch else "PILOT",
            "provider": "none" if provider is None else provider.name,
            "provider_message": provider_message,
            "products_found": len(records),
            "processed": len(self.review_items),
            "pass": statuses.count("PASS"),
            "review": statuses.count("REVIEW"),
            "reject": statuses.count("REJECT"),
            "failed": len(self.failed_items),
            "planned": statuses.count("PLANNED"),
            "api_requests": self.guard.api_requests,
            "estimated_cost": round(self.guard.estimated_cost, 6),
            "items": self.report_items,
        }
        write_json(self.root / "report.json", report)
        create_review_html(
            self.root / "output" / "review.html", self.review_items, report
        )
        zip_path = self.root / "catalog-creative-output.zip"
        create_output_zip(self.root, zip_path)
        validation = validate_outputs(self.root, zip_path)
        report["validation"] = {
            "valid": validation["valid"],
            "errors": validation["errors"],
            "manifest_rows": validation["manifest_rows"],
        }
        write_json(self.root / "report.json", report)
        if not validation["valid"]:
            raise RuntimeError("Output validation failed: " + "; ".join(validation["errors"]))
        # Rebuild once so the archived report contains the validation outcome,
        # then perform a final read-only integrity check.
        create_output_zip(self.root, zip_path)
        final_validation = validate_outputs(self.root, zip_path)
        if not final_validation["valid"]:
            raise RuntimeError(
                "Final ZIP validation failed: " + "; ".join(final_validation["errors"])
            )
        report["zip_sha256"] = final_validation["zip_sha256"]
        write_json(self.root / "report.json", report)
        return report
