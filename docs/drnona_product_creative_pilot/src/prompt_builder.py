from __future__ import annotations

from typing import Any

MANDATORY_EMPTY_PLATE = (
    "do not generate any product, container, bottle, jar, box, packaging, "
    "label, logo, text, letters, watermark, person, hand or face"
)
FIDELITY_LOCK = (
    "The supplied real product is an immutable protected layer. Preserve its exact "
    "shape, silhouette, color, material, logo and label placement, visible "
    "construction details, and proportions. Do not redesign the product."
)


def _asset_direction(asset_type: str, scene_plan: dict[str, Any]) -> str:
    if asset_type == "hero":
        return (
            "Create a premium page-hero background plate. Keep two to five restrained "
            "decorative elements in the lower third and outer edges."
        )
    if asset_type == "ingredients":
        if scene_plan["confirmed_ingredients"]:
            ingredients = ", ".join(scene_plan["confirmed_ingredients"])
            return (
                "Create an ingredient-led background using only these confirmed ingredients: "
                f"{ingredients}. Keep them outside the central label zone."
            )
        return (
            "Create an abstract materials composition using only neutral minerals, water, "
            "stone, glass, light, and non-specific restrained botanical forms. Do not imply "
            "a specific ingredient."
        )
    return (
        "Create a calm lifestyle/detail background with a plausible product ritual, "
        "without hands, people, a new product angle, or invented package components."
    )


def build_background_prompt(
    asset_type: str,
    analysis: dict[str, Any],
    scene_plan: dict[str, Any],
    preset: dict[str, Any],
    global_negative: list[str],
) -> dict[str, str]:
    direction = _asset_direction(asset_type, scene_plan)
    prompt = f"""Use case: product-mockup
Asset type: ecommerce {asset_type} background plate
Primary request: Create a photorealistic premium {analysis['category']} product photography background plate.

Scene:
{preset['prompt_template']}.
Palette: {', '.join(preset['palette'])}.
Surface: {preset['surface']}.
Background: {preset['background']}.
Lighting: {preset['lighting']}.
Camera: {preset['camera']}.

Composition:
Square 2048 x 2048 image. {preset['layout_rules']}.
Create a clear empty central placement area for the supplied product.
{direction}
Realistic scale, realistic materials, generous negative space.

Protected-layer contract:
{FIDELITY_LOCK}
This generation creates the background plate only. {MANDATORY_EMPTY_PLATE}.
The final supplied product PNG will be composited into the empty central area.

Constraints:
No claims, certifications, ingredients, measurements, or benefits may be invented.
No second product. No rendered copy. No generic AI look."""
    negative = ", ".join(
        dict.fromkeys(
            global_negative
            + [preset.get("negative_prompt", "")]
            + [
                "duplicate product",
                "fake package",
                "unreadable text",
                "busy scene",
                "dark background",
                "neon",
                "floating objects",
                "distorted geometry",
            ]
        )
    )
    return {
        "asset_type": asset_type,
        "prompt": prompt.strip(),
        "negative_prompt": negative,
        "fidelity_lock": FIDELITY_LOCK,
        "background_only": True,
    }


def build_prompts(
    analysis: dict[str, Any],
    scene_plan: dict[str, Any],
    preset: dict[str, Any],
    global_negative: list[str],
) -> dict[str, Any]:
    prompts: dict[str, Any] = {
        "workflow": "product-creative-studio",
        "generation_mode": scene_plan["generation_mode"],
        "protected_product": True,
        "items": {},
    }
    for asset_type in ("hero", "ingredients", "lifestyle"):
        if asset_type in scene_plan["assets"]:
            prompts["items"][asset_type] = build_background_prompt(
                asset_type, analysis, scene_plan, preset, global_negative
            )
    return prompts
