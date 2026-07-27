# Dr. Nona Moldova - Color System

Version: 0.3  
Status: Approved working baseline, subject to visual calibration  
Last updated: 2026-07-26

## 1. Design read

Reading this as a redesign-overhaul of a premium wellness catalog for Moldova,
with a calm mineral and editorial language. The system preserves the real
Dr. Nona brand cues but does not preserve the visual debt or commerce patterns
of the current international website.

Design dials:

- `DESIGN_VARIANCE: 7` - controlled asymmetry and editorial composition;
- `MOTION_INTENSITY: 5` - noticeable but restrained motion;
- `VISUAL_DENSITY: 6` - functional density with page-specific breathing room.

## 2. Core concept

The palette is called **Mineral Light**.

It comes from four real brand and product signals:

1. Dead Sea water and mineral light;
2. white Dr. Nona packaging;
3. gold brand marks and packaging details;
4. green botanical ingredients.

This is deliberately not the generic premium-wellness formula of warm beige,
brass and espresso. The base is cool and mineral. Gold is a signature material,
not a brown page background. Green is botanical evidence, not a competing CTA.

## 3. Color hierarchy

Each page has one interactive accent.

- Main system interactive accent: `Sea 700`.
- Lord system interactive accent: `Lord Gold 300`.
- Gold in the main system is used as a brand signature and fine detail.
- Botanical green is used rarely: mainly for ingredient/nature contexts and
  selected header/footer details. It is nearly absent from catalog chrome.
- Semantic success, warning and error colors are not allowed to replace the
  primary action color.

This prevents the interface from becoming a multi-accent AI palette.

## 4. Main theme: Mineral Light

### Foundation

| Token | Hex | Role |
|---|---:|---|
| `mineral-canvas` | `#F7FBFC` | Default page background |
| `mineral-surface` | `#FFFFFF` | Cards, sheets, modal surfaces |
| `mineral-surface-soft` | `#EDF6F7` | Quiet section grouping |
| `mineral-border` | `#C8DDE1` | Borders and separators |
| `mineral-ink` | `#14262D` | Primary text |
| `mineral-ink-muted` | `#5F747C` | Secondary text |

### Sea family

| Token | Hex | Role |
|---|---:|---|
| `sea-100` | `#E1F1F4` | Large pale fields |
| `sea-200` | `#C9E5EA` | Selected surface and soft illustration |
| `sea-500` | `#4E99A7` | Non-text diagrams and quiet data |
| `sea-700` | `#0B6676` | Primary action and active state |
| `sea-800` | `#084E5C` | Hover and pressed state |

### Brand gold family

| Token | Hex | Role |
|---|---:|---|
| `gold-100` | `#F3ECDD` | Quiet brand-tinted surface |
| `gold-400` | `#B99A5A` | Logo detail, rules, icons, large decorative text |
| `gold-700` | `#7A5A21` | Accessible gold text and solid control when required |

`gold-400` is not used for small text on white. Use `gold-700` when gold must
carry readable information.

### Botanical family

| Token | Hex | Role |
|---|---:|---|
| `botanical-100` | `#E5EFE8` | Ingredient and nature surface |
| `botanical-500` | `#6F927D` | Illustration and non-critical graphic detail |
| `botanical-700` | `#466B58` | Accessible botanical text and icon |

Botanical green does not become a second primary button color.

## 5. Main theme semantic mapping

| Semantic role | Token |
|---|---|
| Page background | `mineral-canvas` |
| Elevated surface | `mineral-surface` |
| Quiet grouped surface | `mineral-surface-soft` |
| Primary text | `mineral-ink` |
| Secondary text | `mineral-ink-muted` |
| Border | `mineral-border` |
| Primary action | `sea-700` |
| Primary action hover | `sea-800` |
| Focus ring | `sea-700` with visible outer offset |
| Selected surface | `sea-100` |
| Brand signature | `gold-400` |
| Accessible gold text | `gold-700` |
| Botanical content outside catalog chrome | `botanical-700` |

## 6. Lord theme

The Lord theme is based on the official Eau De Parfum Lord and Lord Halo
Deodorant packaging. Both use cold near-black navy with gold or bronze detail.

Lord is a page-level collection context, not a random dark section inside a
light page. The entire page theme changes when the user enters Lord.

### Foundation

| Token | Hex | Role |
|---|---:|---|
| `lord-canvas` | `#071827` | Default Lord background |
| `lord-surface` | `#0D2334` | Cards and grouped content |
| `lord-surface-raised` | `#143047` | Hover, modal and selected surface |
| `lord-border` | `#294255` | Borders and dividers |
| `lord-ink` | `#EFF4F5` | Primary text |
| `lord-ink-muted` | `#A8B7C0` | Secondary text |

### Accent

| Token | Hex | Role |
|---|---:|---|
| `lord-gold-100` | `#F2E8D2` | Pale detail on light product zones |
| `lord-gold-300` | `#D0B274` | Primary Lord action and focus |
| `lord-gold-400` | `#C29B58` | Packaging-aligned decorative detail |
| `lord-on-gold` | `#10202A` | Text and icon on gold action |

### Lord semantic mapping

| Semantic role | Token |
|---|---|
| Page background | `lord-canvas` |
| Surface | `lord-surface` |
| Raised surface | `lord-surface-raised` |
| Primary text | `lord-ink` |
| Secondary text | `lord-ink-muted` |
| Border | `lord-border` |
| Primary action | `lord-gold-300` |
| Primary action text | `lord-on-gold` |
| Focus ring | `lord-gold-300` |
| Decorative metallic detail | `lord-gold-400` |

Green is absent from the Lord UI chrome. It may appear naturally inside
official photography or ingredient content.

## 7. Theme transition rule

The default site remains Mineral Light.

Lord activates only for:

- a Lord collection context opened from the future banner-card/collection-card;
- a Lord product detail page;
- an editorial feature specifically about Lord.

The theme changes at the page root. It does not alternate section by section.
In the common catalog, Lord products remain inside the Mineral Light system and
are identified by their real dark packaging, not by dark card backgrounds.

The exact navigation model is still open: the Lord context may use a dedicated
collection route or another approved collection surface. This uncertainty does
not change the full-theme rule after entry.

## 8. Color proportion

Recommended visual distribution for Mineral Light:

- 76-84% mineral whites and quiet surfaces;
- 10-16% pale sea fields;
- 4-7% deep sea interaction color;
- up to 1% botanical green outside photography, primarily header/footer;
- up to 1% gold outside the logo and product packaging.

Recommended visual distribution for Lord:

- 65-75% near-black navy;
- 15-25% layered navy surfaces;
- 5-8% off-white text and product zones;
- 2-4% gold detail and interaction.

These values are composition guards, not analytics targets.

## 9. Verified contrast pairs

| Pair | Contrast | Result |
|---|---:|---|
| `#14262D` on `#F7FBFC` | `14.99:1` | AAA |
| `#5F747C` on `#F7FBFC` | `4.71:1` | AA body |
| `#FFFFFF` on `#0B6676` | `6.61:1` | AA body |
| `#FFFFFF` on `#084E5C` | `9.31:1` | AAA |
| `#7A5A21` on `#F7FBFC` | `6.09:1` | AA body |
| `#466B58` on `#F7FBFC` | `5.75:1` | AA body |
| `#EFF4F5` on `#071827` | `16.19:1` | AAA |
| `#A8B7C0` on `#071827` | `8.73:1` | AAA |
| `#10202A` on `#D0B274` | `8.16:1` | AAA |
| `#D0B274` on `#071827` | `8.81:1` | AAA |

Contrast must be rechecked for every actual component state, especially text
over photography, disabled controls and translucent overlays.

## 10. States

### Main primary action

- default: `sea-700`;
- hover: `sea-800`;
- active: `sea-800` plus tactile movement;
- focus: visible `sea-700` ring with offset;
- disabled: neutral surface and readable muted text, not reduced opacity alone.

### Lord primary action

- default: `lord-gold-300`;
- hover: `lord-gold-100`;
- active: `lord-gold-400`;
- text: always `lord-on-gold`;
- focus: visible `lord-gold-300` ring with light/dark separation.

### Selection

Saved state uses color plus icon and text. A sea or gold tint alone is not
sufficient.

## 11. Photography interaction

- UI colors do not tint official product photography.
- White packaging must remain visible against `mineral-canvas`, using separation
  through composition, a quiet border or controlled tonal surface.
- Gold packaging details must not be recolored to match UI tokens.
- Green comes primarily from real ingredients and plants, not decorative blobs.
- Dead Sea landscapes and mineral textures may carry natural blue-grey and
  earth tones without expanding the UI accent palette.
- Lord packaging gets a neutral or dark navy context without artificial glow.

## 12. Forbidden color behavior

- no purple-blue AI glow;
- no neon cyan;
- no multi-color CTA system;
- no warm beige page foundation;
- no gold body text using an inaccessible light metallic tone;
- no green CTA competing with sea blue;
- no random dark sections in Mineral Light pages;
- no full-page gradients;
- no blue-to-purple gradients;
- no glass cards used only to look futuristic;
- no pure black;
- no color-only meaning.

## 13. Approval status

Approved by user as the current working baseline:

- light overall style;
- visual dominance of white and blue;
- blue association with the Dead Sea;
- gold as a very small detail color;
- green as a rare supporting color, almost absent from catalog chrome;
- dark navy and gold distinction for Lord;
- full page-level theme change inside the Lord context;
- unique Moldova-focused redesign;
- avoidance of AI-generated visual tropes.

Subject to future visual calibration:

- exact hex values may be adjusted after real page mockups;
- precise proportions are composition guards rather than immutable quotas;
- whether Lord uses a dedicated collection route or another collection surface;
- final metallic gold reproduction after official brand assets are received.
