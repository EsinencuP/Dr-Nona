# Homepage hero banner

The owner supplied `3964bc86-1a0d-487f-889c-963148aa9508.png` and explicitly requested its use in the homepage hero. An unchanged copy is stored at `public/brand/hero/dr-nona-dead-sea.png` (1672 × 941). Existing catalogue and product-detail assets are unaffected.

The six existing `halo-complex-desktop.*` and `halo-complex-mobile.*` delivery files now derive from that supplied image. Desktop files retain the original resolution; mobile files are resized proportionally to 1000 × 563. AVIF, WebP and JPEG are available through the existing CSS image-set and responsive preloads. No image content was redrawn, recolored or composited. Asset preparation used sharp-cli without adding a project dependency: resize widths 1672/1000, AVIF quality 60, WebP quality 82 and JPEG quality 84.

The original two-column desktop layout and stacked mobile layout remain. Both use right-center background positioning to preserve the product group when the image fills a narrower frame. The accessible image description now describes the Dr. Nona products by the Dead Sea in RU/RO. Hero marketing copy and claim approval status are unchanged.

Graph query and affected scope: `HomePage`, app route callers, `home.css`, `responsive.css` and the existing hero preload contract. This is a static asset/UI change with no persistence, API or CRM changes. Relevant browser coverage is the homepage hierarchy and product-hero composition suites.

Validation: repository hygiene under Node 22.23.1, architecture, TypeScript, lint, 212 unit tests and the complete production build passed. Six targeted browser tests passed across desktop/mobile projects, including RU/RO hero layout checks at nine viewport sizes. Additional direct browser checks confirmed image decoding, responsive asset selection and absence of horizontal overflow in both locales at 320, 390, 768, 1024, 1440 and 1920 px. Desktop/mobile screenshots were visually reviewed. AVIF transfer files are 149411 B for desktop and 74481 B for mobile; the source PNG is not requested by the hero. Production release status remains blocked by the existing external decisions.
