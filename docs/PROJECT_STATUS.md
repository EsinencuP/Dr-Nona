# What is the current project state?

The application is a functional local QA candidate. Its technical gates pass, but production release remains blocked.

Current product-content update: 2026-10-05 on `content/product-descriptions`. The owner approved the current RU/RO texts for all 50 product records; legal claims remain pending. Older verification rows below retain their original dates.

Local UI update: 2026-10-15. The owner's annotations retire Blog/News, external source controls, branch/address information and an invalid contact phone; they revise card subtitles, product-detail composition and add a homepage About module. The current route inventory is 191 pages with 187 indexable URLs. Follow [SITE_POLISH_2026-10-15.md](SITE_POLISH_2026-10-15.md) for the subsequent polish and its verification boundaries. Older implementation/verification rows retain their original scope and dates.

## Status identity

| Field | Current value |
|---|---|
| Branch | `content/product-descriptions` |
| Base commit | `b79e968` |
| Working tree | Source-backed RU/RO product copy editorially approved; no deployment or production approval implied |
| Environment | Windows, Node 22.23.1, npm 10.9.8, Chromium desktop/mobile |
| Release verdict | `release-blocked` |
| UI language | Complete RU/RO route pairs for catalogue, products, company chapters and Halo Complex; editorial remains in its original language |
| Source products | 50 |
| Published products | 50 |
| Draft products | 0 |
| Official content records | 137 |
| Claims | 435 total: 0 approved, 435 pending, 0 rejected after the 2026-10-05 product-copy import and the Russian therapeutic-language detector correction. On 2026-09-10, 105 superseded RO claim candidates were archived when owner-authorized factual adaptations replaced their text; no legal approval was granted. |

## Implemented

- Route-separated React catalogue, product, company, formula, editorial, service and legal pages
- Search, category filtering and stable catalogue sorting
- One shared product-image contract with 50 matched product assets and no placeholders
- Dense editorial product detail with source-backed overview, visible composition and usage, compact service metadata and a separated selection action
- Persistent non-commerce selection with product name, SKU and URL handoff
- Server-validated order and consultation form with Telegram-only delivery
- Five-attempt-per-minute application guard with anonymized client keys and bounded memory
- RU/RO metadata, canonical URLs, reciprocal hreflang and prerendered HTML for catalogue, products, company chapters and Halo Complex
- Product/content publication gates and a sentence-level claims registry
- Keyboard navigation, reduced motion, responsive matrix and axe checks
- Security header, Content Security Policy, performance and repository gates

## Intentionally excluded

- Cart, checkout, payments, prices and discounts
- Authentication, account area and customer database
- General-purpose backend, administration interface and customer relationship management
- Romanian localization outside the approved catalogue, company and Halo Complex route set
- Unapproved certificates, reviews and draft products; regulated source copy remains explicitly release-blocked until reviewed
- Email as an automated application transport

## Not verified

- Production deployment and public origin
- GitHub branch protection
- Moldova legal entity, consent wording and retention policy
- Platform-wide Vercel WAF enforcement for the contact endpoint
- Live search-engine validators
- Media publication rights and legal approval of claims

## Known limitations

Use blocker IDs in [the release status](RELEASE_STATUS.md). The current blockers are `P0-CONTACT`, `P0-LEGAL`, `P1-MEDIA-RIGHTS`, `P1-CONTENT`, `P1-CI-PROTECTION` and `P1-SEO-ORIGIN`. `P0-LOCALE` was resolved by the [owner's current RU/RO copy approval](RO_MD_PRODUCT_COPY_APPROVAL_2026-10-05.md). `P1-RANKING` was resolved by the owner's 90-day CRM order-frequency decision and a disclosed official-order fallback; the real sample is currently too small to activate demand ranking.

The [2026-09-10 localization decision](RO_MD_LOCALIZATION_OWNER_DECISION_2026-09-10.md) approved the prior text. The revised RU/RO descriptions were collected from the rendered Moldova product pages, and the [2026-10-05 direct decision](RO_MD_PRODUCT_COPY_APPROVAL_2026-10-05.md) approves all current texts. All 50 RO records have approved descriptive-field reviews and current source/translation fingerprints. Fifteen RU records retain one or more `null` fields where the available sources do not provide a verified list of ingredients or instructions. Product claims remain separately gated; pending claim fields are omitted from public projections.

## Verification record

| Command | Result | Date | Evidence |
|---|---|---|---|
| `npm ci` | PASS | 2026-07-31 | Clean reinstall: 287 packages, 0 vulnerabilities |
| `npm run toolchain:validate` | PASS | 2026-09-01 | Node/npm and dependency contract output |
| `npm run repository:validate` | PASS | 2026-09-02 | 654 source paths and documentation links verified before final cleanup |
| `npm run typecheck` | PASS | 2026-09-02 | TypeScript project references |
| `npm run lint` | PASS | 2026-09-02 | ESLint with zero warnings |
| `npm run test` | PASS | 2026-09-02 | 23 files, 169 tests |
| `npm run build` | PASS | 2026-09-02 | 315 prerendered routes, 311 sitemap URLs |
| `npm run security:runtime` | PASS | 2026-09-01 | 5 routes under enforced CSP, 0 violations |
| `npm run performance:runtime` | PASS | 2026-09-01 | Home, contact and catalogue within runtime budget |
| `npm run test:e2e` | PASS | 2026-09-02 | 277 passed, 17 intentionally skipped across 294 desktop/mobile scenarios |
| `npm run release:check` | EXPECTED BLOCKED | 2026-09-01 | 8 open P0/P1 blockers |
