# Implementation handoff

## Protected layer

Use the source RGBA product file without generative edits. Preserve product pixels,
geometry, label, logo, color, box/bottle relationship, and visible construction.

## Generation

Generate an empty 2048x2048 background plate per product. Include the exact product
slug in the prompt log and assign a unique composition fingerprint. Forbid products,
containers, packages, labels, text, people, and hands.

## Compositing

Place the original product locally with proportional scaling, safe padding, visual
centering, and a restrained contact shadow. Do not upscale the source. Export:

- `01-clean-cutout.png`: 1600x1600 RGBA, transparent, no artificial shadow.
- `02-hero.png`: 2048x2048 RGBA, generated environment plus protected product.

## QA

Check alpha, dimensions, crop, silhouette, pixel fidelity, background text, product
duplication, scene detail, and cross-product perceptual similarity. Mock-provider
creative assets must always be REVIEW and never publication-ready.
