from __future__ import annotations

import io
import os
import unittest
from unittest.mock import patch

from PIL import Image

from src.providers.gemini_provider import GeminiImageProvider


class _InlineData:
    def __init__(self, data: bytes) -> None:
        self.data = data


class _Part:
    def __init__(self, data: bytes) -> None:
        self.inline_data = _InlineData(data)


class _Response:
    def __init__(self, data: bytes) -> None:
        self.parts = [_Part(data)]
        self.response_id = "offline-fixture"
        self.usage_metadata = None


class _Models:
    def __init__(self, response: _Response) -> None:
        self.response = response
        self.calls = 0

    def generate_content(self, **kwargs):
        self.calls += 1
        return self.response


class _Client:
    def __init__(self, response: _Response) -> None:
        self.models = _Models(response)


class GeminiProviderTests(unittest.TestCase):
    def test_missing_key_falls_back_to_plan_only(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            ready, message = GeminiImageProvider().validate_configuration()
        self.assertFalse(ready)
        self.assertIn("GEMINI_API_KEY", message)
        self.assertIn("PLAN_ONLY", message)

    def test_key_does_not_bypass_billable_guard(self) -> None:
        with patch.dict(
            os.environ,
            {"GEMINI_API_KEY": "AIza" + "A" * 32},
            clear=True,
        ):
            ready, message = GeminiImageProvider(
                allow_billable=False
            ).validate_configuration()
        self.assertFalse(ready)
        self.assertIn("--allow-billable", message)

    def test_generated_environment_can_be_normalized_to_canvas(self) -> None:
        buffer = io.BytesIO()
        Image.new("RGB", (1024, 1024), "ivory").save(buffer, "PNG")
        result = GeminiImageProvider._extract_image(
            _Response(buffer.getvalue()), (2048, 2048)
        )
        self.assertEqual(result.mode, "RGBA")
        self.assertEqual(result.size, (2048, 2048))

    def test_generation_path_uses_official_sdk_shape_without_network(self) -> None:
        buffer = io.BytesIO()
        Image.new("RGB", (1024, 1024), "ivory").save(buffer, "PNG")
        provider = GeminiImageProvider(allow_billable=True, max_retries=1)
        provider._client = _Client(_Response(buffer.getvalue()))
        with patch.dict(
            os.environ,
            {"GEMINI_API_KEY": "AIza" + "A" * 32},
            clear=True,
        ):
            result = provider.generate_background(
                "Empty premium background", "text, product", (2048, 2048), "high"
            )
        self.assertEqual(result.provider, "gemini")
        self.assertEqual(result.request_id, "offline-fixture")
        self.assertEqual(result.image.size, (2048, 2048))
        self.assertEqual(provider._client.models.calls, 1)


if __name__ == "__main__":
    unittest.main()
