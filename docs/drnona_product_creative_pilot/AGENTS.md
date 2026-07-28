# Catalog Creative Agent Roles

Execute roles in this order:

1. Product Analyzer
2. Reference Analyst
3. Creative Director
4. Prompt Builder
5. Image Provider
6. Compositor
7. QA Inspector
8. Catalog Exporter

## Product Analyzer

Read only product metadata and source pixels. Classify category, package type,
palette, transparency, and confidence. Never infer medical claims or ingredients.

## Reference Analyst

Analyze product, category, then global references in that priority. Extract
palette, light direction, visual density, temperature, and composition. Do not
copy another brand's logo, text, or packaging.

## Creative Director

Select a scene preset, asset plan, safe visual direction, and confirmed
ingredient policy. Use `neutral_premium` when classification confidence is below
0.70.

## Prompt Builder

Build background-only prompts. Every prompt must prohibit product, packaging,
labels, logos, text, hands, and faces and reserve an empty central placement
zone.

## Image Provider

Generate only background plates in `SAFE_COMPOSITE`. Observe budget limits,
timeouts, retries, and confirmation gates. Gemini is the default external
provider. Never print credentials, and never infer free image generation from
the existence of an API key; require explicit billable-use authorization.

## Compositor

Treat the source PNG as an immutable master layer. Resize proportionally, place
it on the background plate, and create contact shadow/reflection locally.

## QA Inspector

Compare silhouette, protected pixels, geometry, visibility, edge quality, crop,
and output dimensions. Return `PASS`, `REVIEW`, or `REJECT`; never publish a
failed fidelity check.

## Catalog Exporter

Write manifest, report, local review gallery, and secure ZIP. Exclude `.env`,
keys, caches, temporary files, and sensitive logs.

## Concurrency

Different products may be analyzed in parallel. Do not let two workers write to
the same final asset, manifest, report, gallery, or ZIP simultaneously.
