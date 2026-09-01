# What changed after the precision audit?

This response records the repository-level disposition of `full_audit_precision_report.md` dated 2026-08-30. It distinguishes code defects from approvals that engineering cannot invent.

Last verified: 2026-08-30 against base commit `678eac7` and the precision-audit remediation worktree.

## Resolved in the repository

| Audit item | Result | Evidence |
|---|---|---|
| `P2-SEC-CSP-REPORT-ONLY` | Resolved | `vercel.json` now ships `Content-Security-Policy`; representative production routes render with zero violations under `npm run security:runtime`. |
| `P2-UX-TAB-SYNC` | Already resolved before this audit response | `SelectionContext` listens for `storage` changes. A two-tab Playwright regression now verifies the header count on desktop and mobile. |
| `P3-ACC-FOCUS-OUTLINE` | Resolved | The global focus indicator uses a two-tone ring. The automated adjacent-contrast floor is 8.02:1. |
| Contact endpoint has no code-level rate limit | Partially resolved | The production handler now applies a bounded five-attempt-per-minute fixed-window guard per anonymized client address and returns `429` with `Retry-After`. |
| Missing offline form test | Resolved | Playwright now verifies that a disconnected request shows failure and preserves entered fields on desktop and mobile. |
| Missing cross-tab selection test | Resolved | Playwright now opens two tabs, changes the selection in one and verifies the count in the other. |

## Still blocked by external decisions

| Audit item | Why it remains open | Required owner action |
|---|---|---|
| `P0-LOCALE` | Approved Romanian UI, product, editorial, metadata, alt and accessibility copy is not supplied. | Content/product approval and translation review. |
| `P0-CONTACT` | The in-process guard is not globally shared between serverless instances; consent wording and retention are not approved. | Publish a Vercel WAF rule and approve privacy operations. |
| `P0-LEGAL` | All 399 detected regulated statements are still pending. Affected source fields are quarantined from public runtime output and the release gate remains blocked. | Qualified Moldova reviewer decisions with evidence and dates. |
| `P1-MEDIA-RIGHTS` | The repository cannot prove the owner's production publication rights. | Legal/media provenance record. |
| `P1-CONTENT` | No approved Moldova certificate package is present. | Certificate metadata and source documents. |
| `P1-RANKING` | “Popularity” has no approved business dataset. | Product owner ranking or approved fallback. |
| `P1-CI-PROTECTION` | CI exists, but the remote GitHub ruleset is an administrative setting. | Require `quality-gates` on `main` and verify a blocked merge. |
| `P1-SEO-ORIGIN` | Vercel origin auto-detection is implemented, but the final public domain and live validators are not approved. | Confirm the domain and perform live inspection after deployment. |

## Verification result

- TypeScript: pass
- ESLint: pass with zero warnings
- Vitest: 22 files, 165 tests passed
- Production build: pass; 301 prerendered routes and 299 sitemap URLs
- Enforced CSP runtime: five representative routes, zero violations
- Playwright: 133 passed, 17 intentionally skipped across desktop and mobile
- Release gate: expected blocked by the eight external P0/P1 items above

The precision audit's release verdict remains `release-blocked`, but its three actionable UI/security findings and both stated testing gaps now have repository evidence.
