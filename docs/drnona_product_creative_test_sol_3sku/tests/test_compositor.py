from __future__ import annotations

import unittest

import cv2
import numpy as np
from PIL import Image, ImageDraw

from src.compositor import compose_product


class CompositorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.product = Image.new("RGBA", (240, 480), (0, 0, 0, 0))
        draw = ImageDraw.Draw(self.product)
        draw.rounded_rectangle((40, 20, 200, 460), radius=24, fill=(245, 242, 230, 255))

    def test_product_stays_inside_canvas_and_keeps_ratio(self) -> None:
        background = Image.new("RGBA", (1600, 1600), (248, 247, 244, 255))
        result = compose_product(
            self.product,
            background,
            fill_ratio=0.78,
            safe_padding_ratio=0.08,
            allow_upscale=True,
            shadow_settings={"enabled": True, "opacity_max": 0.18, "blur_min": 18, "blur_max": 30},
        )
        x0, y0, x1, y1 = result.bbox
        self.assertGreater(x0, 0)
        self.assertGreater(y0, 0)
        self.assertLess(x1, 1600)
        self.assertLess(y1, 1600)
        source_ratio = 160 / 440
        placed_ratio = result.placed_product.width / result.placed_product.height
        self.assertAlmostEqual(source_ratio, placed_ratio, places=2)
        self.assertEqual(result.image.size, (1600, 1600))

    def test_clean_product_mask_has_one_component(self) -> None:
        background = Image.new("RGBA", (1600, 1600), (248, 247, 244, 255))
        result = compose_product(
            self.product,
            background,
            fill_ratio=0.78,
            safe_padding_ratio=0.08,
            allow_upscale=True,
        )
        mask = np.asarray(result.placed_product.getchannel("A"))
        components, _, _, _ = cv2.connectedComponentsWithStats((mask > 8).astype("uint8"))
        self.assertEqual(components - 1, 1)


if __name__ == "__main__":
    unittest.main()
