# Catalogue card volumes

Historical scope: the initial request below covered only millilitres. The owner's subsequent decision requires package sizes on all 50 cards, including dry products. The current implementation and checks are described in [PRODUCT_PACKAGE_SIZES_2026-10-15.md](PRODUCT_PACKAGE_SIZES_2026-10-15.md); null/omitted non-ml values described below are superseded.

Owner request: copy the numeric millilitre volumes from the current Moldova catalogue, matched by product name, and display them opposite the category on each card. Shared cards apply the same layout to recommendations. RU uses «мл» and RO uses «ml».

Checked on 2026-10-15 against the live [catalogue](https://www.drnona.md/catalog) and its [creams](https://www.drnona.md/creams), [hygiene](https://www.drnona.md/hygiene), [perfumes](https://www.drnona.md/parfumes), [supplements](https://www.drnona.md/supplements) and [drinks](https://www.drnona.md/drinks) categories.

`src/data/product-volumes.json` stores exact source labels and names, matched detail URLs, category source URLs and the check date. The importer checks the English product name and detail link within the same source row before accepting a nearby ml label. Run `node scripts/import-product-volumes.mjs` only when a fresh volume import is intended; it fetches public source cards and does not change assortment or descriptions.

There are 28 confirmed ml values. The remaining 22 products have no ml label on their current source cards (they use other package measures or no measure). Their `volumeMl` is null. No gram, capsule, sachet or pack quantity is converted into millilitres. Unknown values are omitted from the visible card.

Examples: Solaris Body Lotion 250 ml, Hand and Nail Cream 50 ml, Dynamic Cream 50 ml, Shea Body Butter 200 ml, IMUNSEEN 125 ml. These are copied source values, not rounded estimates.

Owning component: `src/components/ui.tsx` (`ProductCard`); style: `src/styles/components.css`. Runtime generation projects only the numeric `volumeMl` into the existing RU/RO catalogue and bounded product-detail datasets; source/provenance fields stay in the internal snapshot. No browser persistence, API, CRM, product claims, source links in the interface or pricing behavior changes.

Verification covers source-name freshness at generation, all 50 card slots, presence of 28 numeric volumes, absence for non-ml products, and category/volume separation at 320, 390, 768 and 1440 px in RU/RO. Production release remains blocked by the existing release status.

Validation on 2026-10-15: repository hygiene (Node 22.23.1), architecture, TypeScript, ESLint, 212 unit tests and the complete build passed. All four RU/RO desktop/mobile volume tests passed. The seven Windows catalogue screenshots were refreshed for the added labels. Desktop and mobile Romanian renders were also inspected directly. The merged catalogue/CRM graph was rebuilt with the explicit sibling CRM root; its existing 180 extraction-schema warnings remain.
