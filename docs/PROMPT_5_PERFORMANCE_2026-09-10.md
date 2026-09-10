# Prompt 5 — Performance, speed and responsive media

Started 2026-09-09; acceptance review 2026-09-10. Status: **PASS — scoped frontend performance work**, with the measurement limitations and timing tradeoffs recorded below. Scope: performance of the existing frontend. No redesign, translation approval, new production dependency, API/CRM/database change or release approval.

## Baseline and method

The baseline includes the completed technical changes from [Prompt 4](PROMPT_4_BILINGUAL_INTEGRITY_2026-09-09.md), including its pending editorial quarantine. Measurements precede the production changes in this report.

- Existing tools: `performance:validate` for raw/gzip/Brotli payloads and route splitting; `performance:runtime` for isolated JavaScript parsing/execution with images and fonts blocked.
- Added [measure-page-performance.mjs](../scripts/measure-page-performance.mjs), available as `npm run performance:pages -- <output-directory> 3`, for the complementary full-media lab measurement. It does not replace or relax the existing gates.
- Each phase has **60 cold-context navigations**: Home, Catalogue, Dynamic Cream PDP, Editorial and Contact × RU/RO × 375/1440 px × three runs. Chromium, DPR 1, CPU slowdown ×4; local production preview with live external media. Each number in the route table is the median of three runs. Network latency is not a simulated mobile carrier. These are lab results, not field Core Web Vitals or a Lighthouse score.
- Captured: resource URLs, encoded/transfer bytes, font requests, selected image sources and dimensions, LCP candidate, CLS session windows, script/task duration, long tasks, image-decode trace events and scripted interaction latency. Trace decode totals are aggregate event durations, not an exclusive CPU attribution across nested events.
- Interaction timing comes from a real click on the first visible button and the Event Timing observer, with a 16 ms threshold. It is a limited lab responsiveness probe, **not field INP**. A missing event is reported as null, not zero. No real contact form is submitted.
- Twenty full-page screenshot pairs supplement the numbers. Assets and CSS are identical between the two production states. Screenshots use reduced motion and scroll through the full page to reveal below-fold content.

Baseline limitation: the build origin was `http://127.0.0.1:4173`, while the measurement server reserves a separate local port. The old prerender's absolute PNG URL therefore produced 16 CSP-blocked requests across the 60 navigations; no other request-failure type occurred. The new relative responsive PDP picture produces **zero failed requests**. The table does not count hypothetical bytes for those blocked original PNG requests, so it does not claim to quantify the full saving on a correctly configured production origin. Canonical/JSON-LD origin approval remains outside this task.

## Confirmed costs and corrections

| Finding | Before | Correction / owner | Evidence and boundary |
|---|---|---|---|
| Home fetched all product details | `HomePage` called `useProductData()`, fetching the 50-product catalogue despite displaying six products. Old network assertions checked the raw dataset name but missed the public bundle. | The existing generator emits a six-product RU/RO Home projection, consumed by `src/pages/HomePage.tsx`. | Home no longer requests `catalog-data`; 50-product catalogue remains lazy. No selection, copy or product-order change. |
| Direct PDP fetched the whole catalogue | A single product and four related cards loaded the 86,027 B raw catalogue chunk. | `src/features/product/productDetailData.ts` lazily imports one generated product/recommendation projection. `ProductPage.tsx` consumes it. | Dynamic Cream projection: 9,357 B raw / 2,068 B gzip. All 50 RU/RO detail projections equal the existing public products and recommendation order in unit tests. Unknown slugs retain 404 behavior. |
| Repeated initial SEO download | Each route fetched the 317,948 B raw / 32,068 B gzip SEO manifest and rewrote already-prerendered metadata. | Prerender records its exact path/locale; `src/seo.ts` reuses a complete matching head. The manifest remains lazy for client-side navigation. | Production browser checks verify no initial manifest request, then a manifest request and updated canonical after navigation. Unit tests cover StrictMode replay, navigation/back and incomplete-head recovery. |
| Home-only hero preloaded on other routes | Both responsive Home hero preload links were inherited by every prerendered page. | `scripts/prerender-routes.mjs` keeps them only for Home aliases. | Build gate checks all 315 manifest routes. Home LCP background remains preloaded. Non-Home routes avoid the 37,602 B mobile or 119,011 B desktop AVIF request. |
| Russian font preloaded for Romanian UI | RO HTML preloaded Manrope Cyrillic even when its shell did not use Cyrillic. | RO prerender preloads Manrope Latin Extended instead; CSS still loads any genuinely needed Cyrillic subset. | The measured RO routes save 14,500 B where Cyrillic Manrope is unused. Original-language editorial text keeps its fonts and `lang`. |
| PDP prerender bypassed responsive images | Generic prerender emitted the original PNG as a 1200×630 image before React selected an AVIF/WebP packshot. | `src/seo-core.mjs` emits a 1200×1200 responsive picture for recognized normalized product images, with the same source sizes as the existing PDP. | PNG fallback and identity are preserved; AVIF/WebP browsers avoid the PNG request. No recompression, crop, scale or image substitution. Metadata image URLs remain unchanged. |

The projections are built **after** claims and Romanian editorial quarantine. They are reproducible ignored files under `src/data/`; they do not become a second content source. The full catalogue remains available for catalogue/selection functionality. Editorial does not request it. The PDP split increases the number of generated build chunks and duplicates four recommendations in each projection; this is a delivery-size tradeoff, not a reduction in total deployment bytes. No automatic memoization or animation library was added.

## Payload and runtime results

Units below are bytes unless stated otherwise. Initial HTML totals include module preloads; the browser Home total additionally captures the previously lazy catalogue and SEO downloads.

| Metric | Before | After | Delta | Explanation |
|---|---:|---:|---:|---|
| Initial JS raw | 350,753 | 342,543 | −8,210 | Six-product projection replaces the eager data-module dependency. |
| Initial JS gzip | 104,182 | 100,639 | −3,543 | Same compression method. |
| Initial JS Brotli | 88,486 | 85,352 | −3,134 | Same compression method. |
| Initial CSS raw / gzip / Brotli | 99,936 / 19,310 / 15,713 | 99,936 / 19,310 / 15,713 | 0 | Identical CSS asset hash. |
| Initial JS + CSS gzip | 123,492 | 119,949 | −3,543 | Existing 140 KiB budget retained. |
| Home cold browser JS encoded | 151,879 | 100,639 | −51,240 (33.7%) | No full catalogue or initial SEO manifest. |
| Dynamic Cream cold browser JS encoded | 155,471 | 107,588 | −47,883 (30.8%) | Bounded PDP resource and reused head. |
| RU Home fonts | 98,144 | 98,144 | 0 | Existing glyph coverage preserved. |
| RO Home fonts | 147,000 | 132,500 | −14,500 | Unused Manrope Cyrillic preload removed. Cormorant Cyrillic still serves original Russian editorial titles. |
| Isolated Home V8 parse | 40.9 ms | 36.0 ms | −4.9 ms | Existing runtime tool; one run per phase, no media. |
| Isolated Home scripting | 122.8 ms | 57.5 ms | −65.3 ms | Same runtime tool, unthrottled. |
| Isolated Home main-thread tasks | 500.4 ms | 248.8 ms | −251.6 ms | Includes the tool's complete measured navigation interval. |
| Isolated Contact parse / script / tasks | 38.7 / 55.9 / 323.3 ms | 38.4 / 52.9 / 258.9 ms | −0.3 / −3.0 / −64.4 ms | No full data dependency introduced. |
| Isolated Catalogue parse / script / tasks | 39.5 / 76.4 / 300.4 ms | 36.6 / 73.6 / 274.6 ms | −2.9 / −2.8 / −25.8 ms | Full catalogue remains route-specific. |

Full-media results, median of three for each row:

| Route / width | LCP before → after, ms | Scripting before → after, ms | Requests before → after | CLS before → after |
|---|---:|---:|---:|---:|
| RU Home / 375 | 1336 → 1036 | 394.4 → 323.6 | 18 → 16 | 0 → 0 |
| RU Catalogue / 375 | 1236 → 1264 | 404.8 → 403.0 | 17 → 16 | .0105 → 0 |
| RU PDP / 375 | 1228 → 1148 | 315.1 → 272.0 | 20 → 16 | 0 → .0002 |
| RU Editorial / 375 | 1624 → 1476 | 394.4 → 402.7 | 28 → 27 | .0084 → .0084 |
| RU Contact / 375 | 1148 → 1100 | 291.0 → 266.0 | 14 → 13 | .0126 → .0126 |
| RU Home / 1440 | 1332 → 1064 | 377.8 → 305.4 | 21 → 19 | 0 → 0 |
| RU Catalogue / 1440 | 1528 → 1456 | 428.7 → 420.4 | 33 → 32 | 0 → 0 |
| RU PDP / 1440 | 1244 → 1176 | 318.6 → 293.7 | 21 → 17 | 0 → .0001 |
| RU Editorial / 1440 | 1584 → 1676 | 388.5 → 405.5 | 30 → 29 | 0 → 0 |
| RU Contact / 1440 | 1224 → 1168 | 302.2 → 264.7 | 14 → 13 | 0 → 0 |
| RO Home / 375 | 1248 → 1012 | 374.4 → 317.6 | 20 → 17 | 0 → 0 |
| RO Catalogue / 375 | 1224 → 1224 | 402.7 → 400.3 | 18 → 16 | .0002 → .0001 |
| RO PDP / 375 | 1040 → 1092 | 288.1 → 266.5 | 22 → 17 | .0002 → 0 |
| RO Editorial / 375 | 1640 → 1356 | 380.4 → 378.3 | 30 → 28 | .0002 → .0001 |
| RO Contact / 375 | 1056 → 1068 | 277.8 → 272.6 | 14 → 13 | .0002 → 0 |
| RO Home / 1440 | 1276 → 1072 | 374.2 → 314.6 | 23 → 20 | 0 → 0 |
| RO Catalogue / 1440 | 1396 → 1428 | 413.3 → 402.5 | 33 → 31 | 0 → .0001 |
| RO PDP / 1440 | 1104 → 1112 | 310.8 → 300.8 | 22 → 17 | .0001 → .0001 |
| RO Editorial / 1440 | 1404 → 1516 | 389.4 → 393.1 | 32 → 30 | .0001 → 0 |
| RO Contact / 1440 | 1116 → 1140 | 323.3 → 266.5 | 14 → 13 | .0001 → .0001 |

The next table averages the twenty scenario medians. It is a compact lab summary, not a traffic-weighted percentile:

| Metric | Before | After | Delta / interpretation |
|---|---:|---:|---|
| LCP | 1299.4 ms | 1229.2 ms | −70.2 ms; strongest consistent improvement is Home. |
| Scripting | 357.5 ms | 333.5 ms | −24.0 ms. |
| Main-thread tasks | 1252.2 ms | 1237.8 ms | −14.4 ms. |
| Aggregate image decode | 48.55 ms | 47.79 ms | −0.76 ms; no meaningful decode-speed claim. |
| Requests | 22.2 | 20.0 | −2.2. |
| Encoded media bytes | 161,904.8 | 99,259.6 | −62,645.2; mainly unused Home hero preloads, with the baseline CSP caveat above. |
| Scripted interaction latency | 65.2 ms | 65.2 ms | Unchanged aggregate; individual results vary in 8 ms steps. Field INP is not verified. |
| Long-task count | 2.4 | 2.4 | Unchanged. |
| Total long-task duration | 251.35 ms | 266.95 ms | **+15.60 ms**; not an improvement. Home work is less separated by the former asynchronous catalogue wait. This timing explanation is an inference, not a separate React profiler proof. |

Not every scenario is faster. Desktop Editorial LCP increased by 92 ms RU and 112 ms RO in these samples, and some other route medians moved slightly upward. The live-CDN, three-run experiment does not establish a causal regression or a universal speedup. No claim is made that parsing, decode, responsiveness and long tasks all improved. The acceptance evidence is the substantial Home/PDP delivery reduction, consistent Home LCP/scripting improvement, unchanged aggregate interaction timing and passing layout/functionality checks. Prompt 6 should retain these timing caveats rather than hide them behind a performance score.

## Asset, font, CSS and motion review

- Inventoried **437 local public files**, 138,494,781 B: 431 image files and six WOFF2 files. `asset-inventory.json` records format, dimensions, bytes, SHA-256, source references, route-use contexts, LCP role and measured/derived render constraints. Runtime usage counts are explicitly distinguished from source-file reference counts. Fonts/icons without a normal content-image slot use non-applicable or platform-specific sizing; no invented measured size is assigned.
- The 50 normalized PNGs total 44,026,794 B. Existing 300 responsive files cover AVIF/WebP × 480/800/1200 × 50 products, totalling 9,540,270 B. All 50 AVIF 480 files total 644,081 B, versus 1,270,856 B at 800: approximately 49% less for the smaller set. The existing derivatives are useful; a duplicate pipeline was unnecessary. All packshot bytes, reviewed optical scales and `contain` behavior are preserved.
- Product render maxima join the unchanged Prompt 3 twelve-width geometry and 500 DPR 1/2 source-selection observations with the new measurements. They are observed maxima, not a claim about every possible viewport. The current E2E reruns product/responsive geometry across RU/RO and all 50 products.
- The 71 old files under `public/products/catalog` and `public/products/new` total 83,812,920 B and have no current runtime source references in the inventory. They are retained as original assets. Removing them would reduce deployment size, but does not save measured browser requests; that cleanup was not substituted for runtime optimization.
- **212 source editorial image URLs reduce to 200 unique current delivery URLs** after the existing uncropped transformation. All 200 returned image data successfully, 20,362,013 B for this negotiation. `remote-assets.json` records sources, page uses, response format, dimensions, bytes and LCP candidates. The 1392 px content-container cap is recorded as a conservative CSS width bound, not falsely presented as an individual live measurement for all 200 images. External media keep their existing delivery URLs and rights-review status.
- Hero inventory: desktop AVIF 1716×917 / 119,011 B; mobile AVIF 800×1302 / 37,602 B. Existing WebP/JPEG fallbacks remain. LCP Home is not lazy. Below-fold product/editorial images keep native lazy loading; no new eager preload or image variant was introduced.
- All Russian alphabet letters and Romanian Ă/Â/Î/Ș/Ț, in both cases, exist in the union of each font family's subsets. The six font files are distinct; variable weights and CSS unicode ranges remain unchanged. `fonts.json` records per-file cmap coverage and weight axes. FontTools was used only as an external diagnostic runtime, not a project dependency. Fallback metrics and `font-display` were not altered.
- CSS inventory covers all twelve thematic files plus their aggregator. Repeated selectors mainly reflect responsive/state ownership and font faces; repetition alone is not proof of obsolete rules. No specificity rewrite, ownership merger or speculative deduplication was applied. Production CSS has the identical hash before/after.
- Motion remains the existing CSS vocabulary: state feedback, transforms/opacity, one-shot reveal observer and a spinner while loading UI is mounted. No new observer, permanent offscreen animation, `will-change`, memoization or animation library was added. Reduced-motion acceptance remains in the E2E suite.

## Visual comparison and verification

Nineteen of twenty screenshot pairs are **pixel-identical**. The remaining RU Home 375 px pair differs only inside three editorial image areas: the original capture occurred before those lazy external images finished loading; the after capture includes the same images. Text, dimensions and all pixels outside those areas are unchanged. `home-difference.png` documents that limitation rather than relabeling the pair as identical. Reviewed desktop Home and mobile RO PDP retain the existing palette, typography, complete packshots and hierarchy. No visual regression is confirmed.

| Check | Result |
|---|---|
| Typecheck / lint | PASS after final production changes. |
| Unit/integration | **169 passed / 24 files**. Includes all 50 RU/RO product projections, quarantine equality and SEO reuse/navigation tests. |
| Build and embedded architecture, typography, content, bilingual, claims, security, SEO and performance gates | PASS; 315 prerendered routes, unchanged 396 pending claims and eight blockers. |
| Existing runtime performance gate | PASS before and after; figures above. |
| Production-preview network regressions | **14 passed**; no catalogue on Home/PDP/Editorial, no PNG fallback fetch in AVIF-capable Chromium, initial SEO reuse and subsequent navigation verified. |
| Corrected development network regressions | **14 passed**. |
| Full final E2E / responsive / deep UI / accessibility | **360 passed, 18 existing skipped, zero failed** (10.7 minutes, two workers). Includes all 50 PDPs, RU/RO, responsive matrix, 200% zoom-equivalent reflow, visual baselines, deep UI and reduced-motion checks. Skips are not reported as passes. |
| Final repository/documentation validation | PASS; 39 Markdown files, eight synchronized blockers, architecture/typecheck/lint pass. |
| Release check | **BLOCKED**, correctly: eight open P0/P1 items and 396 pending claims. No approval status changed. |

The first full E2E run had 356 passed, 18 existing skips and four failures in the raw-dataset network assertions. Their old `includes("products.json")` expression also matched the allowed `home-products.json` projection. The corrected assertion matches the exact raw RU/RO dataset basename; separate assertions still reject the full public catalogue bundle. No visual baseline or performance threshold was weakened. The initial unit pass also caught the new prerender-picture assertion while source editing overlapped its run; the final stable run passed all 169 tests. The initial lint found missing browser-global declarations in the diagnostic runner, corrected with the same explicit globals declaration used by existing browser diagnostics.

## Evidence and handoff

Local ignored evidence: `artifacts/prompt5-2026-09-09/`. `comparison.html` opens the before/after pairs; `comparison.json` contains per-scenario median comparisons; `before/measurements.json` and `after/measurements.json` retain all 120 navigations, payload graphs and resource lists. Asset/font/CSS inventories, screenshots, source-media checks and validation logs are in the same directory. These are local diagnostics, not required Markdown link targets or deployment files.

Changed production/tooling owners: `scripts/generate-runtime-content.mjs`, `src/pages/HomePage.tsx`, `src/pages/ProductPage.tsx`, `src/features/product/productDetailData.ts`, `src/seo.ts`, `src/seo-core.mjs`, `scripts/prerender-routes.mjs`. Supporting changes: performance measurement/budget scripts, package commands, Playwright production-preview option, ignore rules, tests, this report, workflow and declared Graphify links. `.github/workflows/ci.yml` now runs the production request-boundary tests before its existing full development E2E suite. That command passed locally; GitHub execution/branch protection is not claimed as verified. Earlier Prompt 4 worktree changes remain separate in scope.

Graphify persistence boundary: local build-generated public projections and frontend delivery only. No API, CRM or database schema/data change. Rebuild the merged map with `npm run graphify:cross-repo`; the Prompt 5 node links this report, generators/loaders and regressions to the [six-prompt workflow](DR_NONA_PROMPT_WORKFLOW.md).

Merged map refresh completed: **2,203 nodes, 4,087 links, 125 communities**. The bounded Prompt 5 query returns the report and owning modules; `graphify path` confirms its direct `validated_by` edge to `performance.spec.ts`. All nine new implementation/measurement/test targets resolve to real source files. The extractor reports 335 warnings, including unlabeled reference nodes: the map is a verified navigation aid for this scope, not a claim of exhaustive semantic extraction.

Next stage, on user request: **Prompt 6 — final release-quality QA**. Prompt 4 remains **HUMAN REVIEW REQUIRED**. All eight current blockers in [release-status.json](release-status.json) remain open: P0-LOCALE, P0-CONTACT, P0-LEGAL, P1-MEDIA-RIGHTS, P1-CONTENT, P1-RANKING, P1-CI-PROTECTION and P1-SEO-ORIGIN. This report does not claim production readiness or completion of all six prompts.
