# Design contract

## Goal and target

Produce a three-SKU ecommerce test for Dr. Nona product cards: one transparent
catalog master and one rich environmental hero per SKU. Audience: visitors of
the Dr. Nona Moldova catalog.

## Evidence

| Evidence | Confidence | Use |
|---|---|---|
| Three user-provided product-scene references | provided | material richness, depth, lighting, product prominence |
| Dr. Nona `COLOR_SYSTEM.md` | observed | Mineral Light and Lord navy/gold palette |
| Product metadata in `products.json` | observed | category and verified ingredient context |
| Specific composition per SKU | inferred | prevent template repetition |

## Keep / Change / Do not copy

| Reference | Keep | Change | Do not copy |
|---|---|---|---|
| Cream collage | travertine, botanical/mineral detail, soft luxury light | single nocturnal hero for Night Cream | depicted jar, labels, exact collage |
| Chocoseen scene | cocoa ritual, tactile foreground, cup and linen | preserve Mineral Light connection | depicted package, exact prop positions |
| Lord collage | water, mineral architecture, precious accents | use dark Lord navy/gold page context | depicted bottle/box, exact collage |

## Final stance

One coherent Dr. Nona system with three deliberately different scenes. The AI
creates environment only; product pixels are locally composited unchanged.

## Risks and unknowns

- Exact campaign crop beyond square is not requested.
- Human approval remains required for art direction.
- Background plates may need one bounded regeneration if they contain text or
  fail the empty placement zone.

## Quality gate

- [x] Transparent clean masters are RGBA and uncropped.
- [x] Heroes are visually distinct and category-specific.
- [x] Product labels and geometry match source pixels.
- [x] No generated packaging or background text appears.
- [x] ZIP and review gallery validate.
