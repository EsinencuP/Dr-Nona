from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image


@dataclass
class GenerationResult:
    image: Image.Image
    provider: str
    model: str
    request_id: str = ""
    usage: dict[str, Any] | None = None
    estimated_cost: float = 0.0


class ImageGenerationProvider(ABC):
    name = "base"

    @abstractmethod
    def generate_background(
        self,
        prompt: str,
        negative_prompt: str,
        size: tuple[int, int],
        quality: str,
    ) -> GenerationResult:
        raise NotImplementedError

    def edit_scene(
        self,
        image_path: Path,
        mask_path: Path,
        prompt: str,
        size: tuple[int, int],
        quality: str,
    ) -> GenerationResult:
        raise NotImplementedError("Generative edit is not implemented by this provider.")

    def generate_candidates(
        self,
        prompt: str,
        negative_prompt: str,
        size: tuple[int, int],
        quality: str,
        count: int,
    ) -> list[GenerationResult]:
        return [
            self.generate_background(prompt, negative_prompt, size, quality)
            for _ in range(count)
        ]

    def estimate_cost(self, count: int, quality: str, size: tuple[int, int]) -> float:
        return 0.0

    @abstractmethod
    def validate_configuration(self) -> tuple[bool, str]:
        raise NotImplementedError
