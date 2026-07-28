# Skill Routing

## Precedence

1. Product fidelity and user instructions.
2. Security, budget, confirmation, and QA gates.
3. `prepare-catalog-product-images` for source normalization.
4. system `imagegen` for callable interactive generation/editing.
5. `ecommerce-image-workflow` for identity anchors, image roles, manifest, and
   review patterns.
6. `image-enhancer` for conservative clarity work.
7. `imagen` and catalogue `imagegen` only when their full upstream workflows
   are actually installed and callable.

## Conflict handling

`ecommerce-image-workflow` requires its media dispatcher for its own V1 run.
This skill borrows its product-fidelity and review methodology, but its bundled
application uses a separate provider abstraction. Do not claim the dispatcher
was used unless it actually was. The bundled application defaults to the
Google Gemini provider; OpenAI is an optional adapter.

Gemini uses the official `google-genai` SDK. A `GEMINI_API_KEY` proves
authentication only. It does not prove that the selected image model is on a
free tier, so keep the billable-use gate and verify current Google pricing
before generation.

System `imagegen` prefers the built-in tool and has separate CLI fallback rules.
Do not silently switch models or require an API key for built-in generation.

For complex transparent products, use the reviewed transparent master from
`prepare-catalog-product-images`; do not chroma-key glass or reflective
packaging merely because a generation skill supports chroma-key extraction.
