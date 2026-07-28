from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import Any

from PIL import Image

from .catalog_reader import ProductRecord
from .utils import load_rgba

CATEGORY_KEYWORDS: list[tuple[str, tuple[str, ...]]] = [
    ("perfume", ("perfume", "parfum", "fragrance", "eau-de")),
    ("tea", ("tea", "chai", "herbal")),
    ("oral care", ("mouthwash", "tooth", "oral")),
    ("haircare", ("shampoo", "hair", "conditioner")),
    ("bodycare", ("body", "hand", "foot", "lotion")),
    ("cleansing", ("cleanser", "cleansing", "soap", "mousse")),
    ("hydration", ("hydration", "moisture", "aqua")),
    ("anti-age", ("anti-age", "antiage", "age-control", "lifting")),
    ("mud and mineral", ("mud", "mineral", "salt")),
    ("repairing skincare", ("repair", "restor", "dynamic")),
    ("food supplement", ("supplement", "capsule", "tablet", "vitamin")),
    ("functional drink", ("drink", "choco", "coffee", "focus")),
    ("gift set", ("set", "kit", "collection")),
    ("skincare", ("cream", "mask", "serum", "face", "skin")),
]


def _dominant_colors(image: Image.Image, count: int = 3) -> list[str]:
    rgb = image.convert("RGB")
    rgb.thumbnail((128, 128))
    colors = Counter(rgb.getdata()).most_common(count)
    return ["#%02x%02x%02x" % color for color, _ in colors]


def analyze_product(record: ProductRecord, review_threshold: float = 0.70) -> dict[str, Any]:
    image = load_rgba(record.source_path)
    width, height = image.size
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    alpha_extrema = alpha.getextrema()
    transparent = alpha_extrema[0] < 255
    low_resolution = max(width, height) < 800
    text = " ".join(
        (
            record.product_name,
            record.product_slug,
            record.category,
            record.subcategory,
            record.product_line,
        )
    ).lower()
    category = record.category if record.category else "unknown"
    confidence = 0.99 if record.category else 0.35
    evidence: list[str] = ["catalog metadata"] if record.category else []
    if not record.category:
        for candidate, words in CATEGORY_KEYWORDS:
            hits = [word for word in words if word in text]
            if hits:
                category = candidate
                confidence = min(0.92, 0.68 + 0.08 * len(hits))
                evidence = hits
                break
    aspect = width / max(height, 1)
    if aspect < 0.65:
        package_type = "tall bottle or tube"
    elif aspect > 1.35:
        package_type = "wide box or set"
    else:
        package_type = "jar, bottle, or box"
    warnings: list[str] = []
    if not bbox:
        warnings.append("EMPTY_ALPHA_MASK")
    if not transparent:
        warnings.append("BACKGROUND_NOT_TRANSPARENT")
    if low_resolution:
        warnings.append("LOW_RESOLUTION_SOURCE")
    return {
        "product_name": record.product_name,
        "product_slug": record.product_slug,
        "source_filename": record.source_path.name,
        "category": category,
        "classification_confidence": round(confidence, 4),
        "classification_evidence": evidence,
        "needs_review": (
            confidence < review_threshold or not transparent or low_resolution
        ),
        "package_type": package_type,
        "source_width": width,
        "source_height": height,
        "has_transparency": transparent,
        "low_resolution": low_resolution,
        "alpha_bbox": list(bbox) if bbox else None,
        "dominant_colors": _dominant_colors(image),
        "confirmed_ingredients": record.ingredients,
        "ingredient_policy": (
            "confirmed-only" if record.ingredients else "abstract-materials-only"
        ),
        "warnings": warnings,
    }
