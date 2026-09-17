# Business logic Block 4 — Tasks 19–23

**Date:** 2026-09-16  
**Repositories:** Dr Nona catalogue and Dr-Nona-CRM  
**State:** implementation and deployment verification in progress. The owner made the missing decisions on 2026-09-16; production evidence is recorded below when available.

| Task | Current evidence | State |
|---:|---|---|
| 19 | All 50 legacy `popularityRank` values were identical to `officialOrder`. The owner selected real CRM order frequency for the existing RU/RO popularity sort, with a visibly explained official-order fallback. | Local implementation complete; production review pending. |
| 20 | The CRM candidate counts distinct completed real orders containing each product in a 90-day creation window, excludes `demo-*`, and requires 10 orders from 5 clients. A daily action prepares a reviewed, expiring, aggregate-only catalogue snapshot. | Local implementation complete; production review pending. Current demo-only orders cannot activate the ranking. |
| 21 | Search now folds Romanian diacritics and `ё`, normalizes punctuation/spacing, prioritizes exact matches, and permits one bounded title/category typo only when exact search is empty. | PASS: 204 unit tests, 12 focused desktop/mobile E2E tests, repository/type/lint/build/performance gates, full remote CI, production deployment and RU/RO catalogue HTTP smoke. |
| 22 | CRM operational metrics use created cohorts, immutable submitted region, Chisinau weekdays, and `firstActionAt`; missing historical timestamps stay unknown. Demo data is disclosed on `/results`. | PASS: 240 CRM tests, type/lint/Biome/build, remote CI, production deployment and authenticated `/results` HTTP 200; local production-build rendering at 320, 375, 768, 1024 and 1440 px without document overflow. |
| 23 | The owner approved manager access to client data in exports, an Excel-only pop-up, report type and column selection. Four `.xlsx` reports have bounded rows, strict field allowlists, formula-safe text, same-origin/auth checks and database audit records. | Local implementation complete; production migration and export smoke pending. |

## Task 21 evidence and limits

The repository does not store real customer search-query logs. The reproducible failures were constructed from actual published names among all 50 products: `sampon mineral` against RO «Șampon mineral», `musetel` against «mușețel», and `solairs` against Solaris. This is a source-backed usability regression set, not a claim about observed customer traffic. Approximate matching never uses ingredients or descriptions, and exact results suppress fuzzy results. No search dependency was added.

The verified catalogue build remains within its performance budget: initial 121,889 bytes gzip / 102,770 bytes Brotli. The catalogue route chunk is 6.47 kB raw / 2.56 kB gzip.

The published commits are catalogue `7a70047` and CRM `dc5fb59`. Both CI runs passed: [catalogue quality gates](https://github.com/EsinencuP/Dr-Nona/actions/runs/35079175912) and [CRM CI](https://github.com/EsinencuP/Dr-Nona-CRM/actions/runs/35079176043). Vercel reported both production deployments Ready. Public `/products` and `/ro/products` returned HTTP 200; the CRM `/results?period=30d` returned HTTP 200 with production Basic Auth and rendered status regions. These are runtime smoke checks, not a substitute for the local browser matrix or full CI.

## Task 22 definitions

The new CRM figures are not website conversion, sale-completion timestamps, or a historical estimate. DONE share uses all order applications created in a selected rolling period as its denominator. First-action time uses only valid `firstActionAt` timestamps. Weekday is local to `Europe/Chisinau`, and regional completion uses the order's immutable submitted region. All calculations are cohort-based and can change as the current status of a past application changes. See the CRM `docs/RESULTS.md` for exact formulas and data-sufficiency rules.

## Owner decisions and implementation contract

The owner's 2026-09-16 direct decision supersedes the audit's suggested official-order relabel and CSV/PDF export plan. The RU/RO option remains “By popularity”. A product gains one count for each distinct completed real order containing it in the preceding 90 days; ordered quantity does not increase its count. The CRM has no reliable completion timestamp, so eligibility uses creation time plus the current DONE state. A late status change affects the next candidate. Ties use official catalogue order and SKU. The reviewed snapshot expires after seven days; insufficient or stale data makes the UI explicitly disclose official-order fallback. The initial real sample is below threshold because the existing 15 CRM orders are demonstration records.

Client data may be used inside the protected CRM and its manager-only Excel reports. The popularity candidate uses distinct clients solely to enforce the five-client publication threshold; customer identity and prices never cross into the public catalogue. At least ten eligible orders and five distinct clients are required. Unknown product slugs quarantine the candidate. The catalogue accepts a strict candidate contract, retains only ordered slugs and a digest, and needs a human review/merge before publication. Its scheduled GitHub workflow cannot open pull requests under current repository settings, so it prepares a branch and prints a compare link for a human to open. No catalogue runtime request reaches CRM.

The owner chose `.xlsx` only. The CRM modal offers orders, clients, products and regions reports, optional inclusive Moldova-local date limits, and individual approved columns including names, phones and totals where relevant. The endpoint uses existing manager Basic Auth, same-origin POST, a 10,000-row bound, a database audit row, no server-side file retention and text cells that cannot execute spreadsheet formulas. Demo data is excluded by default and opt-in is visible. Missing historical prices remain blank rather than estimated. See CRM `docs/POPULARITY_AND_EXPORTS.md` for complete field rules.

`P1-RANKING` stays open until the deployed candidate and fallback are verified. Other release blockers are unaffected.
