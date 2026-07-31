# What work remains before release?

This roadmap contains unfinished work only. Completed implementation history stays in Git and active product choices stay in `DECISIONS.md`.

Last verified: 2026-07-31 against `docs/release-status.json` and the current worktree.

## External approval blockers

External owners must resolve these tasks before engineering can mark the release ready.

### `P0-LEGAL`: approve regulated content

- **Priority**: P0
- **Status**: Open
- **Owner**: Legal
- **Dependency**: Qualified Moldova reviewer and evidence package
- **Goal**: Decide every regulated claim for the Moldova market
- **Acceptance criteria**: Record classification, decision, reviewer, date and source document; publish no pending or rejected claim
- **Verification commands**: `npm run claims:validate`, `npm run release:check`

### `P0-CONTACT`: approve privacy and recipient data

- **Priority**: P0
- **Status**: Open
- **Owner**: Product/legal
- **Dependency**: Moldova legal recipient, consent copy and retention decision
- **Goal**: Make the existing Telegram form operationally and legally deployable
- **Acceptance criteria**: Approve recipient, consent, retention and production origin; confirm the deployed successful and failed flows
- **Verification commands**: `npm run test`, `npm run test:e2e`, `npm run release:check`

### `P0-ASSORTMENT`: approve the product set

- **Priority**: P0
- **Status**: Open
- **Owner**: Product/content
- **Dependency**: Final Moldova assortment and missing draft content
- **Goal**: Decide which of the 10 source products may ship
- **Acceptance criteria**: Approve the final list; complete or remove all three drafts; keep every published record complete
- **Verification commands**: `npm run content:validate`, `npm run build`

### `P1-MEDIA-RIGHTS`: confirm publication rights

- **Priority**: P1
- **Status**: Open
- **Owner**: Legal/content
- **Dependency**: Asset provenance and licenses
- **Goal**: Confirm production use for each published product, brand and editorial asset
- **Acceptance criteria**: Record the source and permitted use; remove or replace unapproved media
- **Verification commands**: `npm run repository:validate`, `npm run build`

### `P1-CONTENT`: approve Moldova-specific pages

- **Priority**: P1
- **Status**: Open
- **Owner**: Content
- **Dependency**: Moldova certificates and editorial scope
- **Goal**: Publish only market-applicable documents and service content
- **Acceptance criteria**: Supply certificate issuer, country, product scope, validity and source; approve FAQ, branches, Blog and News scope
- **Verification commands**: `npm run market:validate`, `npm run build`

### `P1-RANKING`: define popularity

- **Priority**: P1
- **Status**: Open
- **Owner**: Product
- **Dependency**: Approved business ranking or fallback decision
- **Goal**: Make “По популярности” semantically accurate
- **Acceptance criteria**: Provide a ranking dataset or approve official catalogue order; document and test the comparator
- **Verification commands**: `npm run test`, `npm run build`

### `P0-LOCALE`: approve Romanian localization

- **Priority**: P0
- **Status**: Open
- **Owner**: Content/product
- **Dependency**: Complete approved Romanian copy
- **Goal**: Add a complete Romanian version without mixed-language pages
- **Acceptance criteria**: Translate UI, content, metadata, alt text, errors and accessibility labels; publish `/ro/...` routes with reciprocal hreflang
- **Verification commands**: `npm run typecheck`, `npm run test:e2e`, `npm run build`

## Engineering tasks

Engineering can complete these tasks after the related external inputs are approved.

### `P0-CONTACT-ENGINEERING`: protect production submissions

- **Priority**: P0
- **Status**: Open
- **Owner**: Engineering
- **Dependency**: Approved production origin and abuse-protection policy
- **Goal**: Protect `POST /api/applications` without changing the form contract
- **Acceptance criteria**: Configure server-side WAF or rate limiting; preserve validation, retry and failure states; verify no duplicate delivery
- **Verification commands**: `npm run test`, `npm run test:e2e`, production smoke test

### `P1-CI-PROTECTION`: enforce quality gates

- **Priority**: P1
- **Status**: Open
- **Owner**: Engineering
- **Dependency**: GitHub repository administration
- **Goal**: Prevent merging a failing `main` change
- **Acceptance criteria**: Push the workflow; require `quality-gates`; prove a failing check blocks merge
- **Verification commands**: `npm run ci`, GitHub ruleset inspection

### `P1-SEO-ORIGIN`: deploy canonical static output

- **Priority**: P1
- **Status**: Open
- **Owner**: Engineering/product
- **Dependency**: Approved production origin
- **Goal**: Serve production canonical metadata and prerendered routes
- **Acceptance criteria**: Build with `SITE_URL`; deploy canonical HTML, sitemap and robots; pass live Rich Results and URL inspection
- **Verification commands**: `npm run build`, `npm run seo:http-validate`, live validators

## Later backlog

These tasks do not replace release blockers:

- Approve product launch dates before adding a “Сначала новые” sort
- Define catalogue key performance indicators and analytics consent
- Decide whether comparison or recently viewed products enter a later scope
