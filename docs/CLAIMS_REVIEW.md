# Moldova claims review and publication gate

This document defines the current safety workflow for medical, therapeutic,
health, cosmetic-efficacy and anti-aging statements. It is an engineering
control, not legal advice and not evidence that any Dr. Nona claim is lawful in
Moldova.

## Current registry

The canonical machine-readable registry is
`src/data/claims-registry.json`. It currently contains 201 sentence-level
candidates from:

- the 10 current product records;
- the 137 imported official content records;
- the Halo Complex™ formula content used by the frontend.

Current approval status:

| Status | Count | Publication behaviour |
|---|---:|---|
| `approved` | 0 | Original source field may be shown |
| `pending` | 201 | Entire source field is hidden |
| `rejected` | 0 | Entire source field remains hidden |

The registry is conservative and includes automatically detected candidates.
A candidate is not a legal finding. A reviewer must also look for claims that
word-based detection could miss.

## Required record fields

Every record stores:

- exact claim sentence and source field;
- product, page or formula content identifier;
- source URL and source last-modified value when available;
- claim category;
- Moldova market code;
- `approved`, `rejected` or `pending`;
- reviewer, review date and approval/rejection reference.

`approved` and `rejected` are invalid without a named reviewer, ISO date and
document reference. Changing source copy changes its fingerprint and creates a
new `pending` candidate; the previous approval is not silently inherited.

## Cosmetic versus regulated language

- `cosmetic` candidates describe appearance or ordinary topical-care effects.
- `health` candidates refer to wellbeing, vitality, body functions,
  anti-aging or health.
- `therapeutic` candidates refer to pain, healing, disinfection, relief,
  regeneration or similar effects.
- `medical` candidates refer to diagnosis, treatment, prevention, disease or
  medicinal status.

These categories route the review; they do not determine the legal
classification of the product.

## Moldova review basis

The current engineering hold is based on primary Moldova sources:

- The sanitary regulation for nutrition and health claims states that health
  claims on food require applicable approved wording and accompanying
  information; it also describes ANSP scientific review and prohibits
  unapproved claims.
  <https://www.legis.md/cautare/downloadpdf/151895>
- ANSP publishes services and registers for supplement notification,
  registration and health-claim review.
  <https://ansp.md/pentru-agenti-economici/>
- Moldova's medicines law defines medicinal purposes and allows health
  authorities to apply medicines rules to non-medicinal products with
  medicine-like action when required.
  <https://www.legis.md/cautare/downloadpdf/131977>

The business must appoint a qualified Moldova reviewer to confirm the current
law, product classification, registration status, evidence, final wording and
required warnings.

## Supplement notice

Products currently classified in content as `Фитокомплексы` show an interim
notice next to the product information. Its source is
`src/data/product-disclaimers.json`.

The notice is intentionally explicit that the final Moldova wording and
registration status are not confirmed. It is not a substitute for the
mandatory product-specific label, approved health claim, registration or legal
review.

## Commands and release rule

```powershell
npm.cmd run claims:sync
npm.cmd run claims:validate
npm.cmd run release:check
```

- `claims:sync` inventories detector-matched source sentences and preserves
  review metadata only when the exact claim fingerprint is unchanged.
- `claims:validate` fails on missing, stale, duplicate or malformed records and
  on reviewed records without reviewer evidence.
- The frontend hides every field containing a `pending` or `rejected` record.
- `release:check` remains blocked while any record is not `approved`, even if
  the general release-status file were changed incorrectly.

## Reviewer handoff

For each claim, the reviewer must:

1. Confirm product classification for Moldova.
2. Confirm the exact source and evidence.
3. Mark the exact sentence `approved` or `rejected`.
4. Record their name, review date and approval/rejection document reference.
5. Provide product-specific warnings and health-claim conditions where
   applicable.
6. Run `claims:validate`, the complete CI suite and `release:check`.

P0-LEGAL stays open until every production claim and every required notice has
documented approval.
