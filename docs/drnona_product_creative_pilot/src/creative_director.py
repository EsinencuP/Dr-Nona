from __future__ import annotations

from typing import Any

from .catalog_reader import ProductRecord

DEFAULT_PRESET_BY_CATEGORY = {
    "repairing skincare": "botanical_repair",
    "skincare": "neutral_premium",
    "hydration": "hydration_water",
    "cleansing": "clean_scientific",
    "mud and mineral": "mineral_recovery",
    "anti-age": "anti_age_gold",
    "perfume": "perfume_luxury",
    "tea": "herbal_tea",
    "functional drink": "clean_scientific",
    "food supplement": "clean_scientific",
    "botanical supplement": "herbal_tea",
    "haircare": "neutral_premium",
    "bodycare": "neutral_premium",
    "oral care": "clean_scientific",
    "gift set": "neutral_premium",
    "unknown": "neutral_premium",
}


def build_scene_plan(
    record: ProductRecord,
    analysis: dict[str, Any],
    references: dict[str, Any],
    presets: dict[str, Any],
    generation_mode: str = "SAFE_COMPOSITE",
) -> dict[str, Any]:
    category = analysis["category"]
    preset_id = record.scene_preset or DEFAULT_PRESET_BY_CATEGORY.get(
        category, "neutral_premium"
    )
    if analysis["classification_confidence"] < 0.70:
        preset_id = "neutral_premium"
    if preset_id not in presets:
        preset_id = "neutral_premium"
    preset = presets[preset_id]
    confirmed_ingredients = record.ingredients
    ingredient_direction = (
        confirmed_ingredients
        if confirmed_ingredients
        else ["minerals", "water", "neutral plants", "stone", "glass", "light"]
    )
    assets = []
    if record.generate_clean:
        assets.append("clean-catalog")
    if record.generate_hero:
        assets.append("hero")
    if record.generate_ingredients:
        assets.append("ingredients")
    if record.generate_lifestyle:
        assets.append("lifestyle")
    return {
        "product_slug": record.product_slug,
        "category": category,
        "preset": preset_id,
        "preset_name": preset["name"],
        "generation_mode": generation_mode,
        "protected_layer": {
            "source": record.source_path.name,
            "immutable": True,
            "preserve": [
                "logo",
                "label text",
                "packaging geometry",
                "cap and dispenser",
                "colors",
                "proportions",
                "legal information",
            ],
        },
        "assets": assets,
        "confirmed_ingredients": confirmed_ingredients,
        "ingredient_visual_direction": ingredient_direction,
        "reference_summary": references,
        "composition": {
            "hero": {
                "canvas": [2048, 2048],
                "product_height_ratio": [0.45, 0.65],
                "decor_groups": [2, 5],
                "empty_center": True,
            },
            "ingredients": {
                "canvas": [2048, 2048],
                "max_decor_groups": 5,
                "confirmed_ingredients_only": bool(confirmed_ingredients),
            },
            "lifestyle": {
                "canvas": [2048, 2048],
                "new_product_angle_forbidden": True,
            },
        },
        "needs_review": analysis["needs_review"],
    }
