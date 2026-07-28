from __future__ import annotations

import base64
import io
import os
import time
from pathlib import Path
from typing import Any

from PIL import Image

from .base import GenerationResult, ImageGenerationProvider


def _env_true(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


class GeminiImageProvider(ImageGenerationProvider):
    """Google Gemini image generation through the official google-genai SDK."""

    name = "gemini"

    def __init__(
        self,
        model: str | None = None,
        timeout: float = 120.0,
        max_retries: int = 3,
        allow_billable: bool | None = None,
    ) -> None:
        self.model = model or os.getenv(
            "GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image"
        )
        self.timeout = timeout
        self.max_retries = max_retries
        self.allow_billable = (
            _env_true("GEMINI_ALLOW_BILLABLE")
            if allow_billable is None
            else allow_billable
        )
        self._client: Any = None

    @staticmethod
    def _api_key() -> str | None:
        # Prefer the task-specific variable so an unrelated Google credential
        # cannot be selected accidentally.
        return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    def validate_configuration(self) -> tuple[bool, str]:
        if not self._api_key():
            return False, "GEMINI_API_KEY is not configured; PLAN_ONLY is required."
        try:
            from google import genai  # noqa: F401
        except ImportError:
            return False, "The google-genai package is not installed."
        if not self.allow_billable:
            return (
                False,
                "Gemini image generation may be billable and is blocked by the "
                "cost guard. Add --allow-billable or set "
                "GEMINI_ALLOW_BILLABLE=true after checking the current Google "
                "pricing and project tier.",
            )
        return True, f"Gemini provider ready with model {self.model}."

    def _get_client(self) -> Any:
        if self._client is None:
            from google import genai
            from google.genai import types

            self._client = genai.Client(
                api_key=self._api_key(),
                http_options=types.HttpOptions(timeout=int(self.timeout * 1000)),
            )
        return self._client

    @staticmethod
    def _aspect_ratio(size: tuple[int, int]) -> str:
        width, height = size
        if width == height:
            return "1:1"
        ratio = width / height
        supported = {
            "2:3": 2 / 3,
            "3:2": 3 / 2,
            "3:4": 3 / 4,
            "4:3": 4 / 3,
            "4:5": 4 / 5,
            "5:4": 5 / 4,
            "9:16": 9 / 16,
            "16:9": 16 / 9,
            "21:9": 21 / 9,
        }
        return min(supported, key=lambda item: abs(supported[item] - ratio))

    @staticmethod
    def _response_parts(response: Any) -> list[Any]:
        parts = list(getattr(response, "parts", None) or [])
        if parts:
            return parts
        for candidate in getattr(response, "candidates", None) or []:
            content = getattr(candidate, "content", None)
            parts.extend(getattr(content, "parts", None) or [])
        return parts

    @classmethod
    def _extract_image(cls, response: Any, size: tuple[int, int]) -> Image.Image:
        for part in cls._response_parts(response):
            inline = getattr(part, "inline_data", None)
            data = getattr(inline, "data", None) if inline is not None else None
            if not data:
                continue
            raw = base64.b64decode(data) if isinstance(data, str) else bytes(data)
            with Image.open(io.BytesIO(raw)) as source:
                image = source.convert("RGBA")
            if image.size != size:
                # Only the generated environment is resampled. The protected
                # product layer is composited later from its original pixels.
                image = image.resize(size, Image.Resampling.LANCZOS)
            return image
        raise RuntimeError("Gemini response did not contain image bytes.")

    @staticmethod
    def _usage(response: Any) -> dict[str, Any]:
        usage = getattr(response, "usage_metadata", None)
        if usage is None:
            return {}
        if hasattr(usage, "model_dump"):
            return usage.model_dump(exclude_none=True)
        return {"raw": str(usage)}

    def _request(
        self,
        contents: Any,
        size: tuple[int, int],
        operation: str,
    ) -> GenerationResult:
        ready, message = self.validate_configuration()
        if not ready:
            raise RuntimeError(message)
        from google.genai import types

        error: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                response = self._get_client().models.generate_content(
                    model=self.model,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_modalities=["IMAGE"],
                        image_config=types.ImageConfig(
                            aspect_ratio=self._aspect_ratio(size)
                        ),
                    ),
                )
                return GenerationResult(
                    image=self._extract_image(response, size),
                    provider=self.name,
                    model=self.model,
                    request_id=str(
                        getattr(response, "response_id", "")
                        or getattr(response, "id", "")
                        or ""
                    ),
                    usage=self._usage(response),
                    estimated_cost=self.estimate_cost(1, "auto", size),
                )
            except Exception as exc:
                error = exc
                if attempt >= self.max_retries:
                    break
                time.sleep(min(8.0, 1.5 * (2 ** (attempt - 1))))
        raise RuntimeError(
            f"Gemini image {operation} failed after bounded retries: {error}"
        )

    def generate_background(
        self,
        prompt: str,
        negative_prompt: str,
        size: tuple[int, int],
        quality: str,
    ) -> GenerationResult:
        full_prompt = (
            f"{prompt}\n\nAvoid: {negative_prompt}\n\n"
            "Return one image only. Do not add text, logos, packaging, products, "
            "people, hands, or watermarks."
        )
        return self._request(full_prompt, size, "generation")

    def edit_scene(
        self,
        image_path: Path,
        mask_path: Path,
        prompt: str,
        size: tuple[int, int],
        quality: str,
    ) -> GenerationResult:
        from google.genai import types

        image_bytes = image_path.read_bytes()
        mask_bytes = mask_path.read_bytes()
        contents = [
            (
                prompt
                + "\nThe first image is the source composition. The second image "
                "is a protection mask: every visible/opaque mask pixel identifies "
                "the immutable product. Change only pixels outside that protected "
                "region. Preserve the product exactly."
            ),
            types.Part.from_bytes(data=image_bytes, mime_type="image/png"),
            types.Part.from_bytes(data=mask_bytes, mime_type="image/png"),
        ]
        return self._request(contents, size, "edit")

    def estimate_cost(self, count: int, quality: str, size: tuple[int, int]) -> float:
        # Pricing and free-tier eligibility change. The user may configure a
        # current estimate after checking Google's official pricing page.
        raw = os.getenv("GEMINI_ESTIMATED_COST_PER_IMAGE_USD", "").strip()
        if not raw:
            return 0.0
        try:
            return max(0.0, float(raw)) * count
        except ValueError:
            return 0.0
