# Home about section and diagram

Owner request: make “About us” a prominent standalone section with a large centered heading and a unified description, and add one or two useful interactive modules to the existing Halo diagram.

The about section now spans the page on a white background with distinct section boundaries and generous vertical spacing. Its original authorized introduction and mission are presented together as one paragraph with consistent typography below the centered heading. Both locales retain their existing wording. No eyebrow labels were reintroduced.

The diagram retains its rings, central Halo mark, original three controls and selected-detail panel. Added localized vitamins and amino-acids controls. Their descriptions refer explicitly to individual Dr. Nona product formulas rather than asserting that these ingredients occur in every product or in the core Halo formula. Vitamins are illustrated by Goldseen and Okseen; amino acids by Phase 9. No therapeutic, patent, exclusivity, antioxidant or cell-effect claims were added.

Sources checked on 2026-10-15: the manufacturer's [current supplements catalogue](https://drnona.com/en/product-category/supplements/) lists vitamins for Goldseen/Okseen and amino acids, vitamins and minerals for Phase 9. The existing published ingredient records also support these neutral composition facts. The [Halo overview](https://en.drnona.com/?page_id=20934) was reviewed for context; its health/effect assertions were not copied. Source URLs remain internal documentation only.

Layout ownership: `HomePage.tsx`, `home.css`, and the existing mobile overrides in `responsive.css`. Five controls surround the diagram on larger screens and wrap below it on mobile. The detail panel follows the orbit in normal layout so longer descriptions cannot collide with the controls. Only local React selection state changes; no persistence, API, CRM, assortment or release-status changes.

Graph query/affected scope: the catalogue's `HomePage` node and app route callers; relevant checks are the home-hierarchy, visual-foundation, accessibility and responsive-matrix browser suites. Production release remains subject to the existing blockers.

Validation: repository hygiene (Node 22.23.1), architecture, TypeScript, ESLint, 212 unit tests and the complete build passed. Browser coverage totals 45 distinct passing cases: 26 home/visual checks (22 passed initially; the four five-control interaction cases passed again after tightening button widths at 961–1180 px), 17 responsive/visual contracts and two home accessibility audits. All five controls were exercised in RU/RO at 320, 390, 768, 1024, 1440 and 1920 px; the about section was checked for centered heading, uniform single-paragraph copy, size and overflow at four widths. Romanian desktop/mobile screenshots were inspected. The canonical merged graph was refreshed successfully; its existing extraction-schema warnings remain. The local Romanian home page returned HTTP 200.
