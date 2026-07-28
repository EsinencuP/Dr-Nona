from __future__ import annotations

import csv
from pathlib import Path
from typing import Any

FIELDS = [
    "sku",
    "product_name",
    "product_slug",
    "category",
    "preset",
    "source_filename",
    "asset_type",
    "candidate_number",
    "output_filename",
    "provider",
    "model",
    "prompt_hash",
    "source_sha256",
    "output_sha256",
    "width",
    "height",
    "quality",
    "generation_mode",
    "api_request_id",
    "api_attempts",
    "estimated_cost",
    "qa_status",
    "product_fidelity_score",
    "silhouette_score",
    "scene_detail_score",
    "scene_similarity_max",
    "background_text_detected",
    "duplicate_product_detected",
    "warnings",
    "created_at",
    "processing_time_seconds",
]


def write_manifest(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in FIELDS})
