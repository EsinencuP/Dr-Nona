# Is the Dr. Nona Moldova site ready for production?

No. Technical quality gates pass locally, but production approval remains blocked by the items below.

Last verified: 2026-07-31 against base commit `2411f54ce49d63fed776b09fcba1b61381c71d10` and the current cleanup worktree.

This file is generated from `docs/release-status.json`. Run `npm run release:status:generate` after changing the machine-readable status.

## Status identity

| Field | Value |
|---|---|
| Verdict | `release-blocked` |
| Label | Technical QA passes; production approval is blocked |
| Branch | `main` |
| Base commit | `2411f54ce49d63fed776b09fcba1b61381c71d10` |
| Environment | Windows local QA with Node 22.23.1, npm 10.9.8 and Chromium desktop/mobile |

## Current dataset

| Dataset | Count |
|---|---:|
| Source products | 10 |
| Published products | 7 |
| Draft products | 3 |
| Official content records | 137 |
| Claims | 201 |
| Approved claims | 0 |
| Pending claims | 201 |
| Rejected claims | 0 |

## Open release blockers

| ID | Priority | Owner | Summary |
|---|---|---|---|
| `P0-LOCALE` | P0 | content | The complete Romanian interface and content set is not approved or implemented. |
| `P0-CONTACT` | P0 | product | Telegram delivery works locally, but privacy, production origin and abuse protection are not approved. |
| `P0-LEGAL` | P0 | legal | Moldova legal review has not approved any regulated product claim. |
| `P0-ASSORTMENT` | P0 | product | The final production assortment and the disposition of three draft products are not approved. |
| `P1-MEDIA-RIGHTS` | P1 | legal | Production publication rights for product, brand and editorial media are not confirmed. |
| `P1-CONTENT` | P1 | content | Moldova certificates and the final local scope for service and editorial pages are not approved. |
| `P1-RANKING` | P1 | product | The popularity ranking has no approved business data source. |
| `P1-CI-PROTECTION` | P1 | engineering | The repository workflow exists, but the required GitHub branch rule is not verified. |
| `P1-SEO-ORIGIN` | P1 | engineering | The production origin and live search-engine validation are not approved. |

## Acceptance criteria

### `P0-LOCALE`

- Approve Romanian UI, product content, editorial content, metadata and alt text.
- Publish shareable /ro/... routes with reciprocal hreflang.
- Pass Russian and Romanian smoke, accessibility and SEO checks.

### `P0-CONTACT`

- Approve the Moldova legal recipient, consent copy and retention policy.
- Configure the production origin and server-side WAF or rate limiting.
- Verify successful and failed submissions on the deployed form without duplicate delivery.

### `P0-LEGAL`

- Assign a qualified Moldova reviewer.
- Record classification, evidence, reviewer, date and document reference for each claim.
- Keep pending and rejected claims out of production output.

### `P0-ASSORTMENT`

- Approve the final list of products for Moldova.
- Complete and approve each retained draft or remove it from the source dataset.
- Pass the content completeness gate with the approved assortment.

### `P1-MEDIA-RIGHTS`

- Record the source and permitted production use for each published asset.
- Remove or replace any asset without confirmed rights.

### `P1-CONTENT`

- Provide Moldova-applicable certificate metadata and document sources.
- Approve the Moldova scope for FAQ, branches, Blog and News.
- Keep foreign certificates clearly separated from Moldova evidence.

### `P1-RANKING`

- Provide an approved popularity rank or approve official catalogue order as the permanent fallback.
- Document and test the selected comparator.

### `P1-CI-PROTECTION`

- Push the workflow to GitHub.
- Require the quality-gates check on the main branch.
- Verify that a failing check blocks merge.

### `P1-SEO-ORIGIN`

- Approve the public production origin and build with SITE_URL.
- Deploy prerendered canonical routes, sitemap and robots policy.
- Pass live Rich Results and URL inspection without critical errors.

## Release rule

A successful build confirms compilation, generated output and automated checks. It does not approve legal content, business data, production operations or deployment.

Change the verdict to `release-ready` only when every P0 and P1 blocker is closed and `npm run release:check` exits successfully.
