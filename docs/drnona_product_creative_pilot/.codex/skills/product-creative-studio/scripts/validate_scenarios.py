from __future__ import annotations

import argparse
import json
import logging
import os
import shutil
import sys
import tempfile
from pathlib import Path
from typing import Any, Callable
from unittest.mock import patch

from PIL import Image, ImageDraw

sys.dont_write_bytecode = True

SKILL_ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_ROOT = SKILL_ROOT / "assets" / "catalog-creative-agent"
if not TEMPLATE_ROOT.exists():
    project_candidate = SKILL_ROOT.parents[2]
    if (project_candidate / "src" / "cli.py").exists():
        TEMPLATE_ROOT = project_candidate
    else:
        raise RuntimeError(
            "Catalog Creative Agent template was not found in the skill assets "
            "or around the project-local skill."
        )
sys.path.insert(0, str(TEMPLATE_ROOT))

from src.catalog_reader import ProductRecord, read_catalog  # noqa: E402
from src.creative_director import build_scene_plan  # noqa: E402
from src.pipeline import CatalogCreativePipeline, PipelineOptions  # noqa: E402
from src.product_analyzer import analyze_product  # noqa: E402
from src.prompt_builder import build_prompts  # noqa: E402
from src.providers.gemini_provider import GeminiImageProvider  # noqa: E402
from src.utils import load_yaml  # noqa: E402


def create_product(
    path: Path,
    size: tuple[int, int] = (900, 1200),
    transparent: bool = True,
    box: bool = False,
) -> None:
    background = (0, 0, 0, 0) if transparent else (244, 242, 236, 255)
    image = Image.new("RGBA", size, background)
    draw = ImageDraw.Draw(image)
    w, h = size
    draw.rounded_rectangle(
        (int(w * 0.32), int(h * 0.12), int(w * 0.68), int(h * 0.90)),
        radius=max(8, int(w * 0.05)),
        fill=(241, 237, 225, 255),
        outline=(154, 119, 68, 255),
        width=max(2, w // 120),
    )
    draw.rectangle(
        (int(w * 0.36), int(h * 0.06), int(w * 0.64), int(h * 0.20)),
        fill=(176, 137, 77, 255),
    )
    if box:
        draw.rectangle(
            (int(w * 0.05), int(h * 0.25), int(w * 0.28), int(h * 0.88)),
            fill=(231, 225, 210, 255),
            outline=(130, 98, 58, 255),
            width=max(2, w // 150),
        )
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "PNG")


def fresh_project(base: Path, name: str) -> Path:
    root = base / name
    shutil.copytree(TEMPLATE_ROOT, root)
    return root


def analyze_case(root: Path, filename: str) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    path = root / "input" / "products" / filename
    record = ProductRecord(
        source_path=path,
        product_name=path.stem.replace("-", " ").title(),
        product_slug=path.stem,
    )
    settings = load_yaml(root / "config" / "settings.yaml")
    presets = load_yaml(root / "config" / "scene-presets.yaml")["presets"]
    negatives = load_yaml(root / "config" / "negative-prompts.yaml")["global"]
    analysis = analyze_product(
        record, float(settings["qa"]["classification_review_threshold"])
    )
    scene = build_scene_plan(
        record,
        analysis,
        {"selected": [], "priority_order": [], "copy_policy": "test"},
        presets,
        "SAFE_COMPOSITE",
    )
    prompts = build_prompts(analysis, scene, presets[scene["preset"]], negatives)
    return analysis, scene, prompts


def run_scenarios() -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    with tempfile.TemporaryDirectory(prefix="product-creative-scenarios-") as temp:
        base = Path(temp)

        def run(name: str, fn: Callable[[], dict[str, Any]]) -> None:
            try:
                details = fn()
                results.append({"scenario": name, "status": "PASS", "details": details})
            except Exception as exc:
                results.append(
                    {"scenario": name, "status": "FAIL", "error": str(exc)}
                )

        def category_scenario(
            key: str,
            filename: str,
            expected_category: str,
            expected_preset: str,
            box: bool = False,
        ) -> dict[str, Any]:
            root = fresh_project(base, key)
            create_product(root / "input" / "products" / filename, box=box)
            analysis, scene, prompts = analyze_case(root, filename)
            assert analysis["category"] == expected_category, analysis
            assert scene["preset"] == expected_preset, scene
            for item in prompts["items"].values():
                assert "do not generate any product" in item["prompt"].lower()
            return {
                "category": analysis["category"],
                "preset": scene["preset"],
                "protected_prompt": True,
            }

        run(
            "cosmetic_jar",
            lambda: category_scenario(
                "s01", "repair-face-cream.png", "repairing skincare", "botanical_repair"
            ),
        )
        run(
            "perfume_with_box",
            lambda: category_scenario(
                "s02", "luxury-eau-de-parfum.png", "perfume", "perfume_luxury", True
            ),
        )
        run(
            "tea_box",
            lambda: category_scenario(
                "s03", "herbal-focus-tea.png", "tea", "herbal_tea", True
            ),
        )
        run(
            "powdered_food_supplement",
            lambda: category_scenario(
                "s04",
                "wellness-powder-supplement.png",
                "food supplement",
                "clean_scientific",
            ),
        )

        def no_metadata() -> dict[str, Any]:
            root = fresh_project(base, "s05")
            filename = "item-005.png"
            create_product(root / "input" / "products" / filename)
            analysis, scene, _ = analyze_case(root, filename)
            assert analysis["category"] == "unknown"
            assert analysis["needs_review"] is True
            assert scene["preset"] == "neutral_premium"
            return {"category": "unknown", "needs_review": True}

        run("product_without_metadata", no_metadata)

        def low_resolution() -> dict[str, Any]:
            root = fresh_project(base, "s06")
            filename = "small-face-cream.png"
            create_product(root / "input" / "products" / filename, size=(220, 320))
            analysis, _, _ = analyze_case(root, filename)
            assert "LOW_RESOLUTION_SOURCE" in analysis["warnings"]
            return {"warnings": analysis["warnings"]}

        run("low_resolution_product", low_resolution)

        def opaque_background() -> dict[str, Any]:
            root = fresh_project(base, "s07")
            filename = "opaque-face-cream.png"
            create_product(
                root / "input" / "products" / filename, transparent=False
            )
            logger = logging.getLogger("scenario-opaque")
            report = CatalogCreativePipeline(
                root, PipelineOptions(plan_only=True), logger
            ).run()
            assert report["review"] == 1
            assert report["validation"]["manifest_rows"] == 0
            return {
                "status": "REVIEW",
                "generation_blocked": True,
                "required_skill": "prepare-catalog-product-images",
            }

        run("product_without_transparent_background", opaque_background)

        def catalog_55() -> dict[str, Any]:
            root = fresh_project(base, "s08")
            products = root / "input" / "products"
            for index in range(55):
                create_product(products / f"catalog-cream-{index + 1:02d}.png")
            assert len(read_catalog(root)) == 55
            pipeline = CatalogCreativePipeline(
                root,
                PipelineOptions(
                    plan_only=False, batch=True, confirm_batch=False
                ),
                logging.getLogger("scenario-55"),
            )
            try:
                pipeline.run()
            except RuntimeError as exc:
                assert "BATCH_REQUIRES_CONFIRMATION" in str(exc)
            else:
                raise AssertionError("Batch confirmation gate did not trigger.")
            return {"products": 55, "batch_confirmation_required": True}

        run("catalog_of_55_files", catalog_55)

        def missing_api_key() -> dict[str, Any]:
            with patch.dict(os.environ, {}, clear=True):
                ready, message = GeminiImageProvider().validate_configuration()
            assert ready is False
            assert "PLAN_ONLY" in message
            return {
                "provider": "gemini",
                "provider_ready": False,
                "fallback": "PLAN_ONLY",
            }

        run("missing_api_key", missing_api_key)

        def one_generation_failure() -> dict[str, Any]:
            root = fresh_project(base, "s10")
            products = root / "input" / "products"
            create_product(products / "first-face-cream.png")
            create_product(products / "second-face-cream.png")
            pipeline = CatalogCreativePipeline(
                root,
                PipelineOptions(plan_only=True),
                logging.getLogger("scenario-failure"),
            )
            original = pipeline._process_product
            calls = {"count": 0}

            def fail_once(record, provider):
                calls["count"] += 1
                if calls["count"] == 1:
                    raise RuntimeError("simulated single-image generation failure")
                return original(record, provider)

            pipeline._process_product = fail_once  # type: ignore[method-assign]
            report = pipeline.run()
            assert report["failed"] == 1, report
            assert report["processed"] == 2, report
            assert report["pass"] + report["review"] >= 1, report
            return {
                "failed": report["failed"],
                "processed": report["processed"],
                "batch_continued": True,
            }

        run("single_image_generation_failure", one_generation_failure)
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate ten Product Creative Studio scenarios.")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    results = run_scenarios()
    payload = {
        "scenarios": results,
        "passed": sum(item["status"] == "PASS" for item in results),
        "failed": sum(item["status"] == "FAIL" for item in results),
    }
    rendered = json.dumps(payload, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    print(rendered)
    return 0 if payload["failed"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
