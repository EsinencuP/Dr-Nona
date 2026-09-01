# How do you synchronize official content safely?

The sync pipeline stages a candidate, validates it against the current source datasets and promotes only an explicitly reviewed fingerprint.

Last verified: 2026-09-01 against the Moldova catalogue, international content sync scripts and current product assets.

## Source inventory

The current `src/data/products.json` contains 50 Russian-language products from `https://www.drnona.md/catalog`. `drnona.md` is authoritative for the assortment, product name and description. Matching pages on `https://drnona.com` supplement SKU, ingredients and usage data without overriding the primary catalogue copy.

Both `https://www.drnona.md` and `https://drnona.com` are allowlisted content sources. Product media comes from the owner-supplied local archive: all 50 published records resolve to distinct matched files under `public/products/catalog-normalized/`, with no active placeholder.

To validate the Moldova source without writing data, run `npm run sync:catalog:md`. To rebuild `products.json` after reviewing the live inventory, run `npm run sync:catalog:md:write`. The command requires exactly 50 products and validates all five category counts, unique slugs and non-empty primary descriptions.

The Moldova sync preserves the current local `image`, `imageAlt` and `catalogScale` values. To repeat the reviewed media import from an extracted archive, run `npm run images:import:catalog -- <single_product_cards-folder>`. The import rejects missing or ambiguous numbered source files and removes the obsolete secondary-image field.

## Stage a candidate

Run:

```powershell
npm run sync:content
```

The command fetches source pages, parses content, compares the candidate with production data and writes an ignored directory under `artifacts/content-sync/`. It does not modify production JSON.

## Blocking policy

Staging fails when:

- Product count falls below the policy threshold
- A required published field becomes empty
- A slug, source URL or source filename is invalid or duplicated
- A source URL leaves the allowlist
- Fetch/content errors exceed the allowed threshold
- A published product becomes incomplete

Source layout changes remain visible as candidate errors or diffs. The script does not silently replace reviewed content.

## Validate a candidate

Run:

```powershell
npm run sync:content:validate -- --candidate "artifacts/content-sync/candidate_directory"
```

Review `diff.json`, `fetch-errors.json`, `validation-report.json`, candidate data and the fingerprint. Legal and editorial review remain outside automation.

## Promote reviewed data

Run promotion only with the exact validated fingerprint and a named reviewer:

```powershell
npm run sync:content:promote -- --candidate "artifacts/content-sync/candidate_directory" --approve "candidate_fingerprint" --reviewed-by "approved_reviewer"
```

Promotion copies the approved product, official page and summary files into `src/data/`. Run all content, claims, market, build and browser gates afterward.
