# Local Skill Capability Map

## Audit snapshot

- Scanned roots: global Codex skills, agent skills, bundled plugins, curated
  remote plugin cache, and primary runtime cache.
- Skill files scanned: 226.
- Unique skill names: 221.
- Method: recursive `SKILL.md` discovery including hidden and ignored paths,
  then keyword classification across frontmatter and instructions.

Run `scripts/scan_local_skills.py` to refresh this snapshot when installations
change.

## Selected complementary skills

| Capability | Preferred skill | Boundary |
|---|---|---|
| Product image generation/editing | system `imagegen` | Built-in first; obey its CLI/model/transparency confirmation rules. |
| Ecommerce identity/slot planning | `ecommerce-image-workflow` | Use its fidelity and review pattern; its dispatcher contract applies only when actually running that workflow. |
| Background removal and alpha normalization | `prepare-catalog-product-images` | Complete and review preprocessing before creative generation. |
| Public website intake | `collect-public-product-images` | Public assets only; no access-control bypass. |
| Reference semantics | `reference-design-contract` | Extract keep/change/do-not-copy qualities. |
| Explicit visual brief | `design-brief` | Use only when visual dimensions are materially ambiguous. |
| Art direction | `creative-director` | Freeze one coherent direction and anti-pattern list. |
| Prompt refinement | system `imagegen`; `enhance-prompt` if callable | Do not treat a catalogue-only entry as runtime success. |
| Optional Google generator | `imagen` | Catalogue entry here; require the full upstream runtime before use. |
| Optional visual analysis | `fal-vision` | Catalogue entry here; require callable OCR/segmentation runtime. |
| Optional enhancement | `image-enhancer` | Catalogue entry here; no hallucinated label detail or silent upscale. |
| Current OpenAI implementation facts | `openai-docs` | Use official current docs before changing API/model/pricing assumptions. |
| Current Gemini implementation facts | Official Google Gemini API and `google-genai` docs | Verify model IDs, SDK behavior, quotas, pricing, and free-tier eligibility from primary Google sources. |
| Review-gallery UX | `product-design:audit` | Audit gallery UX only, not product-pixel fidelity. |

## Categories discovered

The scan classified skills across image generation, image editing, reference
analysis, product design, visual design, prompt engineering, ecommerce,
computer vision, QA, Python, and OpenAI API. The selected set above is the
smallest combination that covers the pipeline without copying or conflating
other skills.
