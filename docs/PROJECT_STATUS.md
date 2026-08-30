# What is the current project state?

The application is a functional local QA candidate. Its technical gates pass, but production release remains blocked.

Last verified: 2026-08-30 against base commit `678eac7` and the current worktree.

## Status identity

| Field | Current value |
|---|---|
| Branch | `main` |
| Base commit | `678eac7` |
| Working tree | Precision-audit remediation worktree; no commit or push performed |
| Environment | Windows, Node 22.23.1, npm 10.9.8, Chromium desktop/mobile |
| Release verdict | `release-blocked` |
| UI language | Russian only; approved Romanian content is not implemented |
| Source products | 50 |
| Published products | 50 |
| Draft products | 0 |
| Official content records | 137 |
| Claims | 286 total: 0 approved, 286 pending, 0 rejected |

## Implemented

- Route-separated React catalogue, product, company, formula, editorial, service and legal pages
- Search, category filtering and stable catalogue sorting
- One shared product-image contract with 42 matched owner-supplied archive assets and eight explicit placeholders
- Persistent non-commerce selection with product name, SKU and URL handoff
- Server-validated order and consultation form with Telegram-only delivery
- Five-attempt-per-minute application guard with anonymized client keys and bounded memory
- Russian metadata, canonical URLs, sitemap, robots policy and prerendered HTML
- Product/content publication gates and a sentence-level claims registry
- Keyboard navigation, reduced motion, responsive matrix and axe checks
- Security header, Content Security Policy, performance and repository gates

## Intentionally excluded

- Cart, checkout, payments, prices and discounts
- Authentication, account area and customer database
- General-purpose backend, administration interface and customer relationship management
- Partial Romanian mode
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

Use blocker IDs in [the release status](RELEASE_STATUS.md). The current blockers are `P0-LOCALE`, `P0-CONTACT`, `P0-LEGAL`, `P1-MEDIA-RIGHTS`, `P1-CONTENT`, `P1-RANKING`, `P1-CI-PROTECTION` and `P1-SEO-ORIGIN`.

## Verification record

| Command | Result | Date | Evidence |
|---|---|---|---|
| `npm ci` | PASS | 2026-07-31 | Clean reinstall: 287 packages, 0 vulnerabilities |
| `npm run toolchain:validate` | PASS | 2026-07-31 | Node/npm and dependency contract output |
| `npm run repository:validate` | PASS | 2026-08-30 | Current source paths and documentation links verified |
| `npm run typecheck` | PASS | 2026-08-30 | TypeScript project references |
| `npm run lint` | PASS | 2026-08-30 | ESLint with zero warnings |
| `npm run test` | PASS | 2026-08-30 | 21 files, 145 tests |
| `npm run build` | PASS | 2026-08-30 | 187 prerendered routes, 185 sitemap URLs |
| `npm run security:runtime` | PASS | 2026-08-30 | 5 routes under enforced CSP, 0 violations |
| `npm run performance:runtime` | PASS | 2026-07-31 | Home, contact and catalogue within runtime budget |
| `npm run test:e2e` | PASS | 2026-08-30 | 123 passed, 17 skipped; offline and two-tab regressions included |
| `npm run release:check` | EXPECTED BLOCKED | 2026-08-30 | 8 open P0/P1 blockers |
