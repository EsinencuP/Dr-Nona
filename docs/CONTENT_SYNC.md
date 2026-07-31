# How do you synchronize official content safely?

The sync pipeline stages a candidate, validates it against the current source datasets and promotes only an explicitly reviewed fingerprint.

Last verified: 2026-07-31 against `scripts/sync-official-content.mjs` and `scripts/content-sync-lib.mjs`.

## Source inventory

The current `src/data/products.json` is the product inventory. The sync script reads each product slug, official name, source URL and runtime image basename from that file. Raw catalogue exports and external CSV manifests are not repository dependencies.

Official page discovery uses the allowlisted `https://drnona.com` sitemap. The pipeline rejects product, content, summary and sitemap URLs outside the approved origin.

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
