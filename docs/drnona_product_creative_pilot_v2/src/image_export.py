from __future__ import annotations

from pathlib import Path

from PIL import Image

from .utils import save_png, save_webp


def export_asset(
    image: Image.Image,
    png_path: Path,
    webp_path: Path,
    webp_quality: int = 92,
    compress_level: int = 6,
) -> None:
    save_png(image, png_path, compress_level)
    save_webp(image, webp_path, webp_quality)


def export_thumbnail(image: Image.Image, path: Path, size: int = 800, quality: int = 88) -> None:
    thumb = image.copy()
    thumb.thumbnail((size, size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (248, 247, 244, 255))
    canvas.alpha_composite(thumb, ((size - thumb.width) // 2, (size - thumb.height) // 2))
    path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(path, "WEBP", quality=quality, method=6)
