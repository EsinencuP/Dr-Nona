# Which QA result is current?

This report indexes the current automated evidence only. It does not preserve historical screenshots or cumulative implementation logs.

Last verified: 2026-08-28 against base commit `46810af5850b11446018dde6c5ee4c9cc71e5196` and the current catalogue-media worktree.

## Scope

The run covers repository hygiene, documentation consistency, architecture, content, claims, market data, security headers, TypeScript, lint, unit/component tests, production build, static SEO, performance, responsive behavior and browser accessibility.

## Verified identity

<!-- build-identity:start -->
- **Status date**: 2026-08-28
- **Base commit**: `46810af5850b11446018dde6c5ee4c9cc71e5196`
- **Repository state**: catalogue rewrite with shared product-media import
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
| `npm run security:validate` | PASS | Required headers and minimal CSP origins |
| `npm run typecheck` | PASS | TypeScript project references |
| `npm run lint` | PASS | ESLint with zero warnings |
| `npm run test` | PASS | 20 files, 113 tests |
| `npm run build` | PASS | 187 prerendered routes and 185 canonical sitemap URLs; 50 Product JSON-LD records |
| `npm run security:runtime` | PASS | 5 rendered routes, enforced CSP, 0 violations |
| `npm run performance:runtime` | PASS | Home, contact and catalogue within runtime budget |
| `npm run test:e2e` | PASS | 116 passed, 16 skipped across desktop/mobile, including 320–1920 px reflow, selection, aligned card actions and deterministic shared-image visual baselines |
| `npm run release:check` | EXPECTED BLOCKED | 8 open P0/P1 blockers |

## Current known issues

The authoritative list lives in `docs/release-status.json` and [the release status](RELEASE_STATUS.md). No technical cleanup closes a blocker without its acceptance evidence.

## Not verified

- Production deployment, origin, headers and WAF behavior
- Live Telegram form on the production domain
- GitHub branch ruleset enforcement
- Google Rich Results and URL inspection on public URLs
- Moldova legal approvals, media rights and Romanian content

## Release relation

Technical PASS means the tested worktree builds and satisfies its automated contracts. It does not mean the site is legally, operationally or commercially approved for production.
