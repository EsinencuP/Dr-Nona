from __future__ import annotations

from PIL import Image, ImageFilter


def create_contact_shadow(
    alpha: Image.Image,
    canvas_size: tuple[int, int],
    position: tuple[int, int],
    opacity: float = 0.18,
    blur: int = 36,
    offset: tuple[int, int] = (0, 18),
    perspective_compression: float = 0.30,
) -> Image.Image:
    # A contact shadow is derived only from the product's bottom band. Compressing
    # the full silhouette creates an unrealistic vertical grey duplicate.
    band_height = max(4, int(alpha.height * 0.12))
    bottom_band = alpha.crop((0, alpha.height - band_height, alpha.width, alpha.height))
    compressed_height = max(3, int(band_height * perspective_compression))
    base_mask = bottom_band.resize(
        (alpha.width, compressed_height), Image.Resampling.LANCZOS
    )
    base_mask = base_mask.point(lambda value: int(value * opacity))
    padding = max(2, blur * 2)
    shadow_mask = Image.new(
        "L",
        (base_mask.width + padding * 2, base_mask.height + padding * 2),
        0,
    )
    shadow_mask.paste(base_mask, (padding, padding))
    shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(blur))
    shadow = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    base_x = position[0] + offset[0] - padding
    base_y = (
        position[1]
        + alpha.height
        - compressed_height // 2
        + offset[1]
        - padding
    )
    layer = Image.new("RGBA", shadow_mask.size, (25, 20, 15, 0))
    layer.putalpha(shadow_mask)
    shadow.alpha_composite(layer, (base_x, base_y))
    return shadow
