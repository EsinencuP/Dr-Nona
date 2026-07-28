from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from PIL import Image

from src.providers.folder_provider import FolderBackgroundProvider


class FolderProviderTests(unittest.TestCase):
    def test_loads_product_specific_background(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "sample-hero.png"
            Image.new("RGB", (500, 300), (12, 80, 120)).save(source)
            provider = FolderBackgroundProvider(root)
            provider.set_context("sample", "hero")
            ready, _ = provider.validate_configuration()
            self.assertTrue(ready)
            result = provider.generate_background("", "", (256, 256), "high")
            self.assertEqual(result.image.size, (256, 256))
            self.assertEqual(result.provider, "folder")
            self.assertEqual(result.estimated_cost, 0.0)


if __name__ == "__main__":
    unittest.main()
