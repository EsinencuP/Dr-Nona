# Catalog Creative Agent

`catalog-creative-agent` creates consistent ecommerce product imagery while
keeping the real product PNG as a protected, immutable layer. The default
`SAFE_COMPOSITE` workflow generates only an empty background plate and places
the original product pixels on top locally.

The reusable Codex skill is installed as `$product-creative-studio`. It scans
available local skills and routes bounded stages to image generation,
preprocessing, reference analysis, prompt, QA, and provider-specific
capabilities without copying those skills into the project.

## Outputs

For each product the application can create:

- `clean-catalog`: 1600 × 1600 PNG/WebP;
- `hero`: 2048 × 2048 PNG/WebP;
- `ingredients`: 2048 × 2048 PNG/WebP;
- `lifestyle`: 2048 × 2048 PNG/WebP;
- plans, prompts, masks, QA reports, manifest, `review.html`, and a secure ZIP.

No API is called by default. `PLAN_ONLY` analyzes inputs, writes scene plans and
prompts, creates the local clean-catalog asset, and prepares the review gallery.

## Installation on Windows

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Python 3.11 or newer is required. CPU operation is supported.

## Add products

Place transparent product PNGs in:

```text
input/products/
```

Optionally complete `input/catalog.csv`, add `input/catalog.json`, and place
visual references in `input/references/`. Product metadata has priority over
filename heuristics. Ingredients are used only when explicitly confirmed in the
catalog; otherwise the prompt builder uses abstract materials.

Reference priority is:

```text
product_reference → category_reference → global_reference → preset defaults
```

## Modes

Plan without paid API calls:

```powershell
python -m src.cli --plan-only
```

Pilot up to five products:

```powershell
python -m src.cli --pilot --provider gemini --max-products 5 --allow-billable
```

One product and one asset:

```powershell
python -m src.cli --pilot --provider gemini --product halo-dynamic-cream --asset-type hero --allow-billable
```

Full batch requires explicit confirmation:

```powershell
python -m src.cli --batch --provider gemini --confirm-batch --allow-billable
python -m src.cli --batch --provider gemini --confirm-batch --skip-existing --allow-billable
```

Experimental masked editing must also be selected explicitly:

```powershell
python -m src.cli --pilot --generation-mode GENERATIVE_EDIT --max-products 1
```

This mode sends a protected mask and compares the returned product region with
the master. Any fidelity result below the configured threshold is rejected.

Without `--confirm-batch`, batch mode exits safely. `--dry-run` forces
`PLAN_ONLY` and never calls an API.

## Google Gemini image generation

Copy `.env.example` to `.env` and set the key locally:

```text
GEMINI_API_KEY=
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
GEMINI_ALLOW_BILLABLE=false
GEMINI_ESTIMATED_COST_PER_IMAGE_USD=
```

`GEMINI_API_KEY` is preferred. `GOOGLE_API_KEY` is accepted as a compatibility
fallback, but set only one to avoid credential ambiguity. Do not paste keys
into prompts, source files, logs, or Git. When the key is missing, the
application automatically falls back to `PLAN_ONLY`.

The provider uses the official `google-genai` Python SDK, bounded retries,
timeout, request IDs when available, usage metadata, and a per-run request
budget. Gemini is the default provider. OpenAI remains an optional adapter and
its SDK can be installed with `pip install ".[openai]"`.

An API key is free to create, but image generation is not automatically free.
At the time this project was updated, Google's official pricing page listed no
Free Tier for `gemini-2.5-flash-image`. Therefore a key alone never authorizes a
request: add `--allow-billable` or set `GEMINI_ALLOW_BILLABLE=true` only after
checking the current pricing and project tier in Google AI Studio.

Pricing can change. The application does not hard-code a price. If desired,
set a current per-image estimate:

```text
GEMINI_ESTIMATED_COST_PER_IMAGE_USD=0.039
```

Without that value, `estimated_cost` remains zero/unknown while request counts
are still enforced and reported.

## Presets and creative direction

Edit `config/scene-presets.yaml` to tune palette, surface, lighting, camera,
props, composition, shadow, and reflection. The included presets are:

- `neutral_premium`
- `mineral_recovery`
- `botanical_repair`
- `hydration_water`
- `anti_age_gold`
- `perfume_luxury`
- `herbal_tea`
- `chocolate_wellness`
- `clean_scientific`

Low-confidence classification uses `neutral_premium` and sets review status.

## QA and review

Open:

```text
output/review.html
```

The gallery works without a server and filters by product, category, preset,
status, and provider. QA uses product fidelity, alpha silhouette, edge,
visibility, crop, dimensions, and aspect checks. Results are `PASS`, `REVIEW`,
or `REJECT`. A rejected asset is never copied to `output/approved`.

Validate all files and the ZIP:

```powershell
python -m src.cli --validate
.\validate.ps1
```

Validate the installed skill and its ten synthetic scenarios:

```powershell
python ".codex\skills\product-creative-studio\scripts\scan_local_skills.py"
python ".codex\skills\product-creative-studio\scripts\validate_scenarios.py"
```

## Reprocessing

Use `--skip-existing` to retain existing products or `--regenerate` to rebuild
the selected scope. Use `--product` and `--asset-type` for a narrow rerun.
Generation retries and candidate counts are capped in `config/settings.yaml`.

## Results

Main files:

```text
manifest.csv
report.json
output/review.html
catalog-creative-output.zip
```

The ZIP contains approved/review assets, prompts, manifest, report, gallery,
and this README. It excludes `.env`, API keys, temporary files, caches, source
secrets, and logs.

## Limitations

- The system never invents clinical or ingredient claims.
- A 2D source PNG cannot safely create a genuinely new physical product angle.
- Google API keys may be created without charge, but availability of free image
  generation depends on the selected model, region, quota, and current pricing.
- Opaque-background inputs are marked `REVIEW` and creative generation is
  blocked until a transparent master is prepared.
- One failed product is reported as `REJECT` without stopping the remaining
  catalog.
- OCR and vision-model review are optional future extensions; the local QA
  focuses on protected pixels, silhouette, layout, and file integrity.
- Marketplace compliance, rendered marketing copy, legal claims, and final
  art direction require human review.
