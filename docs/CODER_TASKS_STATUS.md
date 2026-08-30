# What is the implementation status of Stage 2 coder tasks?

This document maps `teamwork_coder_tasks.md` to the current repository without treating missing legal, translation or business data as engineering decisions.

Last verified: 2026-08-30 against the current worktree.

| Task | Status | Current result | Required input |
|---|---|---|---|
| `TASK-01` locale-prefixed routes | Blocked with `TASK-02` | The production contract remains Russian-only. Activating `/ro/...` before complete content would violate the no-mixed-language acceptance criterion. | Complete approved Romanian content set. |
| `TASK-02` UI, catalogue and metadata localization | Blocked | Russian locale resources exist; Romanian UI, 50 products, 137 content records, metadata, alt and accessibility copy are not supplied. | Reviewed Romanian dataset with stable IDs for every field. |
| `TASK-03` claims cleanup | Blocked | Registry validation passes structurally, but all 286 decisions remain `pending`. | For every claim: approved/rejected decision, reviewer, ISO date and approval reference; neutral replacement copy for rejected claims. |
| `TASK-04` certificates and media | Partially complete | Moldova certificate list is empty, foreign documents are hidden and current image links load. | Approved Moldova certificate records and a rights manifest for every published asset. |
| `TASK-05` popularity sorting | Code complete; business approval open | Comparator uses `popularityRank` and now resolves equal ranks deterministically by `officialOrder`, then SKU. Current ranks mirror catalogue order and remain provisional. | Approved 50-product ranking or explicit approval of catalogue order as permanent fallback. |
| `TASK-06` consent and privacy | Technical part complete; legal approval open | Consent is required, localized through the RU resource, linked to `/privacypolicy`, validated client/server side and focused after an error. | Approved legal recipient, consent wording, retention period and Romanian translation. |

## Required data formats

1. Romanian content: one record per stable route/product ID with UI text, titles, descriptions, ingredients, usage, metadata, image alt and accessibility labels.
2. Claims decisions: claim ID, decision, reviewer, reviewed date, approval reference and replacement text when rejected.
3. Media rights: public asset path, source, rights holder, permitted territory/use and approval reference.
4. Certificates: title, issuer, country, product scope, validity dates, document URL and source URL.
5. Popularity: product slug or SKU plus unique rank, or a written approval of `officialOrder` as the permanent fallback.
6. Privacy: legal recipient name, purpose, retention period, contact and approved RU/RO consent copy.

## Verified changes from this task set

- `npm run typecheck`: pass
- `npm run lint`: pass
- Focused Vitest: 23 tests passed
- Moldova market gate: pass with zero published Moldova certificates
- Claims registry gate: pass structurally with 286 pending decisions
- Consent Playwright regression: desktop and mobile passed

No `/ro/...` URL or unapproved legal content is exposed until the corresponding acceptance data is complete.
