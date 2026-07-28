from __future__ import annotations

import csv
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw

from src.catalog_reader import read_catalog


class CatalogReaderTests(unittest.TestCase):
    def test_catalog_csv_and_png_are_read(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            products = root / "input" / "products"
            products.mkdir(parents=True)
            image_path = products / "sample-cream.png"
            image = Image.new("RGBA", (300, 500), (0, 0, 0, 0))
            ImageDraw.Draw(image).rectangle((70, 40, 230, 470), fill=(245, 245, 240, 255))
            image.save(image_path)
            with Image.open(image_path) as opened:
                self.assertEqual(opened.format, "PNG")
                self.assertIn("A", opened.mode)
            catalog = root / "input" / "catalog.csv"
            with catalog.open("w", encoding="utf-8-sig", newline="") as handle:
                writer = csv.DictWriter(
                    handle,
                    fieldnames=[
                        "sku",
                        "product_name",
                        "product_slug",
                        "category",
                        "ingredients",
                        "source_filename",
                    ],
                )
                writer.writeheader()
                writer.writerow(
                    {
                        "sku": "SKU-1",
                        "product_name": "Sample Cream",
                        "product_slug": "sample-cream",
                        "category": "skincare",
                        "ingredients": "water; minerals",
                        "source_filename": image_path.name,
                    }
                )
            records = read_catalog(root)
            self.assertEqual(len(records), 1)
            self.assertEqual(records[0].product_slug, "sample-cream")
            self.assertEqual(records[0].ingredients, ["water", "minerals"])
            self.assertTrue(records[0].generate_clean)
            self.assertTrue(records[0].generate_hero)
            self.assertFalse(records[0].generate_ingredients)
            self.assertFalse(records[0].generate_lifestyle)


if __name__ == "__main__":
    unittest.main()
