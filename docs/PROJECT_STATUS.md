# What is the current project state?

The application is a functional local QA candidate. Its technical gates pass, but production release remains blocked.

Current localization update: 2026-09-10 against base commit `b79e968` and the owner-authorized RO-MD worktree. Older verification rows below retain their original dates.

## Status identity

| Field | Current value |
|---|---|
| Branch | `main` |
| Base commit | `b79e968` |
| Working tree | Owner-authorized Romanian localization; no deployment or production approval implied |
| Environment | Windows, Node 22.23.1, npm 10.9.8, Chromium desktop/mobile |
| Release verdict | `release-blocked` |
| UI language | Complete RU/RO route pairs for catalogue, products, company chapters and Halo Complex; editorial remains in its original language |
| Source products | 50 |
| Published products | 50 |
| Draft products | 0 |
| Official content records | 137 |
| Claims | 291 total: 0 approved, 291 pending, 0 rejected. On 2026-09-10, 105 superseded RO claim candidates were archived when owner-authorized factual adaptations replaced their text; no legal approval was granted. |

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

Use blocker IDs in [the release status](RELEASE_STATUS.md). The current blockers are `P0-CONTACT`, `P0-LEGAL`, `P1-MEDIA-RIGHTS`, `P1-CONTENT`, `P1-RANKING`, `P1-CI-PROTECTION` and `P1-SEO-ORIGIN`.

`P0-LOCALE` is resolved by [User Direct Decision #1 and the localization evidence](RO_MD_LOCALIZATION_OWNER_DECISION_2026-09-10.md). All 50 RO products have seven nonempty localized fields. 31 source-information issues across 19 products remain disclosed; resolving the localization publication decision does not verify missing composition, instructions or legal claims.

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
