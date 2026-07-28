from __future__ import annotations

import hashlib
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


COMPOSITION_VARIANTS = (
    "low central stone platform; architectural depth behind; botanical framing from the upper left; small material details in the lower right",
    "asymmetric mineral slab in the lower third; open light field behind; restrained props forming a diagonal from lower left to upper right",
    "shallow reflective foreground; tall soft arch behind; one tactile material cluster at the far left and one subtle accent at the far right",
    "editorial tabletop with a low irregular podium; fabric and natural elements restricted to the outer perimeter; light entering from the right",
)


def _composition_variant(product_slug: str) -> str:
    digest = hashlib.sha256(product_slug.encode("utf-8")).digest()
    return COMPOSITION_VARIANTS[digest[0] % len(COMPOSITION_VARIANTS)]


def _asset_direction(asset_type: str, scene_plan: dict[str, Any]) -> str:
    if asset_type == "hero":
        return (
            "Create one richly art-directed product-card hero background, not a generic "
            "empty studio. Use four to eight coherent prop or material groups around the "
            "protected placement zone, with foreground, midground, and background depth. "
            "Every prop must reinforce this product category and the selected brand world."
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
    product_slug = analysis.get("product_slug", "product")
    product_name = analysis.get("product_name", product_slug)
    composition_variant = _composition_variant(product_slug)
    confirmed = ", ".join(scene_plan.get("confirmed_ingredients", [])) or "none supplied"
    prompt = f"""Use case: product-mockup
Asset type: ecommerce {asset_type} background plate
Primary request: Create a photorealistic premium {analysis['category']} product photography background plate.
Product context: {product_name}.
Confirmed ingredient context: {confirmed}.

Scene:
{preset['prompt_template']}.
Palette: {', '.join(preset['palette'])}.
Surface: {preset['surface']}.
Background: {preset['background']}.
Lighting: {preset['lighting']}.
Camera: {preset['camera']}.

Composition:
Square 2048 x 2048 image. {preset['layout_rules']}.
Unique composition fingerprint for this SKU: {composition_variant}.
Create a clear empty central placement area for the supplied product.
{direction}
Realistic scale, tactile materials, controlled visual richness, natural contact plane,
and enough negative space for the protected product without making the scene sparse.

Protected-layer contract:
{FIDELITY_LOCK}
This generation creates the background plate only. {MANDATORY_EMPTY_PLATE}.
The final supplied product PNG will be composited into the empty central area.

Constraints:
No claims, certifications, ingredients, measurements, or benefits may be invented.
No second product. No rendered copy. No collage or split panels. No generic AI look.
Do not reuse the same arch, podium, prop layout, or lighting arrangement across SKUs."""
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
