# Dr. Nona Moldova QA context

Last verified: 2026-09-01 against base commit `ada4aa0e9c5e` and the current cleanup and QA worktree.

## Read first

- Follow `AGENTS.md` and `docs/release-status.json`; a green build does not grant production approval.
- The application is an informational RU/RO catalogue, not an online store.
- Product names remain in English. Blog and News remain on original-language canonical routes.
- Pending or rejected claim fields must never enter browser-facing product datasets.

## Current facts

| Item | Current value |
|---|---:|
| Source products | 50 |
| Published products | 50 |
| Draft products | 0 |
| Matched product images | 50 |
| Official content records | 137 |
| Claims | 399 pending, 0 approved, 0 rejected |
| SEO routes | 315 total, 311 indexable |
| Unit/integration tests | 22 files, 165 tests |
| Browser suite | 277 passed, 17 intentionally skipped across 294 desktop/mobile scenarios |
| Open release blockers | 8 P0/P1 blockers |

## Generated files

`dist/`, `src/data/runtime-content.json`, `src/data/seo-manifest.json`, Playwright output and coverage are ignored artifacts. `npm run dev` regenerates runtime and SEO data; `npm run build` regenerates the full static output.

Use `clean-project.ps1` for a dry run and `clean-project.ps1 -Execute` only after reviewing its exact project-local targets.
