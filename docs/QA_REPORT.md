# Which QA report is current?

This file is the current QA index for the Dr. Nona Moldova frontend. It separates technical test results from production release approval.

## Report identity

<!-- build-identity:start -->
- **Report generated, UTC**: 2026-07-29T23:58:42.374Z
- **Status date**: 2026-07-30
- **Base commit**: `e762ef3b5098c05c8c7ca4286d538a4fd1aa76eb`
- **Repository state**: dirty (310 changed paths)
- **Source snapshot SHA-256**: `e5823c55e43d7d062c36c00ead85f468d955306210c364be607feca80e85fd25`
- **Environment**: local preview at http://127.0.0.1:4173
- **Products**: 10
- **Published products**: 7
- **Draft products**: 3
- **Official content records**: 137
- **Claims registry records**: 201
- **Claims approval**: 0 approved, 201 pending, 0 rejected
- **Moldova contact phones**: 2
- **Approved Moldova certificates**: 0
- **Prerendered routes**: 144
- **Indexable SEO routes**: 142
- **Structured data routes**: 7 Product, 114 Article
<!-- build-identity:end -->

- **Canonical release status**: `docs/RELEASE_STATUS.md`
- **Generated build evidence**: `artifacts/reports/BUILD_REPORT.md` locally;
  commit-scoped CI artifact after push
- **Verdict**: frontend checks pass; production release remains blocked

This report does not claim that the dirty working tree equals the base commit. Commit the approved changes, then rebuild to create evidence for the release commit.

## Current dataset

- **Products**: 10 source records from `src/data/products.json`: 7 published,
  3 drafts
- **Official content**: 137 records from `src/data/official-pages.json`
- **Supported release UI language**: Russian
- **Romanian release**: blocked pending approved localization

The build command records these counts automatically in the ignored
`artifacts/reports/BUILD_REPORT.md`.

## Current verified checks

- TypeScript and Vite production build: PASS
- Key HTTP routes `/`, `/products`, `/selection`, `/contactus`,
  `/certificates`: 200
- Responsive browser checks at 1280 × 720 and 390 × 844: PASS
- Document-level horizontal overflow in QA-003 routes: none
- Selection handoff covers every published product: 7 names, 7 SKU and 7 URLs
- Selection persistence after navigation and refresh: PASS
- Selection payload update after deletion: PASS
- Empty selection consultation guard: PASS
- Contact fake-submit removal: PASS
- Mixed RU/RO mode removal: PASS

## Release blockers

Production release remains blocked by every open P0 and P1 item in `docs/RELEASE_STATUS.md`:

- P0-LOCALE: complete Romanian UI/content/metadata on the approved `/ro/...`
  strategy
- P0-CONTACT: Moldova recipient, consultant routing, transport, consent and retention
- P0-LEGAL: Moldova legal review of medical and therapeutic claims
- P0-ASSORTMENT: final approval of 10 source records and disposition of 3 drafts
- P1-MEDIA-RIGHTS: media usage rights
- P1-CONTENT: Moldova-specific editorial content scope
- P1-RANKING: approved popularity ranking
- P1-CI-PROTECTION: required GitHub `quality-gates` branch rule
- P1-SEO-ORIGIN: approved production origin and live Google validation

A passing build does not override these blockers.

## Archived evidence

The previous cumulative report is archived at `docs/archive/qa/QA_REPORT_LEGACY_THROUGH_2026-07-29.md`. It is not valid for release decisions because it combines multiple worktree states and cites an obsolete larger dataset.

Detailed visual checks remain in `design-qa.md`. Current build metadata and
counts are generated under `artifacts/reports/` and attached to the CI run for
the tested commit.

## QA-004 release-document integrity

- README, Project Brief and Implementation Readiness use the same blocked release status
- Every active count-bearing status document distinguishes 10 source records
  from 7 published products and 3 drafts, alongside 137 official content records
- The previous cumulative QA report is archived and marked invalid for release decisions
- Each active QA evidence file names its date, base commit, repository state and environment
- `npm.cmd run build` rewrites the build identity, dataset counts and source snapshot
- The build generator rejects stale 55-product and conflicting Discovery/PASS claims in active status documents
- Every blocker ID from `docs/release-status.json` must appear in Release Status, Open Questions and this QA report
- `npm.cmd run release:check` returns exit code 1 while any P0 or P1 remains open

QA-004 repository status consistency: resolved  
Current production release: blocked by 9 listed P0/P1 items

## QA-005 automated quality gates

- `npm run typecheck`: PASS
- `npm run lint`: PASS with zero warnings
- `npm run test`: 31/31 Vitest and React Testing Library checks
- `npm run test:coverage`: 62.96% statements, 47.03% branches, 63.07%
  functions and 64.11% lines
- `npm run test:e2e`: 54/54 Playwright checks across desktop and mobile Chromium
- Axe: 12/12 route and viewport scans pass WCAG A/AA rules without exclusions
- Critical scenarios cover catalogue search/filter/sort, product and invalid-product routes, selection add/remove/persistence, Russian-only locale contract, mobile menu, honest contact handoff, 404/deep links and keyboard skip navigation
- `.github/workflows/ci.yml` runs typecheck, lint, Vitest, build and Playwright for pull requests and pushes to `main`
- The first e2e run found and fixed hidden focusable mobile navigation, initial focus stealing and an unfocusable horizontal benefits region

The workflow is present locally. GitHub branch protection must require the `quality-gates` check after the workflow is pushed.

QA-005 executable test/lint/CI configuration: resolved  
QA-005 merge enforcement: pending GitHub ruleset configuration

## QA-006 regulated claims gate

- `src/data/claims-registry.json` contains 201 sentence-level candidates from
  the current 10 source product records, 137 official content records and Halo Complex™
  formula copy
- Every candidate has an exact source URL, source field, market, category and
  explicit `approved`, `pending` or `rejected` status
- Current status: 0 approved, 201 pending, 0 rejected
- No legal approval is inferred: reviewer, review date and document reference
  are empty until a qualified Moldova reviewer supplies them
- Product/page/formula fields with pending or rejected records are suppressed
  by the frontend and replaced with an honest review notice
- Current `Фитокомплексы` product pages display an interim supplement notice
  next to product information; the UI states that final Moldova wording and
  registration status remain unconfirmed
- `npm run claims:validate` detects missing/stale registry rows and invalid
  review metadata
- `npm run build` and GitHub Actions execute the claims validation gate
- `npm run release:check` independently blocks release while any claim is not
  approved
- 6 dedicated Playwright checks verify product suppression, the adjacent
  supplement notice and Halo Complex™ replacement state on desktop and mobile
- Primary-source rationale and reviewer workflow are documented in
  `docs/CLAIMS_REVIEW.md`

QA-006 technical publication guard: resolved  
QA-006 Moldova legal approval: pending under P0-LEGAL

## QA-007 home content hierarchy

- The hero remains a brand and atmosphere introduction without catalogue or
  formula CTA buttons
- The first content section after `.home-hero` is `.science-section` and
  introduces Halo Complex™
- `.home-product-showcase` follows the science section, so product promotion no
  longer precedes the brand's scientific positioning
- The obsolete `.hero-actions` styling was removed instead of leaving an
  unused layout path
- One component test locks the DOM order and absence of hero CTA labels
- Two Playwright checks verify the same order at 1440 × 900 and 390 × 844
- Browser inspection confirmed the visual order and no horizontal overflow in
  either viewport

QA-007 SSOT hierarchy alignment: resolved

## QA-008 product content completeness

- The source dataset contains 10 records: 7 complete products are published
  and 3 incomplete products remain editorial drafts
- Draft products are excluded from catalogue/search, product routes, related
  products, selection and consultation payloads
- Category rules define required and explicitly nullable fields in
  `scripts/product-content-lib.mjs`
- Empty strings mean missing content; `null` means not applicable only where a
  category rule explicitly permits it
- Product accordions omit `null` sections and no longer use missing-data
  placeholders as a publication strategy
- The official-source gaps were not filled with invented copy
- Imports default to `draft` and record `editorialStatus`
- `npm run content:validate`, production build and GitHub Actions reject an
  incomplete record marked `published`
- Every successful build regenerates the ignored
  `artifacts/reports/PRODUCT_CONTENT_REPORT.md`
- Unit and Playwright coverage verify publication filtering, draft deep links,
  complete published cards and nullable-section semantics
- Browser inspection at 1280 × 720 and 390 × 844 confirmed 7 visible cards,
  no Faya draft, no horizontal overflow and all three required accordion
  sections on a published product

QA-008 incomplete product publication: resolved  
QA-008 editorial completion of 3 drafts: pending under P0-ASSORTMENT

## QA-009 Moldova contacts and certificates

- The primary Contact page and footer use the official Chișinău branch address
  and two +373 phone numbers from the current Dr. Nona branch listing
- Israeli address/phone and the Telegram pending placeholder are removed from
  public contact surfaces
- International email support remains available but is explicitly separated
  from the Moldova direct-contact block
- The certificate country selector and Russian/Israeli/Ukrainian document sets
  are removed from the Moldova page
- The page exposes zero Moldova certificates until issuer, Moldova
  applicability, exact product scope and validity dates are documented
- The international archive is separated and explicitly labelled as not being
  proof of Moldova registration or certification
- `src/data/market.json` is the market-data source; `npm run market:validate`
  rejects non-Moldova primary contacts, pending placeholders, visible foreign
  certificates and incomplete certificate metadata
- Unit/component, Playwright desktop/mobile and axe coverage include Contact
  and Certificates routes
- Browser inspection at 1280 × 720 and 390 × 844 confirmed no horizontal
  overflow, no Israeli/Telegram contact text, no country selector and a clear
  separation between Moldova status and the international archive

QA-009 misleading foreign contact/certificate presentation: resolved  
QA-009 Moldova legal entity and certificate approvals: pending under
P0-CONTACT and P1-CONTENT

## QA-010 catalogue date semantics

- `releasedAt` is a separate approved product launch/catalogue-add date and is
  never inferred from sitemap metadata
- all 10 current records intentionally use `releasedAt: null` because no launch
  dates have been approved
- `sourceLastmod` is used only by the honestly labelled
  «Недавно обновлённые» sort
- changing a description or sitemap timestamp cannot change a product's
  release position
- products with a known release date sort before unknown dates; ties and
  unknown dates use stable `officialOrder`
- the legacy `sort=newest` query is normalized to `sort=updated` semantics
  instead of making a false novelty claim
- content validation rejects invalid non-null release dates
- unit/component and Playwright coverage lock the comparator, legacy query,
  label and catalogue interaction

QA-010 misleading newest sorting: resolved  
QA-010 approved product release dates: not provided; no dates were invented

## QA-011 route-level SEO metadata and static HTML

- `src/data/seo-manifest.json` is the single generated route metadata contract
  used by client navigation and static output
- 143 route HTML files are generated: 142 indexable and 1 explicit noindex
- every indexable route has a unique title, description and canonical path
- every route includes robots, Open Graph and Twitter Card metadata
- every generated HTML response contains its heading, description and
  breadcrumbs before JavaScript executes
- production-preview requests to extensionless product and article URLs return
  their route HTML directly with HTTP 200; they do not fall back to the home
  SPA shell
- 7 published product routes include Product and BreadcrumbList JSON-LD;
  draft products are absent
- Product JSON-LD deliberately omits unverified offer, review, rating,
  availability and medical-claim data
- 114 valid Blog/News routes include BlogPosting or NewsArticle plus
  BreadcrumbList JSON-LD
- sitemap lastmod is used only as Article `dateModified`; no publication date
  is inferred
- the build emits `sitemap.xml`, `robots.txt` and `docs/SEO_REPORT.md`
- `npm run seo:validate` rejects missing, duplicate or structurally invalid
  metadata and verifies pre-JavaScript route content

QA-011 route metadata, structured data and prerender implementation: resolved  
QA-011 production origin and live Google validation: pending under
P1-SEO-ORIGIN

## QA-012 canonical, sitemap, robots, hreflang and duplicate home

- `/main` is absent from the SEO manifest, static output and sitemap
- direct `/main` and `/main/` requests receive HTTP `308 Location: /` in Vite
  development and production preview; the client route also replaces history
  as a hosting fallback
- all 142 sitemap entries are unique, indexable canonical URLs; `/selection`,
  `/main`, unknown routes and drafts are excluded
- every generated route contains exactly one absolute canonical link
- all 142 sitemap URLs return HTTP 200 with the matching canonical and
  route-specific pre-JavaScript HTML in the automated production-preview gate
- `robots.txt` and `sitemap.xml` return HTTP 200
- current Russian pages declare self-referential `ru-MD` and `x-default`
  alternates
- no false `ro-MD` alternate is emitted while the Romanian UI/content
  localization remains incomplete
- the approved future locale strategy is Russian on unprefixed URLs and
  Romanian on `/ro/...`, with reciprocal alternates on every translated pair

QA-012 duplicate/canonical/sitemap/robots implementation: resolved  
QA-012 independent Romanian URLs and reciprocal RU/RO hreflang: blocked by
P0-LOCALE until the complete Romanian version exists

## QA-013 route data splitting and initial cost

- `products.json` and `official-pages.json` are dynamic imports backed by
  stable lazy loaders; importing `data.ts` no longer evaluates either dataset
- `src/pages/CatalogPage.tsx` is a real route module loaded through
  `lazy(() => import(...))`, not an already-defined Promise wrapper
- the production catalogue route chunk is 3.77 KB raw / 1.50 KB gzip
- the 477.92 KB raw official-content chunk is absent from initial preload and
  is requested only by official/About/Editorial routes
- Home loads product data needed for visible product promotion but does not
  request the complete official dataset
- direct Contact with no selection context requests neither product nor
  official data
- the 190.17 KB full claims registry remains available to build/legal QA; the
  browser receives a generated 16.57 KB runtime index instead
- main application JS decreased from approximately 381.51 KB raw / 64.33 KB
  gzip to 227.29 KB raw / 32.99 KB gzip
- measured initial entry/preload/CSS total is 121,878 B gzip and 102,313 B
  Brotli, below budgets of 140 KiB and 115 KiB
- `npm run performance:validate` produces
  `docs/PERFORMANCE_REPORT.md` and blocks budget/preload regressions
- Playwright verifies Home, Contact and Catalog request graphs in both
  desktop and mobile Chromium
- isolated production-preview V8 parse/script/task measurements pass for Home,
  Contact and Catalog; current measurements and route budgets are recorded in
  `docs/RUNTIME_PERFORMANCE_REPORT.md`

QA-013 content splitting, route chunk and performance budget: resolved

## QA-014 frontend module and stylesheet boundaries

- `src/App.tsx` decreased from 1,933 lines / 72.9 KB to a 17-line composition
  root containing only providers, shell and route composition
- all 17 public route groups use separate `src/pages/*Page.tsx` modules and
  real `lazy(() => import(...))` calls in `src/app/routes.tsx`
- shell, reusable UI, About/Editorial shared presentation, selection state,
  catalogue logic and contact handoff are separated by their actual feature
  boundaries
- catalogue filter/search/sort logic is independently covered by three unit
  tests
- consultation context resolution, URL/SKU serialization and email/contact
  handoff are independently covered by three unit tests
- Russian UI resources live in `src/locales/ru.ts`; DOM locale synchronization
  is isolated in `src/locales/LocaleProvider.tsx`
- the former 4,777-line stylesheet is split into 11 thematic files; the
  11-line root stylesheet is only an ordered import manifest
- a browser check found and corrected a mobile cascade regression caused by
  route CSS loading after media queries; the final catalogue is one column at
  390 px with no horizontal overflow
- production output contains distinct Home, Catalog, Product, Contact, Formula,
  About/History and other route chunks
- `npm run architecture:validate` enforces the boundaries during build and
  GitHub Actions
- full `npm run ci` passes: architecture, market/content/claims gates,
  TypeScript, ESLint, 37 Vitest tests, production build, runtime performance
  and 58 Playwright desktop/mobile tests
- the final initial payload remains within budget at 110,351 B gzip /
  93,131 B Brotli after restoring cascade-safe stylesheet ordering and adding
  the application recovery layer

QA-014 App/CSS monolith and missing route boundaries: resolved

## QA-015 malformed URL and render recovery

- `safeDecodeRouteSegment` returns `null` instead of allowing
  `decodeURIComponent` to throw
- `Routes` validates the complete pathname and renders the controlled fallback
  for malformed client-side navigation
- Vite dev/preview middleware catches malformed direct HTTP paths before
  internal URL decoding and redirects them without caching to the noindex
  `/bad-request` page
- `%` and `%E0%A4%A` direct deep links show «Ссылка повреждена» rather than a
  blank response on desktop and mobile
- navigation from the controlled screen back to Home succeeds
- `ApplicationErrorBoundary` wraps Router and all providers, shows a recoverable
  Russian error screen and resets on navigation
- router/render failures are written to a bounded 20-record session diagnostic
  log, emitted as `drnona:error` and forwarded through the optional production
  monitoring adapter; transport failure is isolated
- monitoring records exclude search parameters and form data
- 41 Vitest tests cover safe decoding, malformed route fallback, recovery,
  boundary UI and monitoring forwarding
- direct malformed deep-link coverage runs in both desktop and mobile Chromium
- full `npm run ci` passes with 58 Playwright tests, route-level SEO, HTTP,
  accessibility and performance gates

QA-015 malformed URL blank screen and missing application boundary: resolved

## QA-016 repository artifacts

- `dist/`, coverage, Playwright output, environment files, logs and editor
  metadata are ignored
- all 101 previously tracked `dist` files are removed from the source tree
- root-level QA screenshots and logo source variants are moved into
  `docs/qa-package/2026-07-27/`
- approved runtime hero JPEGs live under `public/brand/hero/`, outside the QA
  namespace
- `ARTIFACT_MANIFEST.json` records all 47 historical images with role, report,
  byte size and SHA-256; missing or stale manifests fail
  `npm run repository:validate`
- production bundles and generated QA/build reports are uploaded by CI under
  an artifact name containing `github.sha`
- CI finishes with a clean-worktree assertion after build and Playwright

QA-016 build/QA artifact hygiene: resolved

## QA-017 typography accessibility

- visible informational text now has a 14 px minimum
- navigation, controls and text links use a 15 px UI token
- compact paragraphs use a 15 px body token; primary body remains 16 px
- market label, hero benefit text, promotional copy, footer, breadcrumbs,
  product metadata and other previously undersized elements use the shared
  accessible scale
- `--muted` changed from `#5f747c` to `#536a73`; measured contrast is 4.92:1
  to 5.71:1 across `paper`, white, `mist` and `sea-050`
- `npm run typography:validate` rejects explicit sizes below 14 px, weak muted
  contrast and viewport metadata that disables zoom
- Axe WCAG A/AA coverage includes Home, Catalog, Product, Selection, Contact,
  Certificates, About and Halo Complex on desktop and mobile
- browser tests verify six priority routes at 320, 640 and 1920 px, where
  640 px is the CSS viewport equivalent to 200% zoom on a 1280 px display, and
  apply WCAG text-spacing overrides at 390 px
- no horizontal overflow or clipped interactive text was found

QA-017 undersized typography and contrast: resolved

## QA-018 safe content sync and promotion

- `sync:content` now creates an ignored staging candidate and never writes
  directly to `src/data`
- product, content, source summary and policy records use strict Zod schemas
- manifest and sitemap URLs outside the allowlist are rejected and excluded
  before product/content page fetches
- the gate rejects unexpected product/content count drops, required-field
  regressions, duplicate product slug/SKU, duplicate content paths, schema
  errors and content error records above policy
- every candidate contains an exact diff, fetch errors, validation report and
  human review instructions
- promotion requires successful revalidation, the exact SHA-256 fingerprint
  and a named reviewer
- production data is backed up before promotion and restored if any write
  fails; successful promotions create a versioned audit record
- automated unit coverage exercises all QA-018 blocking acceptance criteria

QA-018 unvalidated destructive content sync: resolved

## QA-019 security headers and CSP

- root `vercel.json` is the version-controlled deployment source for global
  security headers and asset caching
- Vite reads that policy directly; no independent local copy can drift
- CSP starts in report-only deployment mode and is converted without content
  changes to enforcing mode during automated HTTP and Chromium checks
- `script-src` is exactly `'self'`; `unsafe-eval`, inline scripts, wildcards
  and broad scheme sources fail the gate
- external runtime origins are limited to Google Fonts stylesheet/font
  delivery and Cloudinary editorial images
- framing is denied by both `frame-ancestors 'none'` and `X-Frame-Options:
  DENY`
- MIME sniffing, referrer leakage, sensitive browser capabilities, cross-origin
  opener isolation and HSTS are explicitly controlled
- immutable caching is limited to fingerprinted assets; mutable brand/product
  media uses a bounded one-day policy
- automated HTTP coverage verifies identical headers on Home, Catalog,
  Product, Article, Contact, 404, asset and `/main` redirect responses
- Chromium renders five representative routes under enforced CSP with zero
  policy violations

QA-019 repository-controlled security policy: resolved  
QA-019 live Vercel response: NOT VERIFIED until a deployment URL is supplied

## QA-020 responsive viewport and visual regression coverage

- automated functional coverage now includes 320, 375, 430, 768, 1024, 1440
  and 1920 px instead of relying only on 390 and 1440 px
- mobile landscape is covered at 844 × 390; a 640 px CSS viewport verifies
  reflow and action availability at the 200% zoom equivalent
- every required width exercises header/menu, Home hero, catalogue filters,
  cards, product title, accordions, selection, contact panel and footer
- empty catalogue, empty selection and controlled malformed-link states are
  included
- simulated long Romanian headings, descriptions and labels verify layout
  resilience without enabling the incomplete production locale
- geometry checks reject document horizontal scroll, clipped text/actions,
  overlapping actions, overflow-ancestor clipping and touch actions below
  44 × 44 px
- seven versioned, platform-neutral full-page catalogue screenshots run as
  visual regressions in the same Playwright command used by CI
- the matrix found and corrected a 1024 px no-wrap overflow, clipped catalogue
  selection controls in dense grids and an out-of-bounds Halo science point
- focused browser verification passes all 9 functional responsive profiles
  and all 7 visual comparisons
- the contract, baseline policy and update command are recorded in
  `docs/RESPONSIVE_QA.md`

QA-020 responsive matrix and visual regression implementation: resolved

## QA-021 safe browser storage

- all production locale and selection persistence now uses the shared
  `src/app/storage.ts` adapter; no provider calls `localStorage` directly
- both reads and writes catch storage access, security and quota failures
- each value has an explicit schema: locale accepts only `ru`, while selection
  accepts at most 100 unique, trimmed string slugs
- malformed JSON and schema-invalid persisted data fall back to safe defaults
  instead of entering application state
- successful state changes are written to an in-memory mirror before browser
  persistence is attempted
- once a key becomes unavailable, its current-session reads continue from the
  memory mirror without repeatedly touching the blocked backend
- storage diagnostics use the existing bounded monitoring path and expose only
  operation and key metadata, never persisted values
- monitoring failure is isolated and cannot turn a storage exception into a
  render failure
- five focused unit/integration tests cover thrown reads, thrown writes,
  malformed values, schema normalization and a complete App render/selection
  remount in restricted-storage mode
- two Chromium checks repeat the restricted-storage startup and selection
  journey on desktop and mobile, assert telemetry delivery and reject every
  uncaught page error

QA-021 unprotected browser storage access: resolved

## QA-022 local accessibility semantics

- the obsolete locale-switch finding no longer applies to the current release:
  QA-002 removed the incomplete RO control from both desktop and mobile
- no generic labelled locale container or hardcoded mobile locale label remains
  in the rendered header; a meaningless single-option language group was not
  reintroduced
- when Romanian localization is complete, its future selector must use a
  semantic `fieldset`/`legend` or one labelled `role="group"` and strings from
  the active locale resource
- header, mobile-navigation, skip-link, brand-home and breadcrumb accessibility
  names now come from the centralized Russian locale resource
- both visible breadcrumb separators are decorative and use
  `aria-hidden="true"`; the final crumb exposes `aria-current="page"`
- every product accordion trigger has a stable `id`, `aria-expanded` and
  `aria-controls`
- every accordion panel has the matching `id`, `role="region"` and
  `aria-labelledby`; the visual plus/minus indicator is hidden from the
  accessibility tree
- component coverage verifies separator/current-page semantics, the complete
  trigger-panel relationship and state changes after activation
- 16 Axe WCAG A/AA scans and 2 explicit semantic Playwright checks pass across
  desktop and mobile Chromium

QA-022 breadcrumb and accordion semantic gaps: resolved  
QA-022 locale group: not applicable until the approved RO interface exists

## QA-023 runtime and dependency concerns

- Node `22.23.1` is pinned in `.nvmrc`; `package.json#engines` accepts only the
  supported Node 22 and npm 10 ranges
- npm `10.9.8` is fixed through `packageManager`
- GitHub Actions runs on `ubuntu-latest`, reads Node from `.nvmrc`, installs the
  exact npm version and verifies both before `npm ci`
- README identifies the CI reference environment and the supported local
  Windows, macOS and Linux development environments
- all README install, development, build, validation and content-sync examples
  use portable `npm` commands rather than `npm.cmd`
- Cheerio is classified as build-only tooling: scraper, prerender, SEO and
  performance scripts use it, but it is absent from production dependencies
- the lockfile marks Cheerio and its dependency branch as development-only
- repository validation rejects engine/package-manager drift, Cheerio in
  production dependencies, CI version drift and future `npm.cmd` README
  regressions
- generated build, SEO and performance instructions now use portable command
  syntax as well

QA-023 production/dev dependency and runtime contract: resolved
