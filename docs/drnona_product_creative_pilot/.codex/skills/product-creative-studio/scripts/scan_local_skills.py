from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

CATEGORY_PATTERNS = {
    "image_generation": r"image generation|generate images|imagegen|imagen|text.to.image",
    "image_editing": r"image edit|edit images|inpainting|background removal|remove background|upscal",
    "reference_analysis": r"reference analysis|reference image|reference-driven|analy[sz]e.*reference",
    "product_design": r"product design|product photography|product mockup|product image",
    "visual_design": r"visual design|creative director|design system|art direction|design brief",
    "prompt_engineering": r"prompt engineering|prompt builder|enhance prompt|prompt rules",
    "ecommerce": r"ecommerce|e-commerce|catalog product|product catalog|marketplace",
    "computer_vision": r"computer vision|segmentation|alpha mask|silhouette|opencv|vision model",
    "qa": r"quality assurance|quality control|\bqa\b|validate outputs|design audit",
    "python": r"python 3|python script|pillow|opencv",
    "openai_api": r"openai api|openai_api_key|official openai|gpt-image|image api",
}


def default_roots() -> list[Path]:
    home = Path.home()
    roots = [
        home / ".codex" / "skills",
        home / ".agents" / "skills",
        home / ".codex" / "plugins" / "cache" / "openai-bundled",
        home / ".codex" / "plugins" / "cache" / "openai-curated-remote",
        home / ".codex" / "plugins" / "cache" / "openai-primary-runtime",
    ]
    return [root for root in roots if root.exists()]


def parse_name(text: str, path: Path) -> str:
    match = re.search(r'^name:\s*["\']?([^\r\n"\']+)', text, re.MULTILINE)
    return match.group(1).strip() if match else path.parent.name


def scan(roots: list[Path]) -> dict[str, Any]:
    paths = sorted({path.resolve() for root in roots for path in root.rglob("SKILL.md")})
    records = []
    for path in paths:
        text = path.read_text(encoding="utf-8", errors="replace")
        categories = [
            category
            for category, pattern in CATEGORY_PATTERNS.items()
            if re.search(pattern, text, re.IGNORECASE)
        ]
        records.append(
            {
                "name": parse_name(text, path),
                "path": str(path),
                "categories": categories,
            }
        )
    grouped = {
        category: sorted(
            {
                record["name"]
                for record in records
                if category in record["categories"]
            }
        )
        for category in CATEGORY_PATTERNS
    }
    return {
        "roots": [str(root.resolve()) for root in roots],
        "skill_files_scanned": len(paths),
        "unique_skill_names": len({record["name"] for record in records}),
        "categories": grouped,
        "records": records,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Scan local Codex skills by capability.")
    parser.add_argument("--root", action="append", type=Path, dest="roots")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    payload = scan(args.roots or default_roots())
    rendered = json.dumps(payload, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    print(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
