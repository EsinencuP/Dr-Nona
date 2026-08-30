# Which QA result is current?

This report indexes the current automated evidence only. It does not preserve historical screenshots or cumulative implementation logs.

Last verified: 2026-08-30 against base commit `678eac7` and the precision-audit remediation worktree.

## Scope

The run covers repository hygiene, documentation consistency, architecture, content, claims, market data, security headers, TypeScript, lint, unit/component tests, production build, static SEO, performance, responsive behavior and browser accessibility.

## Verified identity

<!-- build-identity:start -->
- **Status date**: 2026-08-30
- **Base commit**: `678eac7`
- **Repository state**: precision-audit remediation with enforced CSP and application rate guard
- **Environment**: Windows, Node 22.23.1, npm 10.9.8, Chromium desktop/mobile
- **Products**: 50 source, 50 published, 0 drafts
- **Official content records**: 137
- **Claims**: 286 total, 0 approved, 286 pending, 0 rejected
<!-- build-identity:end -->

## Automated checks

| Command | Current result | Evidence |
|---|---|---|
| `npm ci` | PASS | Clean reinstall: 287 packages, 0 vulnerabilities |
| `npm run toolchain:validate` | PASS | Supported Node/npm and dependency placement |
| `npm run repository:validate` | PASS | Current source paths, documentation links and repository hygiene |
| `npm run architecture:validate` | PASS | 17-line composition root and 17 lazy page modules |
| `npm run typography:validate` | PASS | 14 px minimum and verified contrast pairs |
| `npm run market:validate` | PASS | Two Moldova phones; foreign certificates hidden |
| `npm run content:validate` | PASS | 50 records; all 50 published records complete |
| `npm run claims:validate` | PASS | 286 structurally valid pending records |
| `npm run security:validate` | PASS | Production-enforced CSP, required headers and minimal external origins |
| `npm run typecheck` | PASS | TypeScript project references |
| `npm run lint` | PASS | ESLint with zero warnings |
| `npm run test` | PASS | 21 files, 145 tests |
| `npm run build` | PASS | 187 prerendered routes and 185 canonical sitemap URLs; 50 Product JSON-LD records |
| `npm run security:runtime` | PASS | 5 rendered routes, enforced CSP, 0 violations |
| `npm run performance:runtime` | PASS | Home, contact and catalogue within runtime budget |
| `npm run test:e2e` | PASS | 123 passed, 17 skipped across desktop/mobile, including 320–1920 px reflow, offline submission and two-tab selection synchronization |
| `npm run release:check` | EXPECTED BLOCKED | 8 open P0/P1 blockers |

## Current known issues

The authoritative list lives in `docs/release-status.json` and [the release status](RELEASE_STATUS.md). The disposition of the 2026-08-30 precision audit is recorded in [the remediation report](AUDIT_PRECISION_REMEDIATION.md). No technical cleanup closes a blocker without its acceptance evidence.

## Not verified

- Production deployment, origin, headers and WAF behavior
- Live Telegram form on the production domain
- GitHub branch ruleset enforcement
- Google Rich Results and URL inspection on public URLs
- Moldova legal approvals, media rights and Romanian content

## Release relation

Technical PASS means the tested worktree builds and satisfies its automated contracts. It does not mean the site is legally, operationally or commercially approved for production.
