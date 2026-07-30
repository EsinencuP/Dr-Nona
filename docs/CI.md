# How does continuous integration protect this repository?

The `quality-gates` GitHub Actions job runs every required technical check on pull requests and pushes to `main`.

## Supported runtime

CI runs on `ubuntu-latest`, reads Node `22.23.1` from `.nvmrc` and installs npm
`10.9.8`, matching `package.json#packageManager`. Windows, macOS and Linux
contributors use the same versions; only the CI Ubuntu environment is the
release-blocking reference.

## Required commands

The workflow runs these commands in order:

1. `npm ci`
2. `npm run toolchain:validate`
3. `npm run repository:validate`
4. `npm run architecture:validate`
5. `npm run typography:validate`
6. `npm run market:validate`
7. `npm run content:validate`
8. `npm run claims:validate`
9. `npm run security:validate`
10. `npm run typecheck`
11. `npm run lint`
12. `npm run test`
13. `npm run build`
14. `npx playwright install --with-deps chromium`
15. `npm run security:runtime`
16. `npm run performance:runtime`
17. `npm run test:e2e`
18. `npm run repository:validate`
19. clean-worktree assertion

The architecture step keeps `App.tsx` compositional, requires a separate module
and real dynamic import for every route, validates feature boundaries for
catalogue/contact/selection/locales, and prevents implementation modules from
importing back through `App.tsx`.

Playwright runs the same critical scenarios in desktop Chromium at 1440 × 900
and mobile Chromium at 390 × 844. The responsive contract additionally checks
320, 375, 430, 768, 1024, 1440 and 1920 px, a mobile-landscape profile and a
640 px CSS viewport equivalent to 200% zoom. It covers header/menu, Home hero,
catalogue filters and cards, product title and accordions, selection, contact,
footer, long Romanian strings and empty/error states. Geometry assertions
reject horizontal document scroll, clipped text/actions, action intersections
and touch controls below 44 × 44 px.

Seven platform-neutral full-page catalogue baselines are stored beside
`tests/e2e/responsive-matrix.spec.ts` and compared during `npm run test:e2e`.
GitHub uploads Playwright diffs on failure. Baseline policy and the complete
matrix are documented in `docs/RESPONSIVE_QA.md`.

Axe scans the home, catalogue, product, selection and contact routes against
Web Content Accessibility Guidelines (WCAG) A and AA tags.

The typography gate rejects explicit visible text below 14 px, verifies muted
text against every light surface at WCAG AA contrast and prevents viewport
metadata from disabling zoom. Playwright additionally checks priority routes
at 320, 640 and 1920 px, where 640 px is the CSS viewport equivalent to 200%
zoom on a 1280 px display, and applies WCAG text-spacing overrides at 390 px.

The claims step verifies that every detector-matched medical, therapeutic,
health and cosmetic-efficacy sentence has a current registry record and that
reviewed records include reviewer evidence. The production UI separately
suppresses `pending` and `rejected` fields.

The product-content step applies category rules to every source record. It
rejects a published product when a required field is blank, rejects `null`
unless that field is explicitly allowed as not applicable, and requires an
editorially ready status before publication. Successful builds create
`artifacts/reports/PRODUCT_CONTENT_REPORT.md`; CI publishes it with the bundle.

The market step requires the primary contact to be Moldova-based and
source-backed, rejects pending placeholders, prevents foreign certificates
from being exposed as Moldova evidence and validates issuer, country, products
and validity metadata for every approved Moldova certificate.

The security step validates the global `vercel.json` header contract, minimal
CSP origin allowlist, frame/MIME/referrer/permissions/HSTS protections and
asset caching. Build-time HTTP coverage checks the same enforcing headers on
documents, prerendered routes, redirects and assets. After Chromium is
installed, `security:runtime` renders five representative routes under the
enforced policy and fails on every CSP violation.

The build also regenerates the SEO manifest, prerenders every published route,
emits sitemap and robots files, then runs `npm run seo:validate` and
`npm run seo:http-validate`. The structural gate rejects missing or duplicate
metadata, invalid canonical/hreflang links, malformed JSON-LD, absent
pre-JavaScript content and unverified commerce/review fields in Product schema.
The HTTP gate starts an isolated production preview, requests every sitemap URL,
requires canonical prerendered HTML with status 200, and verifies `/main`
returns permanent redirect 308 to `/`.

The build then runs `npm run performance:validate`. It measures raw, gzip and
Brotli size of the entry, preloaded JS and CSS, rejects initial payload above
140 KiB gzip or 115 KiB Brotli, and rejects preload of official content,
catalogue data or the CatalogPage route module. Playwright separately verifies
the Home, Contact and Catalog request graph in desktop and mobile Chromium.
After Chromium is installed, `npm run performance:runtime` measures production
V8 parse, script execution and main-thread task duration for those three
routes and writes `docs/RUNTIME_PERFORMANCE_REPORT.md`.

## Required GitHub repository setting

The workflow creates a check named `quality-gates`. After this branch is pushed, enable a ruleset or branch protection for `main` and require that check before merge.

GitHub stores branch protection outside the repository. The workflow alone reports failures but cannot prevent an administrator from merging until the repository setting marks `quality-gates` as required.

## Failure evidence

GitHub Actions uploads `playwright-report` and `test-results` for seven days when a workflow fails. Local runs keep the same folders ignored by Git.

Successful CI runs upload `dist`, build/content reports and performance/SEO
reports as an artifact named with `github.sha`. The repository gate rejects
tracked build output, root-level screenshots, incomplete `.gitignore` rules and
QA evidence that is missing from its dated package manifest. A final
clean-worktree assertion proves that build and tests did not modify source.
