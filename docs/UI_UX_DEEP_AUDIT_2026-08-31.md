# UI/UX deep audit — 2026-08-31

## Scope and evidence

- Source specification: `tests/e2e/ui-ux-deep-audit.spec.ts`
- Design authority: `docs/DESIGN_SYSTEM.md`
- Responsive authority: `docs/RESPONSIVE_QA.md`
- Route authority: `docs/PAGE_INVENTORY.md`
- Primary run: `npx playwright test tests/e2e/ui-ux-deep-audit.spec.ts --reporter=html`
- Focused rerun: `npx playwright test tests/e2e/ui-ux-deep-audit.spec.ts --last-failed --workers=1 --reporter=line`
- Independent responsive check: `npx playwright test tests/e2e/responsive-matrix.spec.ts --workers=1 --reporter=line`

The supplied test was copied from the audit package, then corrected where its assertions raced lazy routes or treated intentionally hidden controls as visible UI. The baseline run executed 128 checks: 110 passed, 2 skipped and 16 failed. After the P1 fixes it reached 126 passes and 2 P2 failures. After the P2 fixes and two added acceptance checks, the final run produced 130 passes out of 130. The HTML report is stored locally at `playwright-report/index.html`.

## Release assessment

**Current audited UI/UX status: P0, P1 and P2 resolved.** Broader non-UI release blockers continue to be governed by the repository release-status documents.

## Confirmed P0 defects

None confirmed.

## Resolved P1 defects

| # | Resolution | Verification |
|---|---|---|
| P1-01 | Selection metadata and SKU text raised to the documented `0.875rem` minimum. | `npm run typography:validate` passes; 320–1920 responsive matrix and 200% zoom contract pass. |
| P1-02 | Promo and Lord campaign cards use content-driven height in the 961–1180 px range, so their CTAs remain inside the clipped article. | Tablet 1024 contract passes; full responsive matrix passes 17 applicable checks with 17 expected project skips. |
| P1-03 | Audit readiness now waits for the loader to disappear and a visible route H1. Mobile-menu, hidden-control, form-label and text-spacing assertions follow actual accessibility semantics. | The P1 milestone reached 126/128; after the P2 corrections the final audit passes 130/130. |
| P1-04 | Catalog product titles now use H2 under the page H1, and product-purpose line-height is at least 1.4. | Heading hierarchy and body line-height checks pass in both Playwright projects. |

## Resolved P2 design-system and polish findings

| # | Resolution | Verification |
|---|---|---|
| P2-01 | Added the documented `--radius-pill` exception for capsule-shaped controls and replaced raw `999px` component declarations with the named token. Mobile `--radius-lg` now remains on the approved scale. | Radius-token contract passes in desktop and mobile projects. |
| P2-02 | At ≤640 px the hero principles rail presents one complete card per snap point, hides the scrollbar, contains overscroll and shows a localized RU/RO horizontal-continuation hint. | Geometry test confirms full-width cards, no text clipping, horizontal overflow and snap behavior; RU and RO hints pass. |

## Invalid or inconclusive failures in the supplied test

### Lazy-route race — corrected test defect

The following assertions queried the DOM while the loading fallback was still present:

- product image overflow;
- H1 existence and display font;
- catalogue container width;
- catalogue column count;
- product image natural dimensions;
- product eyebrow order.

Failure screenshots either showed the loading screen or the expected H1/product content after the failed assertion. The helper now waits for route readiness before collecting evidence.

### Mobile menu close assertion — corrected test defect

The menu remains mounted by design for predictable focus management. The corrected assertion verifies `aria-expanded="false"`, `aria-hidden="true"` and Playwright hidden state instead of requiring DOM removal.

### WCAG text-spacing and radius checks

The text-spacing check excludes `aria-hidden` honeypot controls and passes in both projects. The radius check now validates the shared scale together with the explicitly documented `--radius-pill` exception and passes in both projects.

## Passed coverage from the supplied suite

All 130 checks pass in the final run, covering horizontal overflow, typography, heading hierarchy, tokens, the mobile hero rail, colors, focus states, touch targets, images, form behavior, keyboard interactions, reduced motion, hero sizing, footer structure, 404 behavior, contrast and labels.

## Supporting verification

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test -- --run` | PASS — 148/148 |
| `npm run typography:validate` | PASS — minimum 14 px |
| `npm run build` | PASS — 307 prerendered routes and all repository gates |
| Focused P1 deep-audit checks | PASS — 12/12 across desktop and mobile projects |
| Final deep audit | PASS — 130/130 |
| Responsive matrix | PASS — 17 applicable checks, 17 expected project skips |

## Recommended order of work

1. Continue with the repository release blockers tracked outside this UI/UX audit.
2. Re-run this suite after future changes to shared tokens, the homepage hero or mobile responsive behavior.
