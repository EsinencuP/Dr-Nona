# Design QA — Dr. Nona QA package

Date: 2026-07-27

## Comparison target

- Hero source visual truth:
  `docs/qa-package/2026-07-27/PROJECT_REFERENCES/APPROVED/hero_reference.png`
- Hero implementation:
  `docs/qa-package/2026-07-27/after-home-1717x916-final.png`
- Hero combined evidence:
  `docs/qa-package/2026-07-27/comparison-hero-final.jpg`
- Product source visual truth:
  `docs/qa-package/2026-07-27/PROJECT_REFERENCES/APPROVED/product_page_reference.png`
- Product implementation:
  `docs/qa-package/2026-07-27/after-product-1448x1086-final.png`
- Product combined evidence:
  `docs/qa-package/2026-07-27/comparison-product-final.jpg`

## Normalization

- Hero source and implementation: 1717×916 pixels, CSS viewport normalized to the same visible browser content area, density 1.
- Product source and implementation: 1448×1086 pixels, CSS viewport normalized to the same visible browser content area, density 1.
- States: Russian locale, desktop header visible, selection count zero, homepage at the top, product route `beauty-mask-for-face` at the top.

## Full-view comparison

The final hero preserves the approved two-part hierarchy: editorial copy on the
left, Dead Sea landscape and official product on the right, followed by a
four-benefit strip. The implementation intentionally keeps the existing Moldova
navigation and official site copy instead of reproducing the reference
navigation verbatim.

The final product view preserves the approved dominant product stage, compact
product information column, smaller heading, metadata and primary selection
action. The reference's fictional review cards and gallery thumbnails were not
implemented because the project content contract permits official source
content only.

## Focused-region comparison

- Product stage: generated environment and transparent official packshot were
  checked separately for centering, containment, edge masking and scale.
- Hero title and action row: checked for wrapping, hierarchy and overlap at
  desktop and 390×844.
- Product card stages and titles: checked for consistent image containment and
  controlled title rhythm.
- Halo diagram: all three selectable states were exercised; `aria-pressed` and
  the explanatory panel changed correctly.
- Lord banner: both product assets remain inside the dark collection frame and
  do not collide with the heading or CTA.

## Required fidelity surfaces

- Fonts and typography: display serif and calm sans-serif hierarchy are
  preserved. Product H1 scales were reduced after the first pass. Long official
  titles wrap without clipping at 390 px.
- Spacing and layout rhythm: hero, product-detail stage, section padding and
  Lord banner were tightened. Eight desktop and eight mobile priority routes
  have no document-level horizontal overflow.
- Colors and tokens: white/aqua remain dominant; teal carries actions and
  scientific emphasis; gold is limited to the logo, product packaging and Lord
  accents; Lord retains a distinct dark-navy state.
- Image quality and asset fidelity: official transparent product PNGs remain
  unchanged. Two generated backgrounds are isolated under
  `public/generated/qa-2026-07-27/` with PNG masters and optimized JPEG runtime
  copies. No visible product image was recreated with CSS or SVG.
- Copy and content: official product copy is retained. No invented testimonials,
  ratings or medical claims were added.
- Icons and controls: the existing icon family is retained, tap targets remain
  usable, and the formula controls expose selected state.
- Responsiveness and accessibility: tested at 1440×900 and 390×844; no clipped
  headings, product-stage overflow or document overflow. Reduced-motion support
  remains in the existing system.

## Findings

No actionable P0, P1 or P2 findings remain.

Residual P3 difference: the approved product reference contains multiple gallery
thumbnails and a review area. These are intentionally omitted until official
media and review data exist.

## Comparison history

1. Initial package review found an excessively tall hero, escaping decoration,
   inconsistent product scaling, sparse Halo content, an overlapping Lord
   composition, excessive product-page whitespace and oversized headings.
2. First implementation pass rebuilt the hero, product stage, cards, Halo
   diagram and Lord banner. Evidence:
   `after-home-1716-v1.jpg`, `after-product-1716-v1.jpg`,
   `after-cards-1716-v2.jpg`, `after-science-1716-v1.jpg`,
   `after-lord-banner-1716-v1.jpg`.
3. The first product comparison still showed an oversized H1. The product
   heading scale and stage height were reduced. Post-fix evidence:
   `after-product-1716-v2.jpg`.
4. The first mobile hero still exceeded the intended density. The title,
   actions and product stage were tightened. Post-fix evidence:
   `after-home-390-v2.jpg`.
5. Final normalized side-by-side comparisons:
   `comparison-hero-final.jpg` and `comparison-product-final.jpg`.
6. Follow-up on 2026-07-28: the separate homepage product layer looked
   visually suspended at responsive crops. It was replaced with dedicated
   unified desktop and mobile hero rasters containing the jar, stone contact,
   contact shadow and reflected light in one image. Post-fix evidence:
   `docs/qa-package/2026-07-27/hero-integrated-desktop-v3.png` and
   `docs/qa-package/2026-07-27/hero-integrated-mobile-final.png`. The live
   `.hero-visual` spacer contains no product-image child.
7. Desktop scale follow-up: the first integrated version made the jar too
   dominant. The final desktop asset reduces it to roughly one-fifth of the
   source-image width, matching the approved hero reference while preserving
   physical contact with the limestone shelf. Side-by-side evidence:
   `docs/qa-package/2026-07-27/comparison-hero-integrated-v3.jpg`.
8. Background-fit follow-up: desktop rendering changed from `cover` to a
   right-aligned, height-contained image (`auto 100%`). The complete raster now
   fits vertically without quality-reducing enlargement or top/bottom crop.
   Evidence:
   `docs/qa-package/2026-07-27/hero-background-contained-desktop.png`.

## Functional and browser checks

- Priority routes: `/`, `/products`, `/product/beauty-mask-for-face`,
  `/product/salts-rosemary`, `/lord`, `/ourformula`, `/about`, `/editorial`.
- Primary interactions: hero CTAs present, product selection action present,
  all three Halo diagram controls update the live panel.
- Browser console: no warnings or errors; only Vite connection/debug messages
  and the React development-tools information message.
- Production build: passed.
- Production dependency audit: zero vulnerabilities.

## Implementation checklist

- [x] Apply the approved hero composition.
- [x] Apply the approved product-page hierarchy.
- [x] Normalize product imagery and card title rhythm.
- [x] Make the Halo diagram interactive.
- [x] Repair the Lord banner composition.
- [x] Verify desktop and mobile overflow.
- [x] Preserve official copy and product PNGs.
- [x] Keep generated imagery replaceable in a dedicated folder.

final result: passed
