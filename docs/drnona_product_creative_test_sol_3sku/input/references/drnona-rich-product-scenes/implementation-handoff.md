# Implementation handoff

Read `DESIGN.md`, `design-contract.md`, catalog metadata, and the matching
reference before generation. Generate one empty 2048x2048 plate per SKU with
built-in `imagegen`; no product, package, logo, label, text, hands, or people.
Save as `input/backgrounds/<product-slug>-hero.png`.

Run `python -m src.cli --pilot --provider folder --max-products 3`. Accept only
the transparent 1600x1600 clean cutout and 2048x2048 hero. Product fidelity,
scene detail, cross-product similarity, manifest, gallery, and ZIP must pass.
The first artifact proves success only if the three hero compositions are
visibly different while all original package pixels remain unchanged.
