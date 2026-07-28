from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import cv2
import numpy as np
from PIL import Image, ImageFilter

from .reflection import create_reflection
from .shadow import create_contact_shadow


@dataclass
class CompositeResult:
    image: Image.Image
    placed_product: Image.Image
    product_position: tuple[int, int]
    scale: float
    warnings: list[str]
    bbox: tuple[int, int, int, int]


def crop_to_alpha(image: Image.Image) -> tuple[Image.Image, tuple[int, int, int, int]]:
    rgba = image.convert("RGBA")
    bbox = rgba.getchannel("A").getbbox()
    if not bbox:
        raise ValueError("Product alpha mask is empty.")
    return rgba.crop(bbox), bbox


def _visual_center(alpha: Image.Image) -> tuple[float, float]:
    small = alpha.resize((max(1, alpha.width // 4), max(1, alpha.height // 4)))
    pixels = small.load()
    total = 0.0
    sum_x = 0.0
    sum_y = 0.0
    for y in range(small.height):
        for x in range(small.width):
            value = pixels[x, y] / 255.0
            total += value
            sum_x += x * value
            sum_y += y * value
    if total == 0:
        return alpha.width / 2, alpha.height / 2
    return (
        (sum_x / total) * (alpha.width / small.width),
        (sum_y / total) * (alpha.height / small.height),
    )


def _remove_alpha_micro_noise(image: Image.Image) -> Image.Image:
    """Remove only tiny detached resampling specks, preserving real components."""
    rgba = image.convert("RGBA")
    alpha_array = np.asarray(rgba.getchannel("A")).copy()
    count, labels, stats, _ = cv2.connectedComponentsWithStats(
        (alpha_array > 8).astype("uint8"), connectivity=8
    )
    maximum_noise_area = max(12, int(alpha_array.size * 0.000005))
    for component in range(1, count):
        if int(stats[component, cv2.CC_STAT_AREA]) <= maximum_noise_area:
            alpha_array[labels == component] = 0
    clean_alpha = Image.fromarray(alpha_array, mode="L")
    rgba.putalpha(clean_alpha)
    return rgba


def compose_product(
    product: Image.Image,
    background: Image.Image,
    fill_ratio: float,
    safe_padding_ratio: float,
    allow_upscale: bool,
    shadow_settings: dict[str, Any] | None = None,
    reflection_settings: dict[str, Any] | None = None,
    reflection_enabled: bool = False,
) -> CompositeResult:
    canvas = background.convert("RGBA")
    cropped, source_bbox = crop_to_alpha(product)
    max_w = int(canvas.width * (1.0 - 2 * safe_padding_ratio))
    max_h = int(canvas.height * fill_ratio)
    scale = min(max_w / cropped.width, max_h / cropped.height)
    warnings: list[str] = []
    if scale > 1.0 and not allow_upscale:
        scale = 1.0
        warnings.append("LOW_RESOLUTION_SOURCE")
    elif scale > 1.0:
        warnings.append("UPSCALED_SOURCE")
    resized = cropped.resize(
        (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))),
        Image.Resampling.LANCZOS,
    )
    resized = _remove_alpha_micro_noise(resized)
    if scale < 1.0:
        rgb = resized.convert("RGB").filter(ImageFilter.UnsharpMask(radius=0.8, percent=35, threshold=3))
        rgb.putalpha(resized.getchannel("A"))
        resized = rgb
    alpha = resized.getchannel("A")
    visual_x, _ = _visual_center(alpha)
    mathematical_x = resized.width / 2
    x_correction = int(max(-canvas.width * 0.03, min(canvas.width * 0.03, mathematical_x - visual_x)))
    x = (canvas.width - resized.width) // 2 + x_correction
    y = (canvas.height - resized.height) // 2
    x = max(int(canvas.width * safe_padding_ratio), min(x, canvas.width - resized.width - int(canvas.width * safe_padding_ratio)))
    y = max(int(canvas.height * safe_padding_ratio), min(y, canvas.height - resized.height - int(canvas.height * safe_padding_ratio)))

    if reflection_enabled and reflection_settings:
        reflection = create_reflection(
            resized,
            canvas.size,
            (x, y),
            opacity=min(float(reflection_settings.get("opacity_max", 0.15)), 0.15),
            blur=int(reflection_settings.get("blur", 8)),
            fade_distance=float(reflection_settings.get("fade_distance", 0.55)),
        )
        canvas = Image.alpha_composite(canvas, reflection)
    if shadow_settings and shadow_settings.get("enabled", True):
        shadow = create_contact_shadow(
            alpha,
            canvas.size,
            (x, y),
            opacity=min(float(shadow_settings.get("opacity_max", 0.20)), 0.28),
            blur=int((int(shadow_settings.get("blur_min", 18)) + int(shadow_settings.get("blur_max", 55))) / 2),
            offset=(
                int(shadow_settings.get("offset_x", 0)),
                int(shadow_settings.get("offset_y", 18)),
            ),
            perspective_compression=float(shadow_settings.get("perspective_compression", 0.30)),
        )
        canvas = Image.alpha_composite(canvas, shadow)
    canvas.alpha_composite(resized, (x, y))
    return CompositeResult(
        image=canvas,
        placed_product=resized,
        product_position=(x, y),
        scale=scale,
        warnings=warnings,
        bbox=(x, y, x + resized.width, y + resized.height),
    )
