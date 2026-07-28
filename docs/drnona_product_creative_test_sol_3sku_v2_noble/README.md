# Catalog Creative Agent

This project creates a fidelity-safe ecommerce product-card pair:

- `01-clean-card.png`: noble 1600x1600 site-palette packshot with a restrained contact shadow;
- `02-hero.png`: one richly art-directed 2048x2048 environmental scene.

The transparent product master remains in `master/normalized.png` and is never
regenerated. GPT-5.6-sol plans the scene, the built-in
Codex `imagegen` tool creates only an empty background plate, and the local
Python compositor places the original product pixels on top. Gemini, OpenAI
image APIs, and other external providers are disabled.

Clean cards use `#F7FBFC` by default. Products in the Lord line use deep navy
`#071827`. Heroes keep the product at roughly 40-50% of image height, anchor it
to a physical surface line, and reserve props for the outer frame.

Optional ingredient and lifestyle slots remain available only when explicitly
enabled in metadata and when they add a genuinely distinct product-page role.

## Install on Windows

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Python 3.11+ and CPU execution are supported. No API key or `.env` file is
required.

## Input

Place transparent product PNGs in `input/products/`. Optionally add metadata in
`input/catalog.csv`, reference images in `input/references/`, and brand assets
in `input/brand/`.

Before running the pilot, use built-in `imagegen` to create one empty background
plate per creative asset and save it as:

```text
input/backgrounds/<product-slug>-hero.png
```

The plate must contain no product, container, package, logo, label, text,
watermark, person, or hand.

## Commands

```powershell
python -m src.cli --plan-only
python -m src.cli --pilot --provider folder --max-products 5
python -m src.cli --pilot --provider folder --product halo-dynamic-cream
python -m src.cli --batch --provider folder --confirm-batch --skip-existing
python -m src.cli --validate
.\validate.ps1
```

The `mock` provider is available only for deterministic mechanics tests. Its
creative outputs are always marked `REVIEW` with `MOCK_PROVIDER_TEST_ONLY`.

## Metadata defaults

`generate_clean=true` and `generate_hero=true`. `generate_ingredients=false`
and `generate_lifestyle=false` unless explicitly enabled.

Use confirmed metadata before inference. Never invent ingredients, benefits,
medical claims, certifications, measurements, package variants, or new angles.
Opaque or doubtful source images must be prepared before creative generation.

## QA and output

QA checks alpha, crop, dimensions, product fidelity, silhouette, scene detail,
cross-product perceptual similarity, output integrity, prompt logs, manifest,
review gallery, and secure ZIP contents. Results are `PASS`, `REVIEW`, or
`REJECT`. Open `output/review.html` for human review.

The final ZIP is `catalog-creative-output.zip`. It includes approved/review
assets, prompts, manifest, report, gallery, and this README. It excludes `.env`,
keys, temporary files, caches, source inputs, and sensitive logs.

## Limitations

- A 2D source PNG cannot safely create a genuinely new product angle.
- Small sources are not silently upscaled.
- Built-in generation can fail for one scene; the pipeline records the missing
  slot and continues.
- Final art direction and legal/claim compliance require human review.
