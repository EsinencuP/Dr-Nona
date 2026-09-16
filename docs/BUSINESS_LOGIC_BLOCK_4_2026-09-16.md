# Business logic Block 4 — Tasks 19–23

**Date:** 2026-09-16  
**Repositories:** Dr Nona catalogue and Dr-Nona-CRM  
**State:** in progress. Tasks 19, 20, and 23 contain owner decisions that are not implied by the audit or by test data.

| Task | Current evidence | State |
|---:|---|---|
| 19 | All 50 `popularityRank` values are unique 1–50 and equal `officialOrder`; current RU/RO option says «По популярности» / «După popularitate». There is no approved demand source. | Owner choice pending: official catalogue order, editorial order, or remove the option. Do not resolve `P1-RANKING` from code alone. |
| 20 | Production CRM has 15 orders, all with `demo-analytics-order-*` IDs; 10 are DONE. Publishing their aggregate would falsely imply real demand. | Formula, privacy threshold, review and publication policy pending. No public CRM ranking is enabled. |
| 21 | Search now folds Romanian diacritics and `ё`, normalizes punctuation/spacing, prioritizes exact matches, and permits one bounded title/category typo only when exact search is empty. | PASS: 204 unit tests, 12 focused desktop/mobile E2E tests, repository/type/lint/build/performance gates, full remote CI, production deployment and RU/RO catalogue HTTP smoke. |
| 22 | CRM operational metrics use created cohorts, immutable submitted region, Chisinau weekdays, and `firstActionAt`; missing historical timestamps stay unknown. Demo data is disclosed on `/results`. | PASS: 240 CRM tests, type/lint/Biome/build, remote CI, production deployment and authenticated `/results` HTTP 200; local production-build rendering at 320, 375, 768, 1024 and 1440 px without document overflow. |
| 23 | CRM has one Basic Auth manager role and no existing export endpoint. The audit does not define approved PII columns, date range, retention or PDF need. | Export access and data policy pending. No personal-data download route is enabled. |

## Task 21 evidence and limits

The repository does not store real customer search-query logs. The reproducible failures were constructed from actual published names among all 50 products: `sampon mineral` against RO «Șampon mineral», `musetel` against «mușețel», and `solairs` against Solaris. This is a source-backed usability regression set, not a claim about observed customer traffic. Approximate matching never uses ingredients or descriptions, and exact results suppress fuzzy results. No search dependency was added.

The verified catalogue build remains within its performance budget: initial 121,889 bytes gzip / 102,770 bytes Brotli. The catalogue route chunk is 6.47 kB raw / 2.56 kB gzip.

The published commits are catalogue `7a70047` and CRM `dc5fb59`. Both CI runs passed: [catalogue quality gates](https://github.com/EsinencuP/Dr-Nona/actions/runs/35079175912) and [CRM CI](https://github.com/EsinencuP/Dr-Nona-CRM/actions/runs/35079176043). Vercel reported both production deployments Ready. Public `/products` and `/ro/products` returned HTTP 200; the CRM `/results?period=30d` returned HTTP 200 with production Basic Auth and rendered status regions. These are runtime smoke checks, not a substitute for the local browser matrix or full CI.

## Task 22 definitions

The new CRM figures are not website conversion, sale-completion timestamps, or a historical estimate. DONE share uses all order applications created in a selected rolling period as its denominator. First-action time uses only valid `firstActionAt` timestamps. Weekday is local to `Europe/Chisinau`, and regional completion uses the order's immutable submitted region. All calculations are cohort-based and can change as the current status of a past application changes. See the CRM `docs/RESULTS.md` for exact formulas and data-sufficiency rules.

## Decisions needed to finish Block 4

1. Approve the interim catalogue sort meaning. Recommended: official catalogue order, with a truthful RU/RO label; preserve old `?sort=popular` URLs as an alias but do not call this popularity.
2. Approve or reject automatic aggregate publication from CRM. A safe proposal is: completed real product orders only, exclude all `demo-analytics-*` records, use immutable line quantities, a fixed 90-day creation window, deterministic tie-breaks, a minimum sample/privacy threshold, explicit review, expiry and official-order fallback. The exact window, eligibility and threshold require owner approval. With zero real production orders today, the public result would necessarily remain the fallback.
3. Approve export role, columns, date range, personal-data handling and retention. A PII-free aggregate CSV is lower risk; clients/orders CSV and PDF need separate scope approval. No export endpoint is activated from a hypothetical policy.

`P1-RANKING` remains open until the selected comparator and owner approval are recorded. The catalogue's other release blockers are unaffected.
