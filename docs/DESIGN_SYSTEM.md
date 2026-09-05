# How should the Dr. Nona interface look and behave?

The visual system combines a light mineral palette, editorial typography and catalogue density. It must feel premium and trustworthy without sacrificing information per viewport.

Last verified: 2026-09-05 against the tokens and component styles in `src/styles/`. This document is the only canonical design specification. Implementation evidence and tradeoffs are recorded in [Visual system refinement](VISUAL_SYSTEM_REFINEMENT_2026-09-05.md).

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
- **Body**: 16 px with a shared 1.65 line height; thematic reading layouts may use more leading
- **Display hierarchy**: `--type-display` 44–72 px, `--type-title` 36–60 px, `--type-section` 30–48 px; balanced wrapping
- **Product titles**: `--type-card-title` 22–24 px, 1.25 leading, natural height and pretty wrapping; no fixed-height title clipping
- **Weights**: Cormorant 600 for hierarchy; Manrope 400 for body and 600–750 for controls and labels
- **Measure**: `--measure-copy: 64ch` for PDP description and information paragraphs, constrained by their columns

Use serif type for display hierarchy and sans serif type for reading, labels and controls. Do not force headings into two lines when one readable line fits. Letter spacing never compensates for an unreadable font size.

Keep the existing six self-hosted WOFF2 subsets. Browser font inspection confirmed custom-font rendering for Cyrillic and Romanian comma-below characters in the diagnostic specimen. This verifies glyph coverage, not native-language editorial approval. Small status messages use Manrope; Cormorant is inappropriate for dense instructions and service labels.

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

### Semantic roles

| Role | Token | Value / brand alias |
|---|---|---|
| Page | `--bg` | `--paper` |
| Tonal grouping | `--surface` | `--mist` |
| Image stage / input / necessary panel | `--surface-raised` | `--white` |
| Main / supporting copy | `--text-primary` / `--text-secondary` | `--ink` / `--muted` |
| Decorative separator | `--border` | `--line` |
| Control boundary | `--border-strong` | `#738e96` |
| Primary action / hover | `--action` / `--action-hover` | `--sea-800` / `#063f49` |
| Action label | `--action-text` | `--white` |
| Focus | `--focus` | `--focus-inner` |
| Readable gold accent | `--premium-accent` | `--gold-800` |
| Success / background | `--success` / `--success-surface` | `#345e49` / `#e5efe8` |
| Error / background | `--error` / `--error-surface` | `#8f2f2f` / `#fff2ef` |

Do not use the pale decorative border as the only input boundary. The stronger border meets 3:1 against the supported light control surfaces. Status text and icons remain present alongside color. Keep botanical color rare; it is not a primary action color.

### Spacing and depth

Shared spacing steps are 4, 8, 12, 16, 24, 32 and 48 px. Component-owned layouts can retain explicit values when required by their composition. Preserve existing container and breakpoint ownership.

Product and editorial captions sit directly on the page; the image retains its bounded stage. PDP information uses top rules and readable paragraphs. Use tonal grouping for forms and filters. Do not add a floating white rectangle around every group.

`--shadow-soft` is `0 6px 18px rgba(20,38,45,.06)` and supports the overlapping home principles rail. `--shadow-raised` is `0 16px 40px rgba(20,38,45,.16)` for the toast overlay. Ordinary catalogue, article, About and PDP panels have no elevation shadow. Existing mineral/science illustration rings are decorative composition, not a general card treatment.

## Components and states

Cards, inputs and panels use the shared 12, 20, 32 and 48 px radius scale. The named `--radius-pill` token is reserved for capsule-shaped buttons, chips, segmented controls and the skip link; it is not a general-purpose card or panel radius. Primary actions use sea blue; saved state uses a filled control with explicit `aria-pressed` state. Hover, focus, active, disabled, submitting, success and failure states must remain distinguishable without color alone.

Product save controls stay at the bottom action area above product media stacking. Images must never cover an action. Forms retain entered values after validation, network or provider failure.

Selected-product rows show the complete product name with natural height: Cormorant 600, fluid 22–32 px / 1.25, measure up to 44ch. Do not clamp identities in this review list. Align media, text and removal controls at the top; keep 100 px mobile media, 160 px desktop media and 44 px removal targets. Mobile row gaps use 8 px to preserve text space. SKU is quiet tabular metadata, not a chip. Removal has 140 ms feedback and no press displacement under reduced motion.

Use the bookmark icon for product saving, consistent with the header selection entry. Keep the explicit saved label and `aria-pressed` state. Each catalogue row derives its height from its own contents: align actions within that row, never equalize all catalogue rows. In a single-column layout each card has natural height. Some space under shorter text within a multi-column row remains necessary for that row's aligned actions.

Above 1180 px, populated selection uses a bounded list beside a 320–380 px consultation handoff, with a 32 px gap. The handoff begins at the list's top, so it does not require scrolling through every selected item. At 1180 px and below, it follows the list in document order. Empty selection is unchanged.

The contact application panel has one reading column, capped at 1040 px and centered. A compact intro precedes the full-width scenario selector and form. Paired fields remain two columns where space permits; mobile fields and scenario choices stack. Do not recreate a full-height introductory sidebar beside the form.

On mobile, category chips use two columns with whole-word labels. Contact scenario choices use three full-width rows, so all modes receive equal emphasis and long RU/RO labels remain readable. The mobile navigation panel is opaque mineral white; background page text must not show through it. CRM remains available as a quiet utility link.

Empty states use a bookmark, a clear recovery action and separators instead of a dashed placeholder box. The 404 uses restrained readable gold and a normal title hierarchy. The loading indicator remains a small functional progress ring with localized text.

### Product detail composition

The first useful viewport follows one direct reading path: product media, category context, product name, editorial description, source-backed composition or usage highlights, then the selection action. Product name and description carry the strongest hierarchy. Category and SKU remain available as compact service metadata and must never visually compete with the description.

On desktop, media and decision content share a balanced two-column grid aligned at the top. The information section below exposes the product overview, composition and usage without requiring accordion interaction; unavailable or non-applicable fields are omitted instead of replaced with generic filler. On mobile, the media becomes square, the action fills the available width and every information card stays in the document flow. Do not add prices, ratings, urgency, purchase controls or commerce language.

## Product imagery

Use only owner-approved product media. One `image` field supplies catalogue cards, selection, home merchandising, related products, SEO and product detail; there is no separate premium/detail image. All 50 published products have distinct matched assets and no product uses the neutral placeholder. `catalogScale` may adjust compact presentation without changing the source asset.

Do not retain raw exports, duplicate aliases or unused variants in `public/`. Never use another product as a fallback for a missing match.

## Responsive rules

The supported minimum width is 320 px. Layout changes occur at 1180, 960 and 640 px, with contact-specific adaptation at 980 px. Verify 320, 375, 430, 768, 1024, 1440, 1920 and 2048 px plus mobile landscape. Also verify 720 CSS px at real 200% browser zoom from a 1440 px viewport.

Mobile layouts may reduce secondary copy and collapse controls, but they must preserve the page CTA, product identity, selection action and error recovery. No document-level horizontal scrolling is allowed.

At 640 px and below, the hero principles rail shows one complete card per snap point and a localized continuation hint. Product or explanatory text must not be used as a clipped preview of the next item.

## Accessibility

- Preserve semantic landmarks, skip link and keyboard order
- Keep controls at least 44 px high where practical
- Use a 3 px visible focus outline with offset
- Meet WCAG AA text contrast for current token pairs
- Support 200% zoom and user text spacing without clipping
- Connect accordions, status regions and form errors through ARIA relationships
- Hide decorative separators and imagery from assistive output

## Motion

Motion explains state or hierarchy. Use CSS; no animation dependency or route transition is required for this foundation.

| Category | Timing | Treatment |
|---|---|---|
| Navigation underline, buttons, locale switch, save and chips | `--motion-micro: 140ms` | Color, border, underline; restrained press feedback |
| Card / image hover | `--motion-standard: 220ms` | Border response; editorial images may gently scale; catalogue packshots keep their optical scale |
| Content reveal | `--motion-reveal: 420ms` | Opacity and 10 px vertical movement, stagger capped at 100 ms; total at most 520 ms |
| Mobile menu | 220 ms | Opacity and 6 px enter/exit movement on an opaque surface |
| Filter disclosure | 140 / 220 ms | Opacity / transform; geometry changes immediately |

Do not animate layout properties for disclosure polish. Spatial hover effects run only on hover-capable fine pointers. The only repeating animation is the functional 700 ms loading ring while content loads.

`prefers-reduced-motion: reduce` removes reveal/transition delays, makes reveal content immediately visible and suppresses hover/press displacement. State changes remain visible through color, borders and labels. The loading ring becomes static while its text remains available. Avoid autoplay loops, scroll hijacking, expensive blur fields and animation that delays access to content.

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
