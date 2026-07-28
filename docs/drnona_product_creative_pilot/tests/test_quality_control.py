from __future__ import annotations

import json
import logging
import tempfile
import unittest
import zipfile
from pathlib import Path

from PIL import Image

from src.exporter import create_output_zip, validate_outputs
from src.manifest import write_manifest
from src.pipeline import CatalogCreativePipeline, PipelineOptions
from src.review_gallery import create_review_html
from src.utils import SecretRedactionFilter, configure_logging, redact_secrets, write_json


class QualityAndSecurityTests(unittest.TestCase):
    def test_secret_redaction(self) -> None:
        secret = "sk-" + "A" * 28
        self.assertNotIn(secret, redact_secrets(f"api_key={secret}"))
        gemini_secret = "AIza" + "B" * 32
        self.assertNotIn(gemini_secret, redact_secrets(gemini_secret))
        record = logging.LogRecord("x", logging.INFO, "", 0, secret, (), None)
        SecretRedactionFilter().filter(record)
        self.assertEqual(record.msg, "[REDACTED]")

    def test_batch_requires_confirmation(self) -> None:
        root = Path(__file__).resolve().parent.parent
        pipeline = CatalogCreativePipeline(
            root,
            PipelineOptions(plan_only=False, batch=True, confirm_batch=False),
            configure_logging(),
        )
        with self.assertRaisesRegex(RuntimeError, "BATCH_REQUIRES_CONFIRMATION"):
            pipeline.run()

    def test_review_manifest_and_secure_zip(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "output" / "approved" / "sample").mkdir(parents=True)
            (root / "output" / "products" / "sample" / "plans").mkdir(parents=True)
            png = root / "output" / "approved" / "sample" / "01-clean-catalog.png"
            Image.new("RGBA", (1600, 1600), (0, 0, 0, 0)).save(png)
            (root / "README.md").write_text("Safe output", encoding="utf-8")
            (root / ".env").write_text(
                "SECRET_VALUE_SHOULD_NOT_BE_ARCHIVED=fixture", encoding="utf-8"
            )
            (root / "output" / "products" / "sample" / "plans" / "prompts.json").write_text(
                "{}", encoding="utf-8"
            )
            create_review_html(
                root / "output" / "review.html",
                [
                    {
                        "product_name": "Sample",
                        "product_slug": "sample",
                        "category": "skincare",
                        "preset": "neutral_premium",
                        "status": "PASS",
                        "provider": "mock",
                        "source_preview": None,
                        "assets": {},
                        "prompts": {"items": {}},
                        "warnings": [],
                    }
                ],
                {"products_found": 1, "api_requests": 0, "estimated_cost": 0},
            )
            write_manifest(
                root / "manifest.csv",
                [
                    {
                        "product_slug": "sample",
                        "output_filename": png.relative_to(root).as_posix(),
                    }
                ],
            )
            write_json(root / "report.json", {"products_found": 1})
            zip_path = root / "catalog-creative-output.zip"
            create_output_zip(root, zip_path)
            self.assertTrue(zipfile.is_zipfile(zip_path))
            with zipfile.ZipFile(zip_path) as archive:
                names = archive.namelist()
                self.assertFalse(any(name.lower().endswith(".env") for name in names))
                self.assertIn("output/review.html", names)
                self.assertIn("manifest.csv", names)
            result = validate_outputs(root, zip_path)
            self.assertTrue(result["valid"], result["errors"])


if __name__ == "__main__":
    unittest.main()
