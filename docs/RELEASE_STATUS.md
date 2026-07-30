# Is the Dr. Nona Moldova site ready for production?

No. The current repository is a frontend QA candidate. Production release remains blocked by the P0 and P1 items below.

## Status identity

| Field | Value |
|---|---|
| Status date | 2026-07-30 |
| Status | RELEASE BLOCKED |
| Current environment | Local preview at `http://127.0.0.1:4173` |
| Current product dataset | 10 source records: 7 published, 3 drafts |
| Current official content dataset | 137 records |
| Current claims registry | 201 records: 0 approved, 201 pending, 0 rejected |
| Current UI language | Russian |
| Machine-readable source | `docs/release-status.json` |
| Current QA index | `docs/QA_REPORT.md` |
| Generated build evidence | `artifacts/reports/BUILD_REPORT.md` locally; commit-scoped CI artifact in GitHub Actions |

The build report records the exact commit, repository state, environment and dataset counts for each successful build.

## Open P0 blockers

| ID | Required decision or deliverable |
|---|---|
| P0-LOCALE | Approve and implement complete Romanian UI, content, metadata and alt text on the approved `/ro/...` URL strategy |
| P0-CONTACT | The official Moldova branch phones are published; approve the local legal entity, written consultation recipient, server transport, consent text and retention rules |
| P0-LEGAL | Review all 201 registry candidates, confirm product classification and supplement warnings, and record reviewer/date/evidence |
| P0-ASSORTMENT | Approve the final assortment and complete or remove the 3 draft records; only 7 of 10 source records are currently publishable |

## Open P1 blockers

| ID | Required decision or deliverable |
|---|---|
| P1-MEDIA-RIGHTS | Confirm production usage rights for product, brand and editorial media |
| P1-CONTENT | Provide Moldova-applicable certificates with issuer/product/validity metadata and approve Moldova-specific FAQ, branches, Blog and News scope |
| P1-RANKING | Provide an approved popularity rank or approve official catalogue order as the permanent fallback |
| P1-CI-PROTECTION | Push the workflow and require the `quality-gates` check in the GitHub `main` ruleset |
| P1-SEO-ORIGIN | Approve the production origin, set `SITE_URL`, deploy the prerendered output and complete live Google Rich Results / URL Inspection validation |

## Completed frontend gates

- The React and TypeScript application builds successfully
- The source dataset contains 10 products; the public catalogue exposes only
  the 7 complete, editorially ready records
- The official content dataset contains 137 records
- The catalogue, product, selection and contact routes render locally
- The selection transfers names, SKU and product URLs to the consultation screen
- The site does not expose a fake contact submission
- Contact and footer use the source-backed Chișinău address and +373 phones;
  Israeli contact details and Telegram placeholders are removed
- Foreign certificate sets are hidden from the Moldova page and the build
  validates complete metadata for any future Moldova certificate
- The incomplete Romanian mode is removed
- Pending and rejected claim fields are hidden from the public UI
- The build validates the sentence-level claims registry and reviewer metadata
- The build rejects incomplete published product records and generates a
  content-completeness report
- Local typecheck, lint, Vitest, build and desktop/mobile Playwright checks pass
- The build prerenders route-specific HTML, metadata and JSON-LD for every
  published/indexable route and rejects structural SEO errors
- The build publishes one canonical per route, redirects `/main` to `/` with
  HTTP 308, exposes sitemap/robots, and verifies every sitemap URL over HTTP
- Current Russian routes expose `ru-MD` and `x-default`; `/ro/...` remains
  withheld until complete Romanian localization is approved

These gates support QA review. They do not override the open release blockers.

## Rule for release approval

Set `status` to `release-ready` in `docs/release-status.json` only after the P0 and P1 blocker arrays are empty. The build-report generator rejects a ready status while blockers remain.

Run `npm.cmd run release:check` before publication. The command exits with code
1 while any P0/P1 item remains open or any claims registry record is not
approved.
