# How should the Dr. Nona interface look and behave?

The visual system combines a light mineral palette, editorial typography and catalogue density. It must feel premium and trustworthy without sacrificing information per viewport.

Last verified: 2026-07-31 against the tokens and component styles in `src/styles/`. This document is the only canonical design specification.

## Visual goals

- Communicate Halo Complex™ science before product promotion
- Connect the brand to the Dead Sea, minerals and nature
- Support mature and older readers with legible, predictable UI
- Keep catalogue and product tasks dense enough to reduce scrolling
- Use distinctive editorial composition without template-like AI styling

## Layout and density

The desktop container is `min(1392px, calc(100vw - 64px))`. The default section padding is `clamp(34px, 3.8vw, 52px)`. Pages may use asymmetry, but the primary heading, explanation and action must share a clear reading path.

Avoid empty full-screen sections, isolated headings and decorative diagrams without an interaction or information role. Catalogue controls and the first product row should enter the first useful viewport where the device height permits.

## Typography

- **Display**: Cormorant Garamond, Georgia fallback
- **UI and body**: Manrope, system fallback
- **Minimum informative text**: 14 px
- **Body**: 16 px with approximately 1.72 line height
- **Display hierarchy**: responsive `clamp()` sizes with balanced wrapping

Use serif type for display hierarchy and sans serif type for reading, labels and controls. Do not force headings into two lines when one readable line fits. Letter spacing never compensates for an unreadable font size.

## Color tokens

| Role | Token | Value |
|---|---|---|
| Page background | `--paper` | `#f7fbfc` |
| Surface | `--white` | `#ffffff` |
| Secondary surface | `--mist` | `#edf6f7` |
| Border | `--line` | `#c8dde1` |
| Main text | `--ink` | `#14262d` |
| Secondary text | `--muted` | `#536a73` |
| Light sea | `--sea-050` | `#e1f1f4` |
| Sea support | `--sea-100` | `#c9e5ea` |
| Focus sea | `--sea-400` | `#4e99a7` |
| Interactive sea | `--sea-700` | `#0b6676` |
| Primary action | `--sea-800` | `#084e5c` |
| Brand gold | `--gold-500` | `#b99a5a` |
| Botanical green | `--green-500` | `#6f927d` |

White and sea colors dominate. Gold marks small brand details. Green provides rare botanical context and should not become a catalogue action color.

Dark navy and gold tokens may support the footer or a bounded Lord collection banner. They do not switch catalogue or product pages into a separate Lord theme.

## Components and states

Buttons, cards, inputs and panels use the shared 12, 20, 32 and 48 px radius scale. Primary actions use sea blue; saved state uses a filled control with explicit `aria-pressed` state. Hover, focus, active, disabled, submitting, success and failure states must remain distinguishable without color alone.

Product save controls stay at the bottom action area above product media stacking. Images must never cover an action. Forms retain entered values after validation, network or provider failure.

## Product imagery

Use only owner-approved product media. The current 50-product catalogue deliberately uses the same neutral local placeholder in catalogue, selection, home merchandising and product detail. `image`, `cardImage` and `catalogScale` remain in the model so approved product photography can be introduced later without changing route or card contracts.

Do not retain raw exports, duplicate aliases or unused variants in `public/`. Do not reconstruct official packaging with generative AI.

## Responsive rules

The supported minimum width is 320 px. Layout changes occur at 1180, 960 and 640 px, with contact-specific adaptation at 980 px. Verify 320, 375, 430, 768, 1024, 1440 and 1920 px plus mobile landscape.

Mobile layouts may reduce secondary copy and collapse controls, but they must preserve the page CTA, product identity, selection action and error recovery. No document-level horizontal scrolling is allowed.

## Accessibility

- Preserve semantic landmarks, skip link and keyboard order
- Keep controls at least 44 px high where practical
- Use a 3 px visible focus outline with offset
- Meet WCAG AA text contrast for current token pairs
- Support 200% zoom and user text spacing without clipping
- Connect accordions, status regions and form errors through ARIA relationships
- Hide decorative separators and imagery from assistive output

## Motion

Motion explains state or hierarchy. Default UI transitions use about 180 ms and transform, opacity, background, border or shadow changes. Hover effects run only on hover-capable pointers.

`prefers-reduced-motion: reduce` disables nonessential movement. Avoid autoplay loops, scroll hijacking, expensive blur fields and animation that delays access to content.

## Allowed decisions

- Controlled editorial asymmetry
- Rounded image masks and mineral-inspired surfaces
- Compact science diagrams with readable supporting text
- One bounded dark collection banner inside the shared site identity
- Responsive copy reduction when the full information remains accessible elsewhere on the page

## Prohibited decisions

- Generic gradient-card dashboards or template hero layouts
- Excessive whitespace presented as premium design
- Tiny uppercase text as the only information carrier
- Independent visual themes for individual product lines
- Decorative motion without state or narrative purpose
- AI-generated product packaging, medical imagery or people
- Commerce language, prices, discount badges or fake urgency

## Design change criteria

A design change is acceptable only when it preserves the product brief, current tokens, catalogue/product image roles, accessibility checks and responsive matrix. Run `npm run typography:validate`, `npm run test:e2e` and visual regression checks for any visible change.
