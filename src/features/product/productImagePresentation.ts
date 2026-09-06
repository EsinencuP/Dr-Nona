import type { CSSProperties } from "react";

// Optically reviewed against all 50 official silhouettes, 2026-09-06.
// Scale and vertical offset affect catalogue/related/PDP presentation only.
// Source assets, product identity and home campaign compositions stay independent.
export const productImagePresentation: Record<string, readonly [scale: number, offsetY: number]> = {
  "solaris-body-lotion": [1.05, -3],
  "hand-and-nail-treatment": [1.04, -3],
  "dynamic-hydrating-cream": [1.3, 0],
  "body-butter": [1.16, 0],
  "facial-solaris": [0.83, 0],
  "eye-contour-balm": [1.12, 3],
  "face-milk": [1.05, -3],
  "night-cream": [1.02, 0],
  "anti-aging-serum": [1.07, 0],
  "ard-complex": [1.22, 0],
  "shp-day-time-face-cream-lc": [0.96, 0],
  "samples-kit": [0.94, 0],
  "gonseen": [1.22, 0],
  "coffee-mix": [1, -2],
  "chocoseen": [0.9, 0],
  "soupseen": [0.86, 0],
  "okseen": [1.07, 0],
  "fase-9": [1.12, 0],
  "dnd-chewing-gum-tablets": [1.09, 0],
  "imunseen": [1.07, 0],
  "goldseen": [1.12, 0],
  "cleanseen": [1.04, 0],
  "ravseen": [1.05, 0],
  "pulmoseen": [1.04, 0],
  "reumoseen": [1.08, 1],
  "yamseen": [1.02, 0],
  "newseen": [1.05, 0],
  "femseen": [1.05, 0],
  "mouthwash": [1.05, 3],
  "dead-sea-water-compresses": [1, 0],
  "shower-gel-lord": [1.05, -3],
  "lady-deodorant": [1.12, 1],
  "kiwi-deodorant": [1.08, 0],
  "lord-deodorant": [1.05, 0],
  "face-soap": [1.08, 0],
  "halo-pure-unisex-deodorant-stick": [1.05, 0],
  "halo-shenseen-toothpaste": [1.03, -4],
  "halo-gel": [1.05, -3],
  "frequent-use-tonic-shampoo": [1.05, -3],
  "conditioner": [1.05, -3],
  "lipstick-new": [1.18, 0],
  "beauty-mask-for-face": [1.18, 0],
  "salts-camomile": [1.1, 2],
  "salts-ylangylang": [1.05, 2],
  "salts-rosemary": [1.05, 2],
  "salts-lavander": [1.05, 2],
  "after-shave-lord": [1.07, 1],
  "perfume-kiwi": [1.03, 1],
  "perfume-lady": [1.04, 1],
  "parfum-faya": [1.03, 1],
};

export function productImageStyle(slug: string): CSSProperties {
  const [scale, offsetY] = productImagePresentation[slug] ?? [1, 0];
  return {
    "--product-object-scale": scale,
    "--product-object-y": `${offsetY}%`,
  } as CSSProperties;
}
