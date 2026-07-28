from __future__ import annotations

import base64
import io
import os
import time
from pathlib import Path
from typing import Any

from PIL import Image

from .base import GenerationResult, ImageGenerationProvider


class OpenAIImageProvider(ImageGenerationProvider):
    name = "openai"

    def __init__(
        self,
        model: str | None = None,
        timeout: float = 120.0,
        max_retries: int = 3,
    ) -> None:
        self.model = model or os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-2")
        self.timeout = timeout
        self.max_retries = max_retries
        self._client: Any = None

    def validate_configuration(self) -> tuple[bool, str]:
        if not os.getenv("OPENAI_API_KEY"):
            return False, "OPENAI_API_KEY is not configured; PLAN_ONLY is required."
        try:
            from openai import OpenAI  # noqa: F401
        except ImportError:
            return False, "The openai package is not installed."
        return True, f"OpenAI provider ready with model {self.model}."

    def _get_client(self) -> Any:
        if self._client is None:
            from openai import OpenAI

            self._client = OpenAI(
                api_key=os.environ["OPENAI_API_KEY"],
                timeout=self.timeout,
                max_retries=0,
            )
        return self._client

    def generate_background(
        self,
        prompt: str,
        negative_prompt: str,
        size: tuple[int, int],
        quality: str,
    ) -> GenerationResult:
        ready, message = self.validate_configuration()
        if not ready:
            raise RuntimeError(message)
        full_prompt = f"{prompt}\n\nAvoid: {negative_prompt}"
        error: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                response = self._get_client().images.generate(
                    model=self.model,
                    prompt=full_prompt,
                    size=f"{size[0]}x{size[1]}",
                    quality=quality,
                    n=1,
                )
                item = response.data[0]
                if not getattr(item, "b64_json", None):
                    raise RuntimeError("OpenAI response did not contain image bytes.")
                raw = base64.b64decode(item.b64_json)
                image = Image.open(io.BytesIO(raw)).convert("RGBA")
                usage = (
                    response.usage.model_dump()
                    if getattr(response, "usage", None)
                    else {}
                )
                request_id = str(
                    getattr(response, "id", "")
                    or getattr(response, "_request_id", "")
                    or ""
                )
                return GenerationResult(
                    image=image,
                    provider=self.name,
                    model=self.model,
                    request_id=request_id,
                    usage=usage,
                    estimated_cost=self.estimate_cost(1, quality, size),
                )
            except Exception as exc:  # SDK normalizes HTTP/rate-limit exceptions
                error = exc
                if attempt >= self.max_retries:
                    break
                time.sleep(min(8.0, 1.5 * (2 ** (attempt - 1))))
        raise RuntimeError(f"OpenAI image generation failed after retries: {error}")

    def estimate_cost(self, count: int, quality: str, size: tuple[int, int]) -> float:
        # Pricing changes. Keep zero unless a current, user-configured price table exists.
        return 0.0

    def edit_scene(
        self,
        image_path: Path,
        mask_path: Path,
        prompt: str,
        size: tuple[int, int],
        quality: str,
    ) -> GenerationResult:
        ready, message = self.validate_configuration()
        if not ready:
            raise RuntimeError(message)
        error: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                with image_path.open("rb") as image_handle, mask_path.open("rb") as mask_handle:
                    response = self._get_client().images.edit(
                        model=self.model,
                        image=image_handle,
                        mask=mask_handle,
                        prompt=prompt,
                        size=f"{size[0]}x{size[1]}",
                        quality=quality,
                        n=1,
                    )
                item = response.data[0]
                if not getattr(item, "b64_json", None):
                    raise RuntimeError("OpenAI edit response did not contain image bytes.")
                raw = base64.b64decode(item.b64_json)
                image = Image.open(io.BytesIO(raw)).convert("RGBA")
                usage = (
                    response.usage.model_dump()
                    if getattr(response, "usage", None)
                    else {}
                )
                request_id = str(
                    getattr(response, "id", "")
                    or getattr(response, "_request_id", "")
                    or ""
                )
                return GenerationResult(
                    image=image,
                    provider=self.name,
                    model=self.model,
                    request_id=request_id,
                    usage=usage,
                    estimated_cost=self.estimate_cost(1, quality, size),
                )
            except Exception as exc:
                error = exc
                if attempt >= self.max_retries:
                    break
                time.sleep(min(8.0, 1.5 * (2 ** (attempt - 1))))
        raise RuntimeError(f"OpenAI image edit failed after retries: {error}")
