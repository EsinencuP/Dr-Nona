from __future__ import annotations

import hashlib
import uuid
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

from .base import GenerationResult, ImageGenerationProvider


class MockImageProvider(ImageGenerationProvider):
    name = "mock"

    def generate_background(
        self,
        prompt: str,
        negative_prompt: str,
        size: tuple[int, int],
        quality: str,
    ) -> GenerationResult:
        seed = hashlib.sha256(prompt.encode("utf-8")).digest()
        base = (238 + seed[0] % 12, 235 + seed[1] % 12, 228 + seed[2] % 16)
        accent = (205 + seed[3] % 20, 198 + seed[4] % 20, 183 + seed[5] % 25)
        image = Image.new("RGB", size, base)
        draw = ImageDraw.Draw(image, "RGBA")
        w, h = size
        draw.rounded_rectangle(
            (int(w * 0.05), int(h * 0.08), int(w * 0.95), int(h * 0.93)),
            radius=int(w * 0.16),
            outline=(*accent, 75),
            width=max(2, w // 220),
        )
        draw.ellipse(
            (int(w * 0.16), int(h * 0.78), int(w * 0.84), int(h * 1.02)),
            fill=(*accent, 65),
        )
        image = image.filter(ImageFilter.GaussianBlur(max(2, w // 350)))
        return GenerationResult(
            image=image.convert("RGBA"),
            provider=self.name,
            model="deterministic-mock",
            request_id=f"mock-{uuid.uuid4().hex[:12]}",
            usage={"mock": True, "quality": quality},
        )

    def validate_configuration(self) -> tuple[bool, str]:
        return True, "Mock provider ready."

    def edit_scene(
        self,
        image_path: Path,
        mask_path: Path,
        prompt: str,
        size: tuple[int, int],
        quality: str,
    ) -> GenerationResult:
        base = Image.open(image_path).convert("RGBA").resize(size)
        mask = Image.open(mask_path).convert("RGBA").resize(size).getchannel("A")
        background = self.generate_background(prompt, "", size, quality).image
        protected = base.copy()
        protected.putalpha(mask)
        background.alpha_composite(protected)
        return GenerationResult(
            image=background,
            provider=self.name,
            model="deterministic-mock-edit",
            request_id=f"mock-edit-{uuid.uuid4().hex[:12]}",
            usage={"mock": True, "edit": True, "quality": quality},
        )
