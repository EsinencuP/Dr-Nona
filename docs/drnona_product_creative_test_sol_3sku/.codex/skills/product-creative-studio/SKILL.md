---
name: product-creative-studio
description: "Turn a folder or catalog of real product PNGs into a reproducible, fidelity-safe ecommerce image system with clean-catalog, hero, ingredients, and lifestyle/detail assets. Use for requests to create catalog imagery, product-page heroes, product scenes, several images per SKU, or a pilot/batch creative pipeline while preserving packaging, labels, logos, geometry, colors, and proportions; includes source normalization routing, category presets, prompt logs, cost guards, automatic QA, human review, manifests, and secure ZIP export."
---

# Product Creative Studio

Execute a working pipeline; do not stop at prompts or documentation. Use
`assets/catalog-creative-agent` as the canonical project template.

## Trigger conditions

Treat the frontmatter description as authoritative. Typical trigger phrases
include: create catalog images, generate a product hero, prepare ecommerce
product images, build product scenes, analyze a PNG catalog, or create several
images per product.

## Prerequisites

- Require Python 3.11+ and install only missing packages from
  `requirements.txt`.
- Require at least one real product image before creative generation.
- Prefer a reviewed transparent RGBA PNG. Treat an opaque background,
  missing/empty alpha, damaged image, or doubtful cutout as a preprocessing
  task, not a creative-generation input.
- Keep API keys in local environment variables. Never accept keys in source,
  prompts, logs, manifests, reports, or ZIP files.
- Start without an API key in `PLAN_ONLY`; do not block analysis or planning.
- Use Google Gemini as the default external provider. Read `GEMINI_API_KEY`
  locally, never from chat. Accept `GOOGLE_API_KEY` only as a compatibility
  fallback and avoid setting both.

## Complementary skill routing

Run `scripts/scan_local_skills.py` before planning when the available skills may
have changed. Read only the selected skill instructions and invoke them at these
stages:

| Stage | Skill | Invoke when |
|---|---|---|
| Public intake | `collect-public-product-images` | The source is a public catalog URL; finish collection before creative work. |
| Source preparation | `prepare-catalog-product-images` | A product lacks clean transparency, has a doubtful mask, or needs normalized catalog framing. |
| Product identity and slots | `ecommerce-image-workflow` | Extract identity anchors and define distinct main/feature/lifestyle roles from a real reference. Reuse its fidelity/checklist method, not its dispatcher contract, unless actually running that workflow. |
| Reference direction | `reference-design-contract` | Screenshots, mood references, or “make it feel like this” must become keep/change/do-not-copy constraints. |
| Structured visual brief | `design-brief` | Palette, lighting, mood, density, or exclusions remain materially ambiguous. |
| Creative direction | `creative-director` | Select or critique one coherent category preset; do not generate unrelated moods per SKU. |
| Prompt refinement | system `imagegen`; `enhance-prompt` if callable | Shape concise product-mockup prompts and repeat invariants. Catalogue-only entries are discovery, not execution. |
| Interactive generation/editing | system `imagegen` | Generate or edit raster background plates interactively. Load local edit targets with `view_image` first and obey its built-in/CLI boundary. |
| Alternative generator | `imagen` | Use only after proving the full upstream reference-capable runtime is installed; otherwise keep it as an optional capability. |
| Vision/OCR/segmentation | `fal-vision` | Use only when its runtime is callable and local QA cannot resolve OCR, object count, or segmentation uncertainty. |
| Conservative enhancement | `image-enhancer` | Improve clarity after resize without hallucinating label detail or silently upscaling. Use only if callable. |
| OpenAI implementation facts | `openai-docs` | Verify current model/API parameters, SDK behavior, or pricing assumptions before changing the provider. |
| Gemini implementation facts | Official Google Gemini API and `google-genai` documentation | Browse current primary Google sources before changing model IDs, SDK calls, free-tier assumptions, limits, or pricing. |
| Gallery UX audit | `product-design:audit` | Audit the local review interface as a product surface; do not substitute it for pixel-level product fidelity QA. |

Do not copy these skills into this skill. Use them as bounded complementary
capabilities. Read `references/capability-map.md` and
`references/skill-routing.md`.

## Input contract

Required:

```text
input/products/<product-slug>.png
```

Accept one physical product, a product with its real box, or a real multi-item
set per PNG. Preserve every legitimate component.

Optional:

```text
input/catalog.csv
input/catalog.json
input/references/
input/brand/
input/ingredients/
```

Use explicit metadata before filename/image inference. If metadata is missing,
infer category and package form, record confidence, select `neutral_premium`
below 0.70, and set `needs_review=true`. Never infer medical claims or specific
ingredients.

Example metadata:

```csv
sku,product_name,product_slug,category,product_line,ingredients,primary_color,secondary_color,mood,scene_preset,source_filename,generate_clean,generate_hero,generate_ingredients,generate_lifestyle
430301,Halo Dynamic Cream,halo-dynamic-cream,repairing skincare,HALO Complex,"Dead Sea minerals; botanical extract",white,warm gold,"clean; restorative",botanical_repair,halo-dynamic-cream.png,true,true,true,true
```

## Output contract

Create deterministic product folders:

```text
output/products/<product-slug>/
├── master/{source.png,normalized.png,mask.png}
├── plans/{analysis.json,reference_analysis.json,scene-plan.json,prompts.json}
├── candidates/<asset-type>/
├── final/{01-clean-catalog,02-hero,03-ingredients,04-lifestyle}.{png,webp}
├── qa/{report.json,warnings.json}
└── metadata.json
```

Also create:

```text
manifest.csv
report.json
output/review.html
catalog-creative-output.zip
```

Log the exact prompt, negative prompt, prompt hash, provider, model, request ID,
usage metadata, API attempts, cost status, hashes, dimensions, generation mode,
and QA result. Exclude `.env`, credentials, caches, temporary files, and
sensitive logs from ZIP.

## Immutable protected-layer contract

- Treat the source product as immutable pixels.
- Generate the environment, never the packaging.
- Default to `SAFE_COMPOSITE`: generate an empty background plate, then place
  the real RGBA product locally with Pillow/OpenCV.
- Preserve logo, label text, legal copy, SKU, color blocks, shape, silhouette,
  cap, pump, box, materials, proportions, and graphic elements.
- Allow only proportional resize, visual centering, local contact shadow,
  surface-appropriate reflection, edge decontamination, and conservative
  post-resize sharpening.
- Never invent a new angle, rear label, open container, contents, cap, pump,
  box, ingredient, certification, measurement, or claim.
- Use `GENERATIVE_EDIT` only after explicit selection. Protect the product with
  a mask, compare the returned product region with the master, reject drift,
  and fall back to `SAFE_COMPOSITE`.

Read `references/product-fidelity.md` before generation.

## Workflow

1. Inspect the destination and preserve existing inputs and unrelated outputs.
2. Scan local skills and record the capability map.
3. Copy the project template when no compatible project exists.
4. Validate inputs. Route opaque/doubtful sources through
   `prepare-catalog-product-images`; do not creatively process them yet.
5. Analyze category, package form, palette, alpha, resolution, metadata
   confidence, and protected identity anchors.
6. Analyze product, category, then global references. Extract controllable
   qualities without copying brands, text, packaging, or exact composition.
7. Select one category preset and write `scene-plan.json`.
8. Build all prompts and negative prompts before any generation. Save
   `prompts.json`.
9. Run:

   ```powershell
   python -m unittest discover -s tests -v
   python -m src.cli --plan-only
   ```

10. Inspect the plan, cost/request forecast, and review gallery.
11. Run a maximum five-product pilot before any batch:

    ```powershell
    python -m src.cli --pilot --provider gemini --max-products 5 --allow-billable
    ```

12. Review pilot fidelity, scene consistency, prompts, cost, and failures.
13. Run the full catalog only with explicit confirmation:

    ```powershell
    python -m src.cli --batch --provider gemini --confirm-batch --skip-existing --allow-billable
    ```

14. Validate every image, manifest row, report, gallery, and ZIP:

    ```powershell
    python -m src.cli --validate
    ```

15. Report exact counts by asset/status, API requests, cost status, failures,
    review items, and absolute result paths.

## Subagent delegation

Use these logical subagents when delegation is available; otherwise execute the
same roles sequentially:

1. Product Analyzer
2. Reference Analyst
3. Creative Director
4. Prompt Engineer
5. Image Provider
6. Compositor
7. QA Inspector
8. Catalog Exporter

Delegate different products or read-only analyses in parallel. Never allow two
agents to write the same product asset, manifest, report, gallery, or ZIP.
Keep budget, approvals, provider selection, and final export with the
coordinator. Give Image Provider a bounded request allocation; it must not
retry beyond the configured cap. Give QA Inspector raw source/result artifacts,
not the expected answer. The Catalog Exporter is the sole final writer.

## Approval gates

- Treat `--pilot` as authorization only for the bounded pilot scope.
- Require `--batch --confirm-batch` for a full catalog or more than five
  products.
- Require explicit selection for `GENERATIVE_EDIT`.
- Require explicit authorization before any paid fallback, new provider, or
  request limit increase.
- A Gemini key is authentication, not payment authorization. Require
  `--allow-billable` or `GEMINI_ALLOW_BILLABLE=true` before a Gemini image
  request because current model/free-tier eligibility can change.
- Do not run a paid API in `PLAN_ONLY` or `--dry-run`.
- Never ask the user to paste a key into chat; ask them to set it locally.

## Cost guard and API safety

- Enforce maximum products, requests, candidates, retries, and regenerations.
- Log each provider request once, but redact credentials and sensitive headers.
- Use `GEMINI_API_KEY` and `GEMINI_IMAGE_MODEL`; default to
  `gemini-2.5-flash-image`. Keep OpenAI as an optional explicit fallback, not a
  required dependency.
- Do not repeat a paid request merely because an earlier result is imperfect;
  apply QA and the configured regeneration policy.
- Record unknown pricing as unknown/zero with a note; never invent current
  prices. Browse official Google sources for Gemini; invoke `openai-docs` only
  when changing the optional OpenAI adapter.
- Do not assume Gemini image generation is free merely because creating the
  key is free. Check the current Google pricing and project tier.
- Fall back to `PLAN_ONLY` when `GEMINI_API_KEY` is absent, the official
  `google-genai` package is unavailable, or billable use was not authorized.

## Failure handling

- Invalid or opaque source: mark `REVIEW`, require preprocessing, and skip
  creative generation.
- Low resolution: add `LOW_RESOLUTION_SOURCE`; do not silently upscale.
- Low classification confidence: use `neutral_premium` and mark `REVIEW`.
- One asset/product generation failure: record the exact sanitized reason,
  continue other products, and do not claim full success.
- Rate limit/timeout: use bounded backoff; stop at the configured retry limit.
- Packaging drift: store the candidate in `rejected`, use `SAFE_COMPOSITE`, and
  never publish the drifted result.
- Missing provider/runtime: use a verified available alternative or
  `PLAN_ONLY`; do not report a catalogue entry as callable.
- Validation/ZIP failure: rebuild and revalidate before handoff.

## QA checklist

Require all applicable checks:

- source opens and has a non-empty alpha mask;
- product/box/set is complete and not cropped;
- exactly one intended product composition is present;
- protected logo, label, color, silhouette, geometry, and proportions match;
- no generated packaging, duplicate product, added accessory, or background
  text exists;
- scene matches category and confirmed ingredients only;
- product is visible, grounded, and not obscured by props;
- shadow direction/contact and any reflection match the surface;
- edges have no destructive blur, color halo, or isolated noise;
- output dimensions/aspect/mode are correct;
- prompt, request, cost, hashes, and QA status exist in manifests;
- `PASS`, `REVIEW`, and `REJECT` are honest;
- review gallery opens locally and exposes source, assets, prompts, warnings,
  provider, model, cost, and scores;
- ZIP opens, matches manifests, and contains no `.env`, keys, caches, or logs.

Read `references/qa-rules.md` before approval.

## Examples

Example scene plan:

```json
{
  "product_slug": "halo-dynamic-cream",
  "category": "repairing skincare",
  "classification_confidence": 0.91,
  "preset": "botanical_repair",
  "generation_mode": "SAFE_COMPOSITE",
  "assets": ["clean-catalog", "hero", "ingredients", "lifestyle"],
  "confirmed_ingredients": ["Dead Sea minerals", "botanical extract"],
  "protected_layer": {
    "immutable": true,
    "preserve": ["silhouette", "cap", "logo", "label", "colors", "proportions"]
  },
  "needs_review": false
}
```

Example final background prompt:

```text
Use case: product-mockup
Asset type: ecommerce hero background plate
Primary request: Create a photorealistic premium repairing-skincare environment.
Scene/backdrop: warm ivory travertine podium, restrained olive leaves, a few
small white flowers, subtle mineral crystals, soft architectural arch.
Lighting/mood: warm diffused daylight, clean editorial ecommerce.
Composition/framing: square 2048 x 2048; empty central placement zone; props
only in the lower third and outer edges; realistic scale; generous negative space.
Protected-layer contract: the supplied product is immutable and will be
composited later. Do not generate any product, container, bottle, jar, box,
packaging, label, logo, text, letters, watermark, person, hand, or face.
Constraints: confirmed ingredients only; no claims; no duplicate product.
Avoid: fake package, unreadable text, clutter, fantasy, dark background, neon,
harsh shadows, floating objects, distorted geometry, generic AI look.
```

## Validation commands

```powershell
python scripts\scan_local_skills.py
python scripts\validate_scenarios.py
python scripts\run_pipeline.py "<project>" --plan-only
python scripts\validate_outputs.py "<project>"
```

Read `references/scenario-validation.md` for the ten required scenario
expectations.

## Handoff

Return source count, planned/processed count, asset counts, `PASS/REVIEW/REJECT`
counts, failed items, API requests, cost status, provider/model, skill scan
summary, test results, and absolute paths to `output/review.html` and
`catalog-creative-output.zip`. Never describe `REVIEW` or `REJECT` as approved.
