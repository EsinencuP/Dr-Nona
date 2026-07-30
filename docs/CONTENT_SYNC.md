# Dr. Nona content sync

Status: Active staged import contract  
Last updated: 2026-07-30

`sync:content` never overwrites `src/data`. Every import is a reviewable
candidate. Production data changes only through an explicit, fingerprint-bound
promotion.

## Pipeline

1. **Fetch** — load the official sitemap and only allowlisted product/content
   URLs.
2. **Parse** — extract normalized product and page records into memory.
3. **Validate** — apply strict Zod schemas, origin rules, uniqueness checks and
   product completeness rules.
4. **Compare** — compare candidate counts and fields with current production
   data.
5. **Diff** — write added, removed and changed records to `diff.json`.
6. **Review** — inspect the candidate and resolve every blocking error.
7. **Promote** — approve the exact SHA-256 fingerprint and identify the
   reviewer.

## Create a candidate

```powershell
npm.cmd run sync:content
```

The command writes an ignored package under
`artifacts/content-sync/<timestamp>-<fingerprint>/`:

- `products.json`;
- `official-pages.json`;
- `source-summary.json`;
- `diff.json`;
- `fetch-errors.json`;
- `validation-report.json`;
- `REVIEW.md`.

The console result always contains `"productionWritten": false`. A blocked
candidate is still preserved as diagnostic evidence and the command exits with
a non-zero code.

## Blocking policy

The versioned policy is `scripts/content-sync-policy.json`. The current gate
rejects:

- any unexpected product or content count drop;
- an empty product field that was populated in production;
- incomplete newly discovered products;
- duplicate product slug, SKU or content path;
- duplicate/invalid manifest identifiers and filenames;
- any product, content, summary, manifest or sitemap URL outside
  `https://drnona.com`;
- any content error record;
- invalid or unknown schema fields;
- summary counters that do not equal actual candidate counts.

Invalid manifest or sitemap URLs are excluded before page fetches, not merely
reported after a network request.

## Revalidate a candidate

```powershell
npm.cmd run sync:content:validate -- --candidate "artifacts/content-sync/CANDIDATE"
```

Validation is repeated against the current production dataset. A candidate can
therefore become blocked if production changed after the original review.

## Explicit promotion

Use the exact command generated inside the candidate `REVIEW.md`:

```powershell
npm.cmd run sync:content:promote -- `
  --candidate "artifacts/content-sync/CANDIDATE" `
  --approve "EXACT_SHA256_FINGERPRINT" `
  --reviewed-by "APPROVED_REVIEWER"
```

Promotion is refused when validation fails, the fingerprint differs or the
reviewer is absent. Before writing, current production files are copied to an
ignored backup under `artifacts/content-sync/backups/`. A write failure restores
all three files. A successful promotion creates a versioned audit record under
`docs/content-sync-promotions/`.

Promotion confirms technical and editorial review only. Health claims still
require the separate approval workflow in `docs/CLAIMS_REVIEW.md`.

