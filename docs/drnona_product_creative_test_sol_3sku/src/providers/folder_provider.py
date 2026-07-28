from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageOps

from .base import GenerationResult, ImageGenerationProvider


class FolderBackgroundProvider(ImageGenerationProvider):
    """Use approved/generated background plates already present on disk."""

    name = "folder"

    def __init__(self, background_dir: Path) -> None:
        self.background_dir = background_dir
        self.product_slug = ""
        self.asset_type = ""
        self.candidate_number = 1

    def set_context(
        self, product_slug: str, asset_type: str, candidate_number: int = 1
    ) -> None:
        self.product_slug = product_slug
        self.asset_type = asset_type
        self.candidate_number = candidate_number

    def _source_path(self) -> Path:
        candidates = (
            self.background_dir
            / f"{self.product_slug}-{self.asset_type}-{self.candidate_number:02d}.png",
            self.background_dir / f"{self.product_slug}-{self.asset_type}.png",
        )
        for path in candidates:
            if path.exists():
                return path
        raise FileNotFoundError(
            "Background plate missing. Expected one of: "
            + ", ".join(str(path) for path in candidates)
        )

    def generate_background(
        self,
        prompt: str,
        negative_prompt: str,
        size: tuple[int, int],
        quality: str,
    ) -> GenerationResult:
        source = self._source_path()
        with Image.open(source) as opened:
            image = ImageOps.exif_transpose(opened).convert("RGBA")
        if image.size != size:
            image = ImageOps.fit(image, size, method=Image.Resampling.LANCZOS)
        return GenerationResult(
            image=image,
            provider=self.name,
            model="built-in-imagegen-plate",
            request_id="",
            usage={
                "source": source.name,
                "quality": quality,
                "coordinator": "gpt-5.6-sol",
                "generation_route": "built-in-imagegen",
                "external_api": False,
            },
            estimated_cost=0.0,
        )

    def validate_configuration(self) -> tuple[bool, str]:
        if not self.background_dir.exists():
            return False, f"Background directory does not exist: {self.background_dir}"
        return True, f"Folder provider ready: {self.background_dir}"
