# Design QA — Dr. Nona QA package

Report updated: 2026-07-30  
Base commit: `e762ef3b5098c05c8c7ca4286d538a4fd1aa76eb`  
Repository state: dirty working tree with uncommitted QA changes  
Environment: local Vite preview at `http://127.0.0.1:4173`  
Release authority: `docs/RELEASE_STATUS.md`

This cumulative visual log is supporting evidence. It does not grant production release approval.

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
  `docs/qa-package/2026-07-27/source-masters/` for source variants and
  `public/brand/hero/` for optimized JPEG runtime
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

## Catalog refresh — 2026-07-28

- Runtime catalog reduced to the 10 updated products supplied in
  `docs/drnona_products_catalog/new/`.
- Every product uses a paired image contract:
  `_1` / `*-catalog.png` for the white catalog grid and
  `_2` / `*-card.png` for the individual product page.
- Wide desktop catalog: 4 compact cards per row. Intermediate desktop/tablet:
  3 then 2 columns. Mobile: 1 readable column.
- Catalog cards share one light sea-and-white visual system. No product receives
  a separate dark theme, special card chrome or collection badge.
- The former `/lord` landing route and its theme are removed; the URL resolves
  to the standard 404 page.
- Browser QA: 10/10 catalog images loaded, no horizontal overflow, minimum
  title-to-description gap 11 px, minimum description-to-link gap 18 px.
- Individual product QA confirmed `*-card.png` is used and no theme class is
  applied.
- Production build: passed.

final catalog result: passed

## Density and Halo Complex follow-up — 2026-07-28

- Rebuilt the homepage science block from the supplied visual reference:
  deep marine gradient, editorial copy column, large orbital diagram, three
  interactive formula controls and a horizontal active-detail panel.
- Reduced general section padding, section-heading gaps, catalog intro spacing
  and catalog bottom padding so more real content enters each viewport.
- Kept minimum control heights and readable body sizing for the older primary
  audience.
- Desktop science section now fits within one 900 px viewport.
- Mobile science copy is intentionally shortened to a seven-line preview; full
  information remains available through the formula page.
- Browser QA: no horizontal overflow and no overlap between diagram controls
  and the active-detail panel at 1440 px or 390 px.

final density result: passed

## Homepage catalog cards follow-up — 2026-07-28

- Expanded the homepage selection from 6 to 8 updated products.
- Wide desktop homepage: 4 compact cards per row instead of 3.
- Homepage cards now explicitly use only `*-catalog.png` assets on a white
  catalog stage; lifestyle `*-card.png` assets remain exclusive to individual
  product pages.
- Browser QA at 1440 px and 390 px: 8/8 images loaded, correct catalog assets,
  no horizontal overflow, 4 desktop columns and 1 mobile column.
- Production build: passed.

final homepage cards result: passed

## Site-wide density and heading system — 2026-07-28

- Removed forced desktop line breaks from the catalog, About and Halo Complex
  page titles.
- Reworked internal page intros as compact editorial bands: single-line desktop
  title, adjacent supporting copy and a quiet vertical divider.
- Reduced the global display scale and tightened section, hero, article,
  product-detail, timeline, formula-story and footer-adjacent page spacing.
- Preserved intentional space where it carries real information: the integrated
  homepage product scene, Halo orbital diagram and product photography.
- Desktop measurements at 1440 px:
  - catalog intro: 329 px → 178 px;
  - About hero: 600 px → 390 px;
  - standard About/editorial/selection intros: 235–249 px → 170–174 px;
  - contact/certificate headers: 343 px → 222 px;
  - article header: 447 px → 325 px;
  - formula hero: 720 px → 560 px.
- Browser QA covered 13 representative routes at 1440 px and 10 template routes
  at 390 px. No horizontal overflow, heading overflow or text collisions were
  detected.
- Desktop page titles are one line on every checked route. Mobile headings wrap
  only when the available width requires it.
- Production build: passed.

final density-system result: passed

## Halo Complex product-image correction — 2026-07-28

- Formula-page product cards now use the same `*-catalog.png` white-background
  assets as the main catalog and homepage catalog section.
- Lifestyle `*-card.png` images remain exclusive to individual product pages.
- Desktop and mobile browser QA: 2/2 catalog images loaded, correct source
  suffixes and no horizontal overflow.
- Production build: passed.

final formula-product-images result: passed

## Product-card selection control — 2026-07-28

- Moved the selection control from the image stage into a dedicated bottom
  action row beside the product-details link.
- Reworked the former icon-only control as a compact labelled pill:
  `В подборку` / `Добавлено`.
- The card body and action row now establish their own foreground layers;
  product imagery remains clipped inside the separate stage and cannot cover
  the selection control.
- Desktop QA covered the catalog, homepage and Halo Complex product section.
  All 20 rendered controls were below their image stages and inside their
  action rows.
- Mobile QA confirmed a 40 px minimum control height, no horizontal overflow
  and no overlap with product imagery.
- Selection interaction was verified in both directions:
  `false → true → false`.
- Production build: passed.

final selection-control result: passed

## Object-aware catalog image scale — 2026-07-29

- Analysed the foreground bounds inside all 10 white-background catalog PNGs
  instead of treating each 1254 × 1254 canvas as an equally sized product.
- Source object occupancy before normalization ranged from:
  - 24% to 90% of canvas width;
  - 50% to 86% of canvas height.
- Added an individual `catalogScale` value to every product. Values range from
  `0.82` for the widest tea box to `0.96` for products with generous source
  margins.
- Normalized the visible foreground maximum to approximately 74% of the card.
  The smallest measured final object-to-card edge margin is 9.9%.
- Catalog images now use `object-fit: contain` in every ProductCard context.
  The complete source canvas remains visible even when a compact card stage is
  not square.
- Hover enlargement is capped at an additional `0.015`, so the final image
  scale never reaches or exceeds 1.
- Desktop QA: 10 catalog cards, 8 homepage cards and 2 Halo Complex cards all
  loaded with the expected individual scale and `contain` fit.
- Mobile QA: all 10 catalog objects retained their individual scale, with no
  horizontal overflow or clipping.
- Original PNG files were preserved unchanged.
- Production build: passed.

final object-aware-image-scale result: passed

## Halo Complex compact informative hero — 2026-07-29

- Replaced the oversized decorative orbit hero with a compact informational
  band that immediately explains the three foundations of Halo Complex:
  `Архебактерия`, `Мёртвое море` and `Новое поколение`.
- The detailed story below now follows the same three-part structure, without
  an accidental fourth chapter or duplicated decorative content.
- Desktop QA at 1440 × 900:
  - hero height: 349 px;
  - detailed content begins at 431 px;
  - all three information rows fit inside the hero;
  - no text collisions or horizontal overflow.
- Mobile QA at 390 × 844:
  - all three information rows remain inside the hero;
  - no text collisions, horizontal overflow or console warnings.
- Production build: passed.

final compact-formula-hero result: passed

## About page integrated editorial journey — 2026-07-29

- Removed the 520 px decorative constellation diagram and the separated
  corner-to-corner hero composition.
- Rebuilt the `/about` landing page as a compact information-first overview:
  official vision copy, three factual company indicators and no empty
  full-screen presentation area.
- Replaced the detached subsection list with four asymmetrical, fully clickable
  editorial chapters:
  `Компания`, `История`, `Основатели`, `Наука и технология`.
- Each chapter uses its official Dr. Nona image and source excerpt. Cloudinary
  delivery was corrected from broken 300 px transforms to working 900 × 900
  responsive assets.
- Internal subsection navigation now uses a connected editorial rail with a
  clear active state, directional feedback and keyboard-visible focus instead
  of detached pill controls.
- Motion is limited to short reveal, image-scale and directional hover
  feedback; `prefers-reduced-motion` continues to disable transitions.
- Desktop QA at 1440 × 900:
  - compact overview height: 377 px;
  - four chapters and four images loaded;
  - no text collisions or horizontal overflow.
- Mobile QA at 390 × 844:
  - compact overview height: 361 px;
  - all facts and chapter content fit without clipping;
  - no text collisions, horizontal overflow or console warnings.
- All four subsection routes expose the correct active navigation state.
- Production build: passed.

final about-editorial-journey result: passed

## Homepage editorial product showcase — 2026-07-29

- Removed the eight-card homepage catalog grid. The full catalog remains
  available through its dedicated route and homepage links.
- Added one large editorial product spotlight using `Halo Dynamic Cream` as the
  current editorial selection, with a direct product link and selection control.
- Added two compact supporting products with white-background catalog assets:
  `Halo Solaris Facial Cream` and `Halo Gonseen VitaliTea`.
- Added two distinct campaign formats:
  - a visual promo banner for `Halo Solaris Body Lotion`;
  - a dark editorial banner for the two-product `Lord` collection.
- Lifestyle images are used only in editorial spotlight and campaign contexts;
  compact product entries continue to use catalog images.
- Motion is limited to short image-scale and card-elevation feedback, with the
  existing reduced-motion fallback.
- Desktop QA at 1440 × 1000:
  - zero standard catalog cards in the homepage showcase;
  - one spotlight, two supporting products and two campaign banners;
  - all six images loaded;
  - no text collisions or horizontal overflow.
- Mobile QA at 390 × 844:
  - every unit stacks to the full content width;
  - the promo image is offset behind a dedicated dark reading zone so its
    product label does not compete with interface copy;
  - all six images load after lazy content enters the viewport;
  - no horizontal overflow or console warnings.
- Production build: passed.

final homepage-editorial-products result: passed

## Information-density and first-viewport pass — 2026-07-29

- Reduced global section spacing, header height, heading gaps and repeated card
  padding while retaining readable line height and 40–46 px primary controls.
- Rebalanced the catalogue for information density:
  - five product cards per row at 1440 px;
  - compact single-column cards at 390 px;
  - all ten catalogue products remain available;
  - catalogue images use `object-fit: contain`;
  - selection controls sit below the product media and never overlap it.
- Moved the product-detail selection CTA directly after the product purpose so
  it appears in the initial mobile viewport before long copy and facts.
- Reduced the mobile home hero media height and moved the editorial product
  heading into the initial viewport. The first screen now contains the main
  proposition, both hero actions, product visual, benefits and the beginning
  of the next commercial section.
- Converted non-featured mobile editorial cards to compact horizontal entries
  and clamped long article summaries in page headers.
- Increased certificate density to five columns on desktop and two on mobile.
- Representative template QA at 1440 × 900 and 390 × 844:
  - one visible `h1` on every tested page;
  - zero text collisions;
  - zero horizontal overflow;
  - zero broken visible images;
  - zero unnamed primary controls;
  - zero undersized primary controls.
- Full route sweep:
  - 151 routes checked at 1440 × 900;
  - 151 routes checked at 390 × 844;
  - the lazy catalogue route was rechecked after module load and passed;
  - below-the-fold lazy images were excluded from false-positive failures.
- Russian document-language and interface-copy alignment check passed.
- Production build: passed.

final information-density result: passed

## Release-language cleanup — 2026-07-29

- Removed presentation-only numbering from:
  - homepage section labels;
  - mobile navigation;
  - catalogue and related-product cards;
  - company navigation and chapter cards;
  - Halo Complex pillars and story chapters;
  - saved-product rows.
- Replaced the catalogue's “updated catalogue” wording with direct customer
  copy describing the product range.
- Preserved meaningful data such as founding years, product totals, history
  milestones and the user's saved-product count.
- Updated the project status to a completed frontend implementation with a
  verified production build.
- Visual QA covered the homepage, catalogue, Halo Complex, company page,
  mobile navigation and a populated saved-products state.
- Automated release sweep:
  - 151 public routes checked;
  - zero presentation labels or section-number markers;
  - zero horizontal overflow;
  - zero broken loaded images;
  - one `h1` per route after the lazy catalogue module completed loading.
- Mobile regression audit covered 12 representative templates with zero text
  collisions, unnamed controls or undersized primary controls.

final release-language-cleanup result: passed

## QA-001 contact submission integrity — 2026-07-29

- Confirmed that no approved API route, serverless function, email provider,
  CRM webhook or Moldova recipient exists in the project configuration.
- Removed the active contact form and its local fake-success handler.
- Replaced it with explicit direct actions to the current official corporate
  email and telephone number.
- Added visible disclosure that the website does not collect or simulate
  sending personal data.
- Full server-side submission remains intentionally unavailable until the
  Moldova recipient, consent copy, retention policy, validation contract, spam
  protection and transport credentials are approved.

QA-001 false-submission risk: resolved
QA-001 server-transport acceptance: pending approved external configuration

## QA-002 locale integrity — 2026-07-29

- Removed the incomplete Romanian dictionary and both desktop/mobile language
  controls.
- Removed LocaleContext state and Romanian date-format branches.
- The site now sets and retains `html[lang="ru"]`, matching its visible copy,
  navigation labels, accessibility labels and live regions.
- Stale `drnona-locale` browser data is removed on application startup so an
  earlier RO selection cannot restore mixed-language output.
- Browser QA confirmed desktop and mobile navigation contain no locale switch,
  `html[lang]` and `data-ui-locale` remain `ru`, and product-selection
  accessibility announcements are Russian.
- All 151 public routes were checked for language state and switch remnants;
  the lazy catalogue route passed after its module completed loading.
- Full Romanian support remains a separate content and architecture task:
  centralized UI resources, localized product/content data, metadata,
  alt-texts and an approved localized route strategy are required before the
  switch can return.

QA-002 mixed-language mode: resolved
QA-002 full Romanian release: pending approved translations and locale model

## QA-003 selection consultation handoff — 2026-07-29

- Implemented one canonical consultation payload containing each selected
  product's official name, SKU and absolute public product URL.
- `/selection` passes only compact product slugs to `/contactus`; the contact
  page resolves and displays every position before the user opens an email.
- The same resolved payload powers the visible preview, email subject/body and
  the independent “Скопировать список” fallback.
- Browser acceptance checks:
  - maximum local selection: 10 visible rows, 10 SKU and 10 URLs;
  - route navigation: 10/10 positions received;
  - refresh on the populated contact URL: 10/10 positions retained;
  - deletion: 10 → 9 rows, and the deleted name disappeared from both route
    and email payload;
  - refresh on `/selection`: the remaining 9 positions persisted;
  - empty selection: zero handoff blocks and zero selection email links;
  - mobile 390 × 844: zero horizontal overflow and all three handoff controls
    are 50 px high.
- The 10-item `mailto` measures about 2962 characters, so copying the complete
  plain-text payload is exposed as a first-class fallback for mail clients with
  URL-length limits.
- The contact screen states that the site does not store or simulate personal
  data submission; email transfer occurs only after confirmation in the user's
  mail application and links to the privacy policy.
- The current target remains the verified corporate address
  `shopinfo@drnona.com`. A Moldova-specific recipient and server-confirmed
  delivery cannot be marked complete until those external details and the
  transport contract are approved.

QA-003 frontend context handoff: resolved
QA-003 Moldova recipient and confirmed transport: pending approved external configuration
