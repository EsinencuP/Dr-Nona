# How are product claims approved for Moldova?

Every health, medical, therapeutic, anti-aging, cosmetic-efficacy and scientific statement requires a sentence-level decision before publication.

Last verified: 2026-08-25 against `src/data/claims-registry.json`. The registry contains 286 pending claims, 0 approved claims and 0 rejected claims.

## Publication rule

Only `approved` claims may reach public runtime content. Pending and rejected fields are replaced by the review state or omitted. Importing a sentence from the official site does not approve it for Moldova.

## Required record fields

Each record contains:

- Stable ID, scope, source field and exact text
- Source URL and source hash
- Status: `pending`, `approved` or `rejected`
- Reviewer, review date and evidence document reference
- Notes when the decision needs conditions or replacement wording

An approved record requires a named qualified reviewer, a date and a document reference. Editing source text changes its hash and returns the claim to review.

## Review questions

The reviewer must decide:

- Product classification in Moldova
- Whether evidence supports the exact wording
- Whether the statement is cosmetic or therapeutic
- Whether supplement registration or warnings apply
- Whether wording needs an adjacent disclaimer
- Whether product and formula pages may repeat the statement

## Supplement notice

The current interim supplement notice is not legal approval. Replace it only with reviewer-approved Moldova wording tied to product classification and evidence.

## Workflow

1. Run `npm run claims:sync` after approved source content changes.
2. Review every new or changed candidate outside automation.
3. Record the decision and evidence in the registry.
4. Run `npm run claims:validate` and `npm run build`.
5. Keep `P0-LEGAL` open until all production claims have approved dispositions.

Automation validates structure, hashes and publication gating. It cannot decide legal admissibility.
