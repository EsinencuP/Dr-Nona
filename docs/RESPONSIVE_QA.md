# How is responsive behavior verified?

Responsive QA combines geometry assertions, accessibility checks and seven committed catalogue baselines. Historical manual screenshot packages are not part of the repository.

Last verified: 2026-07-31 against `tests/e2e/responsive-matrix.spec.ts` and Playwright configuration.

## Viewport matrix

| Profile | Width |
|---|---:|
| Small mobile | 320 px |
| Mobile | 375 px |
| Large mobile | 430 px |
| Tablet portrait | 768 px |
| Tablet landscape | 1024 px |
| Desktop | 1440 px |
| Wide desktop | 1920 px |
| Mobile landscape | Scenario-specific |

The Playwright projects start at 1440 × 900 and 390 × 844. The responsive test changes viewport inside each project to cover the full matrix.

## Required surfaces

- Header, navigation and mobile menu
- Home hero, Halo section and product promotion
- Catalogue introduction, filters, product grid and empty state
- Product title, media, selection action and accordion
- Selection handoff and contact form
- Company, formula, editorial and dynamic official pages
- Footer, 404 and malformed-request recovery

## Assertions

Each matrix pass checks:

- No document-level horizontal scroll
- No clipped text or overlapping actions
- Visible touch targets and focus indicators
- Product media remains inside its stage
- Important text stays at least 14 px
- Priority actions survive a 200% zoom equivalent
- WCAG text spacing does not hide interactive content

## Visual baselines

The seven PNG files under `tests/e2e/responsive-matrix.spec.ts-snapshots/` are executable catalogue baselines. Update them only after an approved visible change and review every binary diff.

Failure screenshots, traces, videos and reports are local or CI artifacts. Do not commit them.

## Motion and input

Verify keyboard-only navigation, hover-capable pointers, touch input and `prefers-reduced-motion`. Reduced motion must preserve state changes and content access while disabling nonessential movement.

Run `npm run test:e2e` after any layout, typography, navigation or interactive-state change.
