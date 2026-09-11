# Prompt 6 — Final release-quality visual QA

2026-09-10. Baseline: commit `b79e968`, including the accepted [Prompt 5](PROMPT_5_PERFORMANCE_2026-09-10.md) implementation. Scope: final QA of the existing frontend; no new redesign, production copy, features, assets, dependencies or backend changes.

**Visual status: PASS. Technical frontend status: PASS. RU/RO technical parity: PASS. Full production release: BLOCKED.** Frontend visual/technical quality is release-ready within the verified Chromium scope. This does not grant content, legal, business or deployment approval.

## Scope and method

Graphify was queried for the six-prompt workflow, final route/viewport tests, rendering and catalogue search. The affected traversal for `ui-ux-deep-audit.spec.ts` found no downstream code dependants. Its owning surface is Catalogue; relevant implementation is `src/pages/CatalogPage.tsx`, with functional coverage in `tests/e2e/catalog.spec.ts`. The change is test-only and has no persistence, API, CRM or database boundary.

The starting checkout was clean. Production build, CSP/runtime measurements and browser audits used the existing architecture and publication quarantine. Browser capture ran against the production preview at `http://127.0.0.1:4173`; the full Playwright suite used its normal development server at port 4286. Performance measurements preceded the concurrent browser sweeps, so sweep load is not mixed into the timing results.

- **565 addresses:** all 315 manifest routes plus missing RU/RO shell variants of existing original-language pages, the RU/RO Lord catalogue query and unknown-route probes. These are 187 original addresses and 189 each with RU and RO prefixes, including aliases; they are not 565 distinct content entities or new published routes.
- **4,520 geometry states:** each address at 320×900, 375×812, 430×900, 768×1024, 1024×900, 1440×900, 1920×900 and 844×390. All 50 products appear in both locales and in their existing unprefixed aliases. Coverage includes Home, Catalogue, Halo, About/Company/Founders/Science, History, Lord, Editorial/Blog/News, Selection, Contact, certificates, service/legal/dynamic official pages, controlled error and 404.
- **565 actual 200% browser-zoom captures:** Chromium extension `chrome.tabs.setZoom(2)`, verified through `getZoom`, a physical 1440×900 viewport, layout viewport 720×450 and DPR 2. This is not CSS zoom or only a reduced viewport. The existing E2E additionally checks zoom-equivalent reflow, text spacing, long RU/RO strings and tablet boundaries.
- **1,130 normal screenshots:** 375/1440 for every address. Key routes use full-page capture; other routes use viewport capture. DOM text/clipping inspection covers the complete rendered page at every matrix size. Scroll-through triggers existing reveal and lazy images. Screenshot coverage and visual review are distinguished: contact sheets provide broad inspection; key routes, states and suspected differences receive detailed review. This does not claim a pixel-by-pixel human review of every image or paragraph.
- **40 interaction/loading snapshots:** keyboard focus, mobile menu, card hover/save, populated selection, empty catalogue, validation, submitting/disabled, failure, mock success and route loading in RU/RO. Form network responses are intercepted locally; no actual CRM request or Telegram delivery is made.
- **40 additional axe scans:** ten surfaces × RU/RO × 375/1440, WCAG A/AA tags; these complement the repository accessibility suite. Automated accessibility success is not a claim of complete assistive-technology certification.

Platform scope: local Chromium desktop/mobile emulation. Physical iOS/Android, Safari, Firefox, deployed origin and field user metrics were not verified in this pass. The required Chromium matrix is complete; those platform checks are not silently counted as passed.

## Confirmed finding and correction

| ID / severity | Evidence before | Correction | Acceptance / risk |
|---|---|---|---|
| F6-QA-01 / P2, audit coverage | The deep audit used a structural `.catalog-toolbar input` selector and called `test.skip()` if the input was absent. This is a confirmed false-green path in the test, not evidence that the current production search is missing. The separate catalogue tests already exercised search. | Use the accessible `searchbox` named `Поиск по названию`; require it to be visible, verify 50 cards, search the existing article number `404001`, require the single Dynamic Cream result, clear and require all 50 again. | No UI change. Removes the silent escape path and fixed 500 ms sleep; uses retrying assertions. A missing search field now fails the audit. The final full run still has 18 existing project exclusions; they must not be attributed to this conditional branch. The changed test additionally passed in both projects in isolation. No screenshot baseline or threshold is relaxed. |

No new persistent visual defect was confirmed that justified changing the approved production UI. Adding a cosmetic rewrite solely to make this pass contain UI edits would not meet its scope.

## Visual review

| Surface | Current observation and implication |
|---|---|
| Header/navigation | Desktop and compact layouts retain a clear locale state, utility hierarchy, readable navigation and bounded mobile panel. Keyboard focus is visible; Escape closes the menu. Long localized labels fit the checked states. |
| Home/hero | Mineral/sea identity, serif hierarchy, product image and mobile stacking are preserved. The existing primary route actions remain available. No new giant empty stage or accidental desktop squeeze was found. |
| Catalogue/Lord | Product titles and action zones align; category labels retain word-level wrapping; search, filtering, saving and empty recovery work. Dark Lord composition remains a brand surface. All 50 products remain in the assortment. |
| PDP | Review sheets cover all 50 RU desktop and all 50 RO mobile packshots, supplemented by both-locale matrix captures and geometry regressions. Products are recognizable and contained; identity/action/reading areas remain separate. Long salt-product titles wrap without clipping. Existing supplement notices can push the mobile CTA lower and are preserved. |
| Halo/About/History | Reading measures and chapter hierarchy survive mobile/tablet reflow. About previews have explicit links to full chapters; their intentional secondary-preview clamps are not misclassified as lost reading content. History is still recognizably a repeated timeline pattern, not an accidental layout failure. |
| Editorial and original articles | Index feature/secondary hierarchy is retained. Original photographs use the existing deliberate ratios and original-language content remains Russian inside the appropriate shell. Repetitive source topics/media and uneven editorial richness remain content limitations, not proof of a new rendering defect. |
| Contact | Invalid, pending/disabled, failed and mock-success states are legible and distinct; entered data survive failure. Successful mock status is visibly identified by `final-qa-MOCK` in the diagnostic evidence. Real delivery and legal consent approval remain outside this result. |
| Footer/loading/empty/error | Dark footer structure and long links wrap; controlled error, unknown route and recoverable empty selection/search states are coherent. RU/RO loading messages remain localized. No fake production success is introduced. |

Self-critique — **Что всё ещё выглядит как generic template?** Some archived Blog/News media and repeated article structures, the repeated History timeline cards, and generic product descriptions where reviewed detail is unavailable. The information hierarchy now handles those surfaces consistently, but their editorial distinctiveness remains limited. The content aspects of G11/G12 are not marked closed: sparse RO fields and repetitive copy require the existing source/editorial approvals. Further decorative variation would be a new design iteration; inventing richer wellness text would violate the content contract. None of these observations is promoted into a new P0/P1 without evidence.

## Before/after and diagnostic exclusions

Production CSS, typography, media and application source are unchanged from the Prompt 5 baseline. Twenty fresh screenshot pairs repeat the prior comparison's routes, dimensions and initial button/Escape interaction sequence:

- **18/20 pairs are pixel-identical.**
- RU and RO desktop Catalogue each have **4,193 differing pixels**, with identical image dimensions: 4,180 in the rendering of the Soupseen/OKSEEN/PHASE-9/DND/IMUNSEEN title row and 13 at a small control-border edge. The difference crops retain the same text and layout; no persistent layout or application-code regression is confirmed. They are explicitly not labelled pixel-identical.
- The initial comparison used a clean save state instead of the Prompt 5 measurement tool's preceding button interaction. That produced non-comparable saved/hover states. The final comparison repeats the same sequence; the original comparison JSON is retained as diagnostic history.
- The first root-Home zoom screenshot sampled the transition after 100 ms and recorded stale wide geometry. Independent probes showed zero overflow after 500 ms and after reload, with `matchMedia` and 720 px viewport verified. `zoom.json` preserves the raw finding; `zoom-reviewed.json` points to the settled confirmation for this one address. This is not a CSS workaround, deleted failure or a claim that every intermediate animation frame is invariant.
- The local state-capture helper initially selected the order scenario after saving a product, and used an exact field label after validation had appended error text. Its setup was corrected to clear the local diagnostic selection and target the intended fields. These harness failures are not described as production defects or successful capture runs.

Design before/after for this stage is intentionally **unchanged**. The concrete improvement is an enforced QA check that previously silently skipped. The visual refinements remain those accepted in Prompts 2/3 and preserved through Prompt 5.

## Performance

The first two columns below are the recorded Prompt 5 baseline/after results, not newly fabricated measurements. The final column is this pass's actual build/runtime check. The existing isolated runtime tool measures V8 parse / script / task time with media excluded; single-run timing differences are not field performance evidence.

| Metric | Before Prompt 5 | After Prompt 5 | Prompt 6 check |
|---|---:|---:|---:|
| Initial JS + CSS gzip | 123,492 B | 119,949 B | **119,949 B**, unchanged |
| Initial JS + CSS Brotli | 104,199 B | 101,065 B | **101,065 B**, unchanged |
| Initial CSS raw / gzip | 99,936 / 19,310 B | 99,936 / 19,310 B | Unchanged CSS asset |
| Home browser JS encoded | 151,879 B | 100,639 B (−33.7%) | Production boundary regression rerun; no new bundle change |
| Sampled PDP browser JS encoded | 155,471 B | 107,588 B (−30.8%) | Bounded product resource retained |
| Isolated Home parse / script / task | 40.9 / 122.8 / 500.4 ms | 36.0 / 57.5 / 248.8 ms | **35.2 / 67.0 / 282.6 ms**, gate PASS |
| Isolated Contact parse / script / task | 38.7 / 55.9 / 323.3 ms | 38.4 / 52.9 / 258.9 ms | **33.5 / 44.0 / 229.7 ms**, gate PASS |
| Isolated Catalogue parse / script / task | 39.5 / 76.4 / 300.4 ms | 36.6 / 73.6 / 274.6 ms | **40.4 / 77.5 / 299.6 ms**, gate PASS |

Retained Prompt 5 full-media evidence: RU Home LCP 375 px 1336→1036 ms and 1440 px 1332→1064 ms; RO 1248→1012 and 1276→1072 ms. This pass does not claim a new LCP optimization. Prompt 5's desktop Editorial LCP variations (+92 ms RU / +112 ms RO), mean long-task duration tradeoff (+15.6 ms), live-CDN sampling limits and lack of verified field INP remain explicit. Passing a payload/runtime budget does not erase these caveats.

## Verification ledger

| Check | Result |
|---|---|
| Toolchain / repository / typecheck / lint | PASS; typecheck/lint repeated after the test change |
| Unit/integration | 169 passed, 24 files |
| Build: documentation, architecture, typography/contrast, market, product content, bilingual integrity, claims, security, TypeScript, Vite, prerender, security HTTP, SEO output/HTTP and performance budgets | PASS; 315 prerendered routes, 311 sitemap HTTP checks, 50 products, 137 official records, 396 pending claims |
| CSP browser / runtime performance | PASS; five CSP routes, zero violations; runtime values above |
| Production geometry sweep | 565 addresses / 4,520 states; zero execution errors, document overflow and H1–H3 clipping |
| Actual zoom | 565 addresses; settled root-Home confirmation replaces one transient capture for acceptance, raw evidence retained |
| Extra states / axe | 40 states; 40 axe scans, zero violations |
| Initial full E2E | 360 passed, 18 skipped, 12.2 minutes |
| Final full E2E | **360 passed, 18 existing project exclusions, zero failed**, 11.3 minutes; includes responsive matrix, deep UI, typography, accessibility, parity, routing, claims publication, forms and reduced motion. Changed search test also **2/2 passed** in isolation. |
| Production request boundaries | **14 passed**, 12.9 seconds |
| Release check | **BLOCKED**: exactly eight open repository P0/P1 items, 396 pending claims. Documentation passes; no gate bypass or approval change. |

## Remaining P0/P1

These are the actual eight open items in [release-status.json](release-status.json). Its historical `asOf` snapshot is not rewritten as approval. All blocker objects, counts and acceptance criteria remain unchanged by this pass.

| Priority / ID | What remains and what it affects |
|---|---|
| P0-LOCALE | Editorial approval of quarantined RO descriptions, composition, usage, metadata and alt; prevents approved bilingual content release. Technical RU/RO parity is separate. |
| P0-CONTACT | Legal recipient/privacy/retention, production origin, platform-wide abuse protection and deployed success/failure verification; prevents approval of real contact-form operation. |
| P0-LEGAL | Qualified Moldova review of regulated claims; 396 pending, zero approved. Prevents publication approval of regulated claims. |
| P1-MEDIA-RIGHTS | Production-use rights for product, brand and editorial media; blocks legal publication clearance. |
| P1-CONTENT | Moldova certificates and local service/editorial scope approval; limits approved local content completeness. |
| P1-RANKING | Approved popularity data or permanent official-order fallback decision; limits business approval of ranking semantics. |
| P1-CI-PROTECTION | Required GitHub branch rule and failing-check merge protection are unverified; local green checks do not prove protected remote delivery. |
| P1-SEO-ORIGIN | Approved production origin and live search-engine validation; local prerender/SEO checks do not provide live indexing approval. |

## Six-stage conclusion and evidence

Prompts **1, 2, 3 and 5** retain their accepted scoped results. Prompt **4** has technical PASS and **HUMAN REVIEW REQUIRED**; its quarantine and editorial queue are not closed by QA. Prompt **6** is **PASS for final frontend visual/technical QA**. The six technical stages have evidence, but the whole workflow is not fully approved for production: Prompt 4 human approval and the eight release blockers remain open. **Regressions: none confirmed** in the measured scope; diagnostic exclusions and platform limits are recorded above.

Changed files: this report, [workflow](DR_NONA_PROMPT_WORKFLOW.md), `tests/e2e/ui-ux-deep-audit.spec.ts`, `tools/graphify/cross-repo-links.json` and regenerated merged Graphify outputs. Production source/CSS, content datasets and release approval documents are unchanged.

Local ignored evidence directory: `artifacts/prompt6-2026-09-10/`. `comparison.html` is the gallery; `sweep.json`, `zoom.json`, `zoom-reviewed.json`, `zoom-confirm-root.json`, `states.json`, `comparison.json` and `sheets.json` provide machine-readable provenance. `sweep.mjs`, `zoom.mjs`, `zoom-confirm.mjs`, `states.mjs`, `compare.mjs`, `sheets.mjs` and `gallery.mjs` are local diagnostic helpers. Screenshots and logs are runtime evidence, not committed deployment files or required Markdown link targets.

Graphify handoff: preserve separate technical and production statuses; next work must follow the real approval queue or a newly requested scoped task. Do not auto-restart the six prompts or infer approval from this report. The map is a navigation aid; source and this evidence ledger determine the outcome.

Merged Graphify refresh completed: **2,204 nodes, 4,092 links, 132 communities**. A bounded `Prompt 6 Final QA` query returns this report, workflow and owning QA gates. The extractor still reports 340 warnings (including unlabeled reference nodes); these are disclosed map-quality limitations, not frontend runtime failures. Final repository/documentation validation passes: 699 source paths, 40 Markdown files, eight synchronized blockers. `git diff --check` passes. No production source or release-blocker object changed.
