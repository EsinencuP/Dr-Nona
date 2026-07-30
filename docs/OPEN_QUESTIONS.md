# Which decisions still block release?

This file lists only unresolved decisions. `docs/RELEASE_STATUS.md` is the canonical release summary, and `docs/release-status.json` supplies its machine-readable blocker list.

Last updated: 2026-07-30

## P0 release decisions

### P0-LOCALE: approve Romanian localization

Approve the Romanian UI, product and editorial copy, metadata and alt text.
The URL strategy is fixed by D-058 (`/ro/...` with reciprocal `hreflang`), but
those routes cannot be published until the complete translation exists. The
current build remains Russian-only under D-048.

### P0-CONTACT: approve the Moldova consultation channel

The official branch listing now supplies a Chișinău address and two +373
phones, which are the primary public contacts. Approve the Moldova legal entity
or distributor name, a local written consultation recipient if one exists,
server transport, consent text and retention requirements. The current site
prepares email only for international support and does not claim server
delivery.

### P0-LEGAL: approve regulated product claims

Assign a qualified Moldova reviewer. The current sentence-level registry has
201 candidates and zero approvals. The reviewer must confirm product
classification, evidence, exact wording, supplement registration and required
warnings, then record their name, date and document reference for every
decision. Pending/rejected fields are hidden; details are in
`docs/CLAIMS_REVIEW.md`.

### P0-ASSORTMENT: approve the production assortment

Confirm that the 10 source records in `src/data/products.json` form the final
production assortment. Seven complete records are currently published; three
remain drafts until required content is approved and filled. Provide the final
list and either complete or remove every draft.

## P1 release decisions

### P1-MEDIA-RIGHTS: confirm publication rights

Confirm production rights for every product image, generated campaign image, brand asset and editorial photograph.

### P1-CONTENT: approve Moldova-specific content

Provide Moldova-applicable certificates with issuer, country, product scope and
validity metadata. Approve the remaining Moldova scope for FAQ, branches, Blog
and News. Foreign certificate sets are excluded from the Moldova page.

### P1-RANKING: approve popularity semantics

Provide a popularity rank or approve official catalogue order as the permanent fallback for “По популярности”.

### P1-CI-PROTECTION: require the GitHub check

Push `.github/workflows/ci.yml`, then require the `quality-gates` check in the `main` branch ruleset. GitHub stores this enforcement outside the repository.

### P1-SEO-ORIGIN: approve production SEO origin and live validation

Approve the public production origin, build with `SITE_URL` and
`RELEASE_MODE=production`, deploy the generated route HTML and run Google Rich
Results plus URL Inspection against the public URLs. The local QA origin
`http://127.0.0.1:4173` is intentionally not presented as a production
canonical.

## Resolved questions

- **Primary interface language**: Russian until the complete Romanian release is approved, D-048
- **Current product count**: 10 source records, 7 published and 3 drafts; final
  production approval remains P0-ASSORTMENT
- **Selection storage**: browser `localStorage`
- **Selection persistence**: survives refresh and navigation
- **Consultation payload**: product name, SKU and URL, D-049
- **Contact form**: removed until a server transport and Moldova recipient exist, D-047
- **Primary direct contact**: official Chișinău address and two +373 phones,
  D-054
- **Certificate market separation**: foreign documents are hidden from the
  Moldova page, D-055
- **Scientific complex name**: `Halo Complex™`, D-041

## P2 backlog

- Provide approved product launch/catalogue-add dates if the public
  «Сначала новые» sort is required; until then the UI uses the separate
  «Недавно обновлённые» source-freshness sort
- Define measurable catalogue key performance indicators
- Approve analytics and cookie-consent requirements
- Decide whether comparison and recently viewed products enter a later release
- Define the permanent empty-search and no-results analytics events

Record each approved answer in `docs/DECISIONS.md`, remove the matching blocker from `docs/release-status.json`, then run `npm.cmd run build`.
