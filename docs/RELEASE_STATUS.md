# Is the Dr. Nona Moldova site ready for production?

No. Technical quality gates pass locally, but production approval remains blocked by the items below.

Last verified: 2026-10-30 against base commit `3107742bd65b` and the current cleanup worktree.

This file is generated from `docs/release-status.json`. Run `npm run release:status:generate` after changing the machine-readable status.

## Status identity

| Field | Value |
|---|---|
| Verdict | `release-blocked` |
| Label | Verbatim Moldova originals restored; editorial and legal review remain separate; production blocked |
| Branch | `content/product-descriptions` |
| Base commit | `3107742bd65b` |
| Environment | Windows local QA with Node 22.23.1, npm 10.9.8 and Chromium desktop/mobile; GitHub Actions and Vercel production smoke |

## Current dataset

| Dataset | Count |
|---|---:|
| Source products | 50 |
| Published products | 50 |
| Draft products | 0 |
| Official content records | 137 |
| Claims | 433 |
| Approved claims | 0 |
| Pending claims | 433 |
| Rejected claims | 0 |

## Open release blockers

| ID | Priority | Owner | Summary |
|---|---|---|---|
| `P0-CONTACT` | P0 | product | Telegram delivery and an application-level rate guard are implemented, but privacy, production origin and platform-wide abuse protection are not approved. |
| `P0-LEGAL` | P0 | legal | Moldova legal review has not approved any regulated product claim. |
| `P1-MEDIA-RIGHTS` | P1 | legal | Production publication rights for product, brand and editorial media are not confirmed. |
| `P1-CONTENT` | P1 | content | Moldova certificates and the final local scope for service and editorial pages are not approved. |
| `P1-CI-PROTECTION` | P1 | engineering | The repository workflow exists, but the required GitHub branch rule is not verified. |
| `P1-SEO-ORIGIN` | P1 | engineering | The production origin and live search-engine validation are not approved. |
| `P0-LOCALE` | P0 | content | New verbatim RU/RO source originals supersede the 2026-10-05 copy fingerprints. Original text reproduction is owner-authorized; independent editorial review remains pending. |

## Acceptance criteria

### `P0-CONTACT`

- Approve the Moldova legal recipient, consent copy and retention policy.
- Configure the production origin and verify the application guard plus a platform-wide Vercel WAF policy.
- Verify successful and failed submissions on the deployed form without duplicate delivery.

### `P0-LEGAL`

- Assign a qualified Moldova reviewer.
- Record classification, evidence, reviewer, date and document reference for each claim.
- Keep pending and rejected claims out of production output.

### `P1-MEDIA-RIGHTS`

- Record the source and permitted production use for each published asset.
- Remove or replace any asset without confirmed rights.

### `P1-CONTENT`

- Provide Moldova-applicable certificate metadata and document sources.
- Approve the Moldova scope for FAQ, branches, Blog and News.
- Keep foreign certificates clearly separated from Moldova evidence.

### `P1-CI-PROTECTION`

- Push the workflow to GitHub.
- Require the quality-gates check on the main branch.
- Verify that a failing check blocks merge.

### `P1-SEO-ORIGIN`

- Approve the public production origin and build with SITE_URL.
- Deploy prerendered canonical routes, sitemap and robots policy.
- Pass live Rich Results and URL inspection without critical errors.

### `P0-LOCALE`

- Review the current original RU/RO copy without treating source reproduction as medical/legal approval.
- Record current review evidence for the revised originals; do not reuse stale translation approval.

## Resolved blockers

| ID | Status | Date | Resolution |
|---|---|---|---|
| `P1-RANKING` | resolved | 2026-09-17 | Owner-approved distinct completed real-order counts in a rolling 90-day window; at least 10 orders from 5 clients, human-reviewed aggregate snapshot, seven-day expiry, official-order fallback, RU/RO disclosure and no catalogue runtime CRM access. Current production data is below threshold, so fallback is expected. |

## Release rule

A successful build confirms compilation, generated output and automated checks. It does not approve legal content, business data, production operations or deployment.

Change the verdict to `release-ready` only when every P0 and P1 blocker is closed and `npm run release:check` exits successfully.
