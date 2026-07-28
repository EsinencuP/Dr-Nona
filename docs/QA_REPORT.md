# Dr. Nona Moldova — Frontend QA Report

Date: 2026-07-26  
Status: PASS for local frontend prototype

## 2026-07-27 QA package follow-up

- Applied all QA-001 through QA-014 items from `DR_NONA_QA_PACKAGE.zip`.
- Rebuilt the hero and product-detail compositions from the approved visual
  references.
- Added dedicated generated Dead Sea backgrounds while preserving the official
  product PNGs.
- Rechecked eight priority routes at desktop and mobile widths with no
  document-level horizontal overflow or clipped headings.
- Completed normalized side-by-side design comparisons.
- Detailed implementation evidence:
  `docs/qa-package/2026-07-27/IMPLEMENTATION_REPORT.md`.
- Final Product Design QA: `design-qa.md` — passed.

## Automated gates

- TypeScript project build: PASS.
- Vite production build: PASS.
- npm production dependency audit: 0 vulnerabilities.
- Output split into application, React, icons, catalog data and official
  content chunks.
- Official catalog dataset: 55 products.
- Official public content dataset: 137 records.

## Browser gates

Validated in the Codex in-app browser and local Chrome at
`http://127.0.0.1:4173`.

- Desktop viewport: 1440×900.
- Mobile viewport: 390×844.
- Main page: PASS.
- Mobile navigation open/close: PASS.
- Catalog route and deep-link load: PASS.
- Mobile filters disclosure: PASS.
- Product search `Lord`: PASS, 2 matching products.
- Search state URL `/products?q=Lord`: PASS.
- Selection add and persistence: PASS.
- Product detail route: PASS.
- Lord route and product page full body/header theme: PASS.
- Contact form structure and local no-transport submit state: PASS.
- Certificate country selector and 28 Russian records: PASS.
- History route and 10 rendered timeline chapters: PASS.
- Horizontal overflow: none at tested viewports.
- Typography collision sweep: 18 priority routes checked at 1440×900 and
  390×844; no final heading/text overflow or sibling-text intersections.
- Long official product names, the Lord hero and the mobile `About`
  constellation received focused follow-up checks.
- The supplied Dr. Nona logo renders in the header and footer at desktop and
  mobile sizes, including the dark Lord theme; favicon and Apple Touch Icon
  assets return HTTP 200.
- Browser page errors: none.
- Representative route matrix: 22/22 routes rendered without the 404 state.
- Post-hardening regression: 16 known routes rendered, plus one intentional
  missing-route 404.
- Product media delivery: 55/55 local PNG responses returned HTTP 200 and
  non-empty payloads.
- Product media refresh: all 55 files in `public/products` and `dist/products`
  exactly match the replacement 1600×1600 transparent PNG set from
  `docs/drnona_products_catalog/png`.

## Accessibility and interaction checks

- Skip link and semantic `main`, navigation, headings: present.
- Keyboard focus uses visible outline.
- Main controls use minimum 44 px target.
- Mobile RU/RO controls are available in the menu and measure 44×44 px.
- Active/pressed/expanded states are exposed.
- Product selection change is announced through `aria-live`.
- Reduced motion mode disables reveal and timeline animation.
- Reduced-motion computed verification: opacity `1`, no transform,
  `stroke-dashoffset: 0`, effective duration `0.01 ms`.
- UI motion is limited primarily to opacity/transform and short state
  transitions; the approved history timeline uses an SVG stroke exception.
- Hover movement is restricted to fine pointers.
- Spot-checked text/background contrast ratios range from 4.71:1 to 14.99:1.

## Known production dependencies

- Romanian official copy has not been invented; it needs approved translation.
- Moldova-specific phone, email and Telegram destination still need owner data.
  The prototype uses the current official corporate phone and
  `shopinfo@drnona.com`, and marks Telegram as pending.
- Contact transport, consent, spam protection and data-retention rules are not
  connected before the Moldova recipient is approved.
- Russia certificate parity is present; Israel and Ukraine still need approved
  data or an explicit source-link-only decision.
- The current official FAQ contains unrelated template content and needs an
  editorial decision before migration.
- Medical, therapeutic and anti-aging copy requires legal review.
- Official popularity semantics are unavailable; current popularity order
  follows official catalog order.
- Media usage rights need business confirmation before public deployment.
