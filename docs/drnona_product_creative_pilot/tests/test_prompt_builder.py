from __future__ import annotations

import unittest

from src.prompt_builder import MANDATORY_EMPTY_PLATE, build_background_prompt


class PromptBuilderTests(unittest.TestCase):
    def test_prompt_forbids_packaging_and_fake_claims(self) -> None:
        analysis = {"category": "skincare"}
        scene_plan = {
            "confirmed_ingredients": [],
            "generation_mode": "SAFE_COMPOSITE",
        }
        preset = {
            "prompt_template": "restrained premium editorial background",
            "palette": ["ivory", "sand"],
            "surface": "travertine",
            "background": "soft arch",
            "lighting": "diffused daylight",
            "camera": "eye-level 85mm",
            "layout_rules": "empty center",
            "negative_prompt": "busy scene",
        }
        built = build_background_prompt(
            "ingredients", analysis, scene_plan, preset, ["duplicate product"]
        )
        prompt = built["prompt"].lower()
        for phrase in (
            "do not generate any product",
            "bottle",
            "jar",
            "packaging",
            "label",
            "logo",
            "text",
            "empty central placement area",
            "do not imply a specific ingredient",
        ):
            self.assertIn(phrase, prompt)
        self.assertTrue(built["background_only"])


if __name__ == "__main__":
    unittest.main()
