from __future__ import annotations

from PIL import Image, ImageFilter


def create_reflection(
    product_layer: Image.Image,
    canvas_size: tuple[int, int],
    position: tuple[int, int],
    opacity: float = 0.12,
    blur: int = 8,
    fade_distance: float = 0.55,
) -> Image.Image:
    flipped = product_layer.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    alpha = flipped.getchannel("A")
    fade_height = max(1, int(alpha.height * fade_distance))
    fade = Image.new("L", alpha.size, 0)
    for y in range(min(fade_height, alpha.height)):
        factor = max(0.0, 1.0 - y / fade_height)
        row = alpha.crop((0, y, alpha.width, y + 1)).point(
            lambda value, f=factor: int(value * opacity * f)
        )
        fade.paste(row, (0, y))
    reflected = flipped.copy()
    reflected.putalpha(fade.filter(ImageFilter.GaussianBlur(blur)))
    canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    y = position[1] + product_layer.height
    canvas.alpha_composite(reflected, (position[0], y))
    return canvas
