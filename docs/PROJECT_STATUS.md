# What is the current project state?

The application is a functional local QA candidate. Its technical gates pass, but production release remains blocked.

Last verified: 2026-07-31 against base commit `fede3938ce5173206ee4a6983ece7fb2c29f2318` and the current worktree.

## Status identity

| Field | Current value |
|---|---|
| Branch | `main` |
| Base commit | `fede3938ce5173206ee4a6983ece7fb2c29f2318` |
| Working tree | Dirty by design during repository cleanup; no commit or push performed |
| Environment | Windows, Node 22.23.1, npm 10.9.8, Chromium desktop/mobile |
| Release verdict | `release-blocked` |
| UI language | Russian only; approved Romanian content is not implemented |
| Source products | 10 |
| Published products | 7 |
| Draft products | 3 |
| Official content records | 137 |
| Claims | 199 total: 0 approved, 199 pending, 0 rejected |

## Implemented

- Route-separated React catalogue, product, company, formula, editorial, service and legal pages
- Search, category filtering and stable catalogue sorting
- Persistent non-commerce selection with product name, SKU and URL handoff
- Server-validated order and consultation form with Telegram-only delivery
- Russian metadata, canonical URLs, sitemap, robots policy and prerendered HTML
- Product/content publication gates and a sentence-level claims registry
- Keyboard navigation, reduced motion, responsive matrix and axe checks
- Security header, Content Security Policy, performance and repository gates

## Intentionally excluded

- Cart, checkout, payments, prices and discounts
- Authentication, account area and customer database
- General-purpose backend, administration interface and customer relationship management
- Partial Romanian mode
- Unapproved claims, certificates, reviews and draft products
- Email as an automated application transport

## Not verified

- Production deployment and public origin
- GitHub branch protection
- Moldova legal entity, consent wording and retention policy
- Production WAF or rate limiting for the contact endpoint
- Live search-engine validators
- Media publication rights and legal approval of claims

## Known limitations

Use blocker IDs in [the release status](RELEASE_STATUS.md). The current blockers are `P0-LOCALE`, `P0-CONTACT`, `P0-LEGAL`, `P0-ASSORTMENT`, `P1-MEDIA-RIGHTS`, `P1-CONTENT`, `P1-RANKING`, `P1-CI-PROTECTION` and `P1-SEO-ORIGIN`.

## Verification record

| Command | Result | Date | Evidence |
|---|---|---|---|
| `npm ci` | PASS | 2026-07-31 | Clean reinstall: 287 packages, 0 vulnerabilities |
| `npm run toolchain:validate` | PASS | 2026-07-31 | Node/npm and dependency contract output |
| `npm run repository:validate` | PASS | 2026-07-31 | 209 tracked/untracked source paths verified |
| `npm run typecheck` | PASS | 2026-07-31 | TypeScript project references |
| `npm run lint` | PASS | 2026-07-31 | ESLint with zero warnings |
| `npm run test` | PASS | 2026-07-31 | 20 files, 112 tests |
| `npm run build` | PASS | 2026-07-31 | 144 prerendered routes, 142 sitemap URLs |
| `npm run security:runtime` | PASS | 2026-07-31 | 5 routes under enforced CSP, 0 violations |
| `npm run performance:runtime` | PASS | 2026-07-31 | Home, contact and catalogue within runtime budget |
| `npm run test:e2e` | PASS | 2026-07-31 | 116 passed, 16 skipped |
| `npm run release:check` | EXPECTED BLOCKED | 2026-07-31 | 9 open P0/P1 blockers |
