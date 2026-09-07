# Prompt 3 — Responsive typography, text and image geometry

Date: 2026-09-07. Status: **PASS**. Scope: responsive geometry of the existing Mineral Light design. This is not a redesign, content approval or production release approval.

## Confirmed defects and corrections

| ID / severity | Surface and evidence before | Correction and evidence after | Ownership / regression coverage |
|---|---|---|---|
| P3-01 / P1 | About RU/RO mobile: the main statement was limited to five lines and the chapter introduction to three. At 375 px, RU text extended 238 px / 71.5 px beyond those boxes; RO extended 214 px / 22 px. These are reading paragraphs, without a disclosure to recover the missing text. | Removed both clamps. Full paragraphs participate in normal flow. The decorative DN circle aligns with the start of the statement. No copy was changed. | `src/styles/responsive.css`; About reading-text test in `tests/e2e/responsive-content-integrity.spec.ts`. |
| P3-02 / P2 | About mobile facts used three narrow columns. Long labels could run outside their cell, with page clipping concealing the problem from document-scroll assertions. The final tablet review also exposed inconsistent inline/wrapped label positions; merely allowing flex wrapping was insufficient. | At the existing mobile breakpoint, each fact uses a full row and a shared intrinsic number/label subgrid. On tablet/desktop, each metric uses a number above its label with content aligned to the start. Numbers remain unbroken on mobile; labels can wrap. Final RU/RO checks confirm aligned labels and complete bounds. | `src/styles/about.css`, `src/styles/responsive.css`; tests inspect each fact's text bounds and label alignment horizontally on mobile and vertically on tablet/desktop. |
| P3-03 / P2 | Home mini-product titles had a two-line clamp. Injected long RU/RO names and user text-spacing exposed concealed identity text (about 86 px excess in the 375 px stress sample). This is a resilience defect, not proof that the current short product names were truncated. | Removed the title clamp; kept the type size, added natural wrapping, and let the existing content/action flow grow. All twelve widths pass with long names and increased line/letter/word spacing. | `src/styles/home.css`; long-name/text-spacing test with title/action bounds. |
| P3-04 / P2 | Product-card `sizes` ignored optical packshot scale and some actual grid widths. Eighteen sampled catalogue states (nine per locale, at 844/960 px) selected a 480 px source despite a rendered square canvas up to 540.8 px at DPR 1. | `productCardImageSizes` describes the rendered image using the existing optical scale and grid columns/gaps. Fresh DPR 1/2 contexts: all 50 catalogue products at five widths, 500 states, zero undersized source selections. | `src/features/product/productImagePresentation.ts`, `src/components/ui.tsx`; dedicated 960 px DPR 1/2 browser regression. |

No new responsive breakpoint was introduced. Changes stay within existing thematic owners. Product optical profiles, original assets, text, claims, locale resources, font pair, palette, routes and API/CRM contracts are unchanged.

## Coverage and method

Required widths: **320, 375, 430, 768, 1024, 1440, 1920 px**, in RU and RO. Additional boundary probes: **641, 960, 961, 1180 px**. Landscape: **844 × 390 px**. The 768 px state uses a 1024 px height; 375 uses 812; remaining primary states use 900.

| Probe | Coverage | Result |
|---|---|---|
| Main geometry sweep | 50 products × 2 locales × 12 widths in PDP and catalogue, plus 264 route states: **2,664 states** | Zero document overflow, measured title/media/action overlaps, unloaded packshots or silhouette clipping after layout settles. Minimum measured silhouette margin: approximately 15.52 px. |
| Additional real routes | 13 routes × 2 locales × 12 widths: **312 states**, including final About fact geometry | Zero document overflow or measured heading/fact clipping. |
| Focused text sweep | **112 states**, including existing copy and injected long RU/RO strings/user text-spacing | Removed the confirmed reading-text and identity clamps. Visible serif glyph overhang is not classified as hidden content. |
| Delayed image load and caption stress | All 50 PDPs × RU/RO × 375/1440: **200 states** | Stage position/size delta after decode: **0 px**. Doubling the caption text does not change the image-stage geometry. |
| Actual responsive source selection | All 50 catalogue products × 375/844/960/961/1440 × DPR 1/2: **500 states** | Zero selected sources below the rendered pixel requirement. |
| Heading inventory | TypeScript AST: **51 H1/H2/H3 or shared SectionHeading call sites in 15 files** | Reviewed by pattern and exercised through route/type coverage below. |
| Final About alignment follow-up | RU/RO × 12 widths: **24 states**, after final tablet review | Zero overflow; label start spread within 1 px. Final targeted browser regression: **4 passed**, covering ten widths in both browser projects. |

The main non-product route sweep covers home, About, History, founders, science, Halo, editorial index, contact, selection and 404. The initial `/news/zoom` probe resolves to 404 and is **not** article evidence. The focused/additional sweep uses the real `/news/zoom-08-07-2026` article, plus `/about/company`, `/blog`, `/news`, `/certificates`, `/bad-request`, `/faq`, `/business`, `/warehouses`, `/accessibility-statement`, `/privacypolicy` and `/termsofuse`.

Automated measurements are supplemented with screenshot review: all 50 RU catalogue cards, all 50 RU PDP first viewports at 375 and 1440 px in contact sheets, larger representative RU/RO product views, and About/home/editorial tablet/mobile views. Contact sheets assess framing and overall geometry; they do not certify every small glyph. Existing E2E visual baselines and deep UI tests provide additional route/state coverage.

The first diagnostic measured immediately after viewport changes and reported 57 suspect rows. Rechecking with the viewport set before navigation and fonts/layout settled found **zero** corresponding document overflow or silhouette clipping. The diagnostic was corrected to await settling; production CSS was not altered to conceal those false positives. Likewise, serif glyph overhang with visible overflow was not treated as clipped content.

`after-all.json` predates the final source-selection correction and records 18 undersized source choices. That particular measurement is superseded by `source-choice.json` (500 final states, zero). Final About alignment evidence is in `about-final.json` and `after/extra-*-_about-*.png`, superseding the earlier focus/extra measurements for that block.

## Heading, text and media contracts

| Pattern / owner | Decision |
|---|---|
| Home display H1 and section headings (`HomePage.tsx`) | Retain existing fluid scale, intentional measures and hierarchy. Long mini-product H3 identity text now grows naturally. |
| Shared section headings and product-card H3 (`ui.tsx`) | Keep semantic levels and content/action zones; product titles remain complete. Secondary catalogue previews may stay limited because an explicit detail link opens full content. |
| PDP H1, information H2 and field H3 (`ProductPage.tsx`) | All 50 identities checked across the matrix, including long salt names. Preserve existing mobile order and separate stage/CTA zones; no universal font shrink or title clamp. |
| About H1, chapters and profile headings (`AboutPages.tsx`) | Introductory reading paragraphs remain complete. Chapter-card previews retain their bounded excerpt with a clear route to the full chapter. Facts use intrinsic shared columns on mobile. |
| Halo headings (`FormulaPage.tsx`) | Preserve Prompt 2 numbered reading chapters and responsive text hierarchy. |
| Editorial/card headings (`EditorialPages.tsx`, `ArticleCard.tsx`) | Preserve complete titles, original-language attributes and natural article-media ratios; previews remain distinguishable from reading content. |
| Catalogue, selection, contact/form, certificates, bad request, 404 and application-error headings | Retain current responsive styles and semantic hierarchy. Existing E2E covers form/error/loading recovery and user text-spacing; new geometry checks do not replace those tests. |

Packshots continue to use **contain** with the reviewed product-specific optical scale and offset. Broad jars, tall tubes and box/bottle sets should not be forced to equal physical height. The stage reserves geometry before loading; captions are separate. Editorial artwork/article media preserve the complete source frame; only previously reviewed decorative photography uses controlled cover/crop. No universal image style was added.

## Hydrogen source principle adapted to Vite

Inspected the actual [Hydrogen Image implementation](https://github.com/Shopify/hydrogen/blob/main/packages/hydrogen-react/src/Image.tsx), especially normalized dimensions/aspect ratio, fixed-width density sources and `FluidImage` forwarding `sizes` alongside generated `srcSet` and reserved geometry. The relevant principle is that source selection must describe the rendered image, while width/height or aspect ratio reserve its space.

Here the existing static AVIF/WebP 480/800/1200 variants and original fallback already provide the image pipeline. The correction supplies accurate slot sizes, including optical scaling, instead of adding a Shopify dependency or a duplicate derivative generator. PDP priority/loading remains distinct from lazy catalogue cards. See the [official Image documentation](https://shopify.dev/docs/api/hydrogen-react/latest/components/media/image). Full payload/decode/LCP optimization belongs to Prompt 5; no runtime speed improvement is claimed from this geometry pass.

## Verification

- Typecheck, lint and final production build: **PASS**. Build retains 315 prerendered routes, 50 published products, 137 content records, 399 claims and 8 release blockers.
- Architecture and typography validation: **PASS**; existing boundaries and type/contrast rules preserved.
- Final unit rerun: **151 passed in 21 files**, after all production geometry/source-sizing changes.
- Initial targeted regression reproduced the four RU/RO reading/title failures. After correction, the initial expanded regression suite passed 12 executions; the final focused About/home/source-resolution run passed 5 tests.
- Final full clean E2E: **346 passed, 18 existing skipped, 0 failed** (12.0 minutes, two workers). Includes responsive matrix, visual baselines, deep UI audit, accessibility and all-product geometry regression on the final source state.
- First full E2E: **345 passed, 18 skipped, 1 failed**. The contact failure-preservation test timed out waiting five seconds for the mocked error message while build work also ran. Six isolated reruns (three per browser project) and the complete clean rerun passed without changing the test or contact implementation. Concurrency is a possible explanation, not a proven root cause; preserve this history when investigating future timing failures.
- Final repository/documentation validation, typecheck and lint: **PASS**. No runtime artifact is a required Markdown link target.
- No existing assertion or visual baseline was weakened or replaced. Existing skips remain explicit; a skipped test is not reported as a pass.

## Evidence access and next stage

Local evidence directory: `artifacts/prompt3-2026-09-07/`. Open the dev-server path `/artifacts/prompt3-2026-09-07/comparison.html` for before/after About RU/RO and long-title stress. Runtime artifacts are intentionally ignored by Git; they are not repository documentation-link targets or deployment dependencies.

Machine-readable evidence: `after-all.json`, `before-confirmed.json`, `before-focus.json`, `after-focus.json`, `extra.json`, `about-final.json`, `loading.json`, `source-choice.json`, `heading-inventory.json`. Logs: `e2e-final.log`, `e2e-clean-final.log`, `contact-recheck.log`, `about-final-pass.log`, `build-final.log`, `targeted-final.log`, `unit-final.log`. The committed regression is [responsive-content-integrity.spec.ts](../tests/e2e/responsive-content-integrity.spec.ts).

Remaining concerns: image source sharpness and repeated editorial content cannot be solved by responsive CSS alone. No confirmed geometry P0/P1 remains in the inspected matrix. The unchanged G11 / editorial G12 concerns and eight production blockers retain their existing status in [release-status.json](release-status.json). This report neither approves RO product claims nor closes legal/content/business approvals.

Graphify handoff: the declared Prompt 3 node links this report, its owning modules and regression suite to the [six-prompt workflow](DR_NONA_PROMPT_WORKFLOW.md). Persistence boundary: none for these changes; no API, CRM or database edits. Next stage, only on user request: **Prompt 4 — RU/RO integrity and human-review accounting**, followed separately by Prompt 5 measurement and Prompt 6 final QA.

The merged catalogue/API/CRM/database map was rebuilt with `npm run graphify:cross-repo`: **2,139 nodes, 3,964 links, 131 communities**. A bounded Prompt 3 query returns the report and owners; `graphify path` confirms the direct `validated_by` link to the new regression suite. The extractor reports warnings about some absent data nodes and unlabeled reference nodes; this map is a verified navigation aid for the task, not a claim of exhaustive semantic extraction. The declared workflow/evidence links survive the cross-repository rebuild.
