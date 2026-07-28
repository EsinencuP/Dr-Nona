from __future__ import annotations

from pathlib import Path
from typing import Any

from PIL import Image, ImageStat

from .catalog_reader import ProductRecord
from .utils import IMAGE_SUFFIXES, load_rgba


def _summarize_image(path: Path) -> dict[str, Any]:
    image = load_rgba(path).convert("RGB")
    image.thumbnail((256, 256))
    stat = ImageStat.Stat(image)
    mean = [round(value, 2) for value in stat.mean[:3]]
    temperature = "warm" if mean[0] > mean[2] + 8 else "cool" if mean[2] > mean[0] + 8 else "neutral"
    brightness = sum(mean) / 3
    return {
        "file": str(path),
        "mean_rgb": mean,
        "temperature": temperature,
        "brightness": round(brightness, 2),
        "visual_density": "light" if brightness > 190 else "balanced",
    }


def analyze_references(project_root: Path, record: ProductRecord, category: str) -> dict[str, Any]:
    refs_root = project_root / "input" / "references"
    candidates: list[tuple[int, str, Path]] = []
    if record.reference_image:
        path = refs_root / record.reference_image
        if path.exists():
            candidates.append((0, "product_reference", path))
    for path in refs_root.rglob("*"):
        if path.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        stem = path.stem.lower()
        if record.product_slug in stem:
            candidates.append((0, "product_reference", path))
        elif category.replace(" ", "-") in stem:
            candidates.append((1, "category_reference", path))
        else:
            candidates.append((2, "global_reference", path))
    selected = sorted(candidates, key=lambda item: (item[0], str(item[2])))[:5]
    return {
        "priority_order": [
            "product_reference",
            "category_reference",
            "global_reference",
            "preset_defaults",
        ],
        "selected": [
            {"kind": kind, **_summarize_image(path)} for _, kind, path in selected
        ],
        "copy_policy": "Analyze visual direction only; never copy logos, text, or packaging.",
    }
