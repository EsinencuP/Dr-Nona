# How does continuous integration protect the repository?

The `quality-gates` workflow reproduces the supported toolchain, validates the repository, builds static output and runs browser checks before artifacts are retained for seven days.

Last verified: 2026-09-01 against `.github/workflows/ci.yml` and `package.json`.

## Supported runtime

- Node.js 22.23.1 from `.nvmrc`
- npm 10.9.8 from `packageManager`

The exact versions above make CI reproducible. `package.json` deliberately uses
the compatible deployment ranges `node: 22.x` and `npm: 10.x`, because managed
Vercel builders can run a different patch release within the same supported
major line.

`docs/release-status.json` records the verified base commit. Documentation
validation requires that base to be an ancestor of the build commit; requiring
equality would make a committed status file invalidate the commit that contains
it. GitHub Actions checks out the complete history so this relationship is
verified. A managed shallow deployment clone may defer ancestry validation when
the recorded commit object is not available locally.

CI generates the ignored runtime and SEO manifests immediately after
`npm ci`. Repository and documentation validation therefore run against the
same deterministic inputs as the production build, including on a fresh clone.

- Ubuntu GitHub runner
- Chromium installed by Playwright

Local and CI installation use `npm ci`.

## Required pipeline

The workflow runs:

1. Toolchain and repository validation
2. Architecture, typography, market, content, claims and security validation
3. TypeScript and ESLint
4. Vitest unit/component tests
5. Production build and prerender checks
6. Enforced Content Security Policy runtime check
7. Runtime performance measurement
8. Playwright desktop/mobile, keyboard and axe coverage
9. Final repository validation and clean-worktree assertion

`npm run ci` runs the same logical sequence locally.

## Generated artifacts

CI uploads `dist/` and `artifacts/reports/` as commit-scoped artifacts. Git ignores both paths. Failure-only Playwright reports stay in `playwright-report/` and `test-results/`, which are also ignored.

Generated evidence never becomes a documentation source of truth. `docs/QA_REPORT.md` records only commands that were actually run against its stated worktree.

## Release relation

CI success proves the technical gates. It does not approve claims, product assortment, translations, media rights, production contacts or deployment.

`P1-CI-PROTECTION` remains open until the GitHub `main` ruleset requires the `quality-gates` check and a failing run demonstrably blocks merge.

## Failure evidence

Use command output, Playwright trace/screenshots and commit-scoped reports to diagnose a failure. Do not commit generated output, disable a check or delete a failing test.
