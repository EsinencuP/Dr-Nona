# Prompt 4 — RU/RO content parity and translation integrity

Completed technical audit: 2026-09-09. Source collection started 2026-09-08.

**Workflow status: PARTIAL / HUMAN REVIEW REQUIRED. Technical integrity: PASS. Approved bilingual content: BLOCKED.** P0-LOCALE remains open. This pass grants no editorial, legal or production approval.

## Scope and sources of truth

Reviewed the historical [TEXT_BILINGUAL_AUDIT.md](TEXT_BILINGUAL_AUDIT.md), current RU/RO source and public product datasets, Romanian review manifest, claims publication rules, locale resources, company/formula data, original-language content, generated SEO manifest and release status. The old audit's historical findings are not treated as current bugs without reproduction.

Live source verification covered **148 URLs**: 50 Moldova RU product pages, 50 Moldova RO pages and 48 international references. All returned HTTP 200 after retrying three initial timeouts. URLs, timestamps, response hashes and retry history are recorded in [source-verification.json](bilingual/source-verification.json). Access success does not verify formulation equivalence, medical validity, translation quality or approval. Two products still have no international reference in the repository; none was invented.

The six repaired source mappings were checked against the fetched Moldova text. All other descriptive records retain their existing content and review status. No machine translation was produced or labeled approved.

## Inventory and parity

| Entity group | RU | RO | Meaning |
|---|---:|---:|---|
| Product source records | 50 | 50 | Complete identity coverage; descriptive content is not editorially approved |
| Company records/overlays | 6 | 6 | Same field architecture; semantic/source approval remains review work |
| Halo chapters | 3 | 3 | Same chapter identifiers and fields; no new scientific approval |
| Central UI keys | 33 | 33 | Exact keyset equality enforced automatically |
| Additional inline UI dictionaries | 16 paired dictionaries | 16 paired dictionaries | Nested keysets checked; 262 total UI field rows including central resources |
| Explicit localized routes | 64 | 64 | 50 product routes plus 14 other routes per locale |
| Full SEO route-instance inventory | 315 total | — | Includes unprefixed aliases and original-language routes; not 315 translations |
| Original official source records | 137 | 6 company overlays | Russian originals remain originals; built-in translated UI is counted separately |

For the requested **total content-entity count**, the reproducible dataset definition is **190 RU / 59 RO**: RU = 50 products + 137 official records + 3 Halo chapters; RO = 50 product records + 6 company overlays + 3 Halo chapters. Company RU records are already inside the 137. These totals include quarantine, exclude UI keys and route aliases, and must not be interpreted as the number of translated public routes.

The machine-readable [parity-audit.json](bilingual/parity-audit.json) contains **3,070 field comparisons**, each with RU value, RO value, source, status and relevant publication/review context. It also inventories all 315 route instances and records the previous status of repaired findings.

| Status | Field rows |
|---|---:|
| EXACT/PARITY | 1,375 |
| SEMANTIC_PARITY | 400 |
| NEEDS_EDITORIAL_REVIEW | 272 |
| MISSING_RO | 71 |
| TRUNCATED | 21 |
| NOT_APPLICABLE | 931 |
| MISSING_RU / SUSPICIOUS_TRANSLATION / current WRONG_FIELD_MAPPING | 0 |

These are field-row counts across different layers, not an approved-content percentage. For UI and metadata, EXACT/PARITY denotes technical correspondence and is explicitly annotated as such. SEMANTIC_PARITY is used for the established category/identity-alt and shared action-label mappings, not unreviewed descriptive prose. Null composition in both datasets is NEEDS_EDITORIAL_REVIEW, never automatically NOT_APPLICABLE. The latter is used for intentionally original-language material or absent metadata schemas. The 21 TRUNCATED flags include existing preview excerpts and incomplete summaries; they require contextual review, not automatic expansion or publication. The absence of a heuristic warning is not proof of translation quality.

## Confirmed corrections

| Finding | Correction | Publication result |
|---|---|---|
| Anti-Aging Serum composition continued into the product-benefits heading | Stop the list at the explicit next source section | Still pending and quarantined |
| Unisex Deodorant Stick composition continued into “Această formulă…” promotional prose, including within a single source text line | Preserve the list before the boundary; handle inline boundaries and Romanian diacritics | Still pending and quarantined |
| Shenseen toothpaste composition included “Ce face SHENSEEN specială?” and the following benefits | Stop at the explicit source heading | Still pending and quarantined |
| Pulmoseen composition included the “Recomandat pentru” section | Keep the ingredient section separate from recommendations | Still pending and quarantined |
| FAYA “composition” was fragrance narrative, not an ingredient list | Set ingredients to null; record unknown composition for review | No ingredients invented; still pending |
| Dynamic Cream usage lost “Utilizați zilnic” from the source heading | Preserve the imperative and its frequency | Source-backed correction, not a new application instruction; still pending |
| A missing/partial RO product record could inherit RU descriptive fields through object spread; a missing company overlay could fall back to its RU page | Reject incomplete localized records instead of silently merging/falling back | Localized error recovery remains available; validation blocks incomplete datasets |
| Romanian generic-gallery UI inherited `lang="ru"` from original prose | Give the gallery UI `lang={locale}`, preserve Russian image descriptions explicitly; apply the same override to the generic fallback link | Original content remains Russian; Romanian shell language is correct |

Full before/after values and source hashes are retained in [extraction-repairs.json](bilingual/extraction-repairs.json). Six source fields in six products changed. No product name, translated composition, claim, medical recommendation or approval was invented. The parser now preserves imperative headings and stops at explicit next-section boundaries. The old test expected frequency loss; its assertion was corrected to require the source frequency, with additional regression cases for each boundary class.

Claim-candidate regeneration changed **399 → 396 pending records** because misplaced promotional text was removed from ingredient fields. This is not approval or rejection of three claims: all 396 current candidates remain pending, with zero approved and zero rejected. Review manifests were not approved or relaxed. Release counts were synchronized while all eight blocker objects remained open. Public RO descriptive fields remain null.

## Remaining editorial work

- **50 products** require human review. All **200 RO descriptive field slots** retain quarantine; **108 contain text**, 92 are null/unknown. None is approved by this pass.
- **71 field comparisons are MISSING_RO** despite an RU value. Missing source composition/application must be resolved against suitable documentation or explicitly retained as unknown. Runtime section availability consequently differs with approved data availability; source information is not fabricated merely to make section counts equal.
- **21 summary/excerpt flags** require contextual review. Shortness or an ellipsis is a screening signal, not proof that meaning is wrong.
- **83 of 214 original-source image entries** lack source alt text. Some are non-hero article assets that are not rendered; generic images already use a source-title fallback. These are source-description/approval tasks, not a claim that 83 visible images lack accessible text. All 50 product alt fields are present in RU and RO; RO alt approval remains part of P0-LOCALE.
- Company/Halo source-linked copy, product metadata and alt approval remain in the review queue. Shared original-language articles have no invented RO translation or alternate URL.

The [editorial-review table](bilingual/EDITORIAL_REVIEW.md) has one row per product. [editorial-review.json](bilingual/editorial-review.json) additionally includes field values, company/formula, metadata and original-media review items. These queues are not approval registries; human decisions must follow the existing content and claims workflow.

## Validation and reproducibility

| Check | Result |
|---|---|
| `npm run bilingual:validate` | PASS: keysets, record/field presence, quarantine, RO metadata language, reciprocal route/hreflang contracts |
| `npm run content:validate` | PASS; now includes bilingual validation and therefore runs in build/CI |
| `npm run test -- --maxWorkers=2` | 161 tests in 22 files passed |
| Typecheck / lint | PASS |
| Production build | PASS: 315 routes, 311 indexable, 50 published products, 396 pending claims, 8 blockers; existing architecture, typography, claims, security, SEO and payload gates pass |
| Scoped E2E | 60/60 passed: RU/RO catalogue, product quarantine, source language, navigation, forms and editorial media |
| Final bilingual browser sweep | 6/6 passed: all 50 RO PDPs, all 14 other explicit RO routes and original-language gallery UI, desktop and mobile projects |
| `npm run release:check` | BLOCKED as required: all eight existing P0/P1 blockers remain open; no approval inferred from technical checks |

The browser tests inspect title/description, canonical, OpenGraph locale, image-alt coverage and localized actions. Existing build SEO validation checks the complete prerendered manifest and structured metadata. Original pages intentionally keep Russian metadata at their unprefixed canonical URL while the user's surrounding shell may be Romanian. No `/ro/...` route was accepted with Russian metadata. Existing contact tests verify locale-preserving forms and mocked success/failure; no real application was sent.

Run `npm run bilingual:audit` to refresh the machine-readable comparisons and review table from current local data. Source re-verification is an explicit separate operation; validation does not require network access or ignored runtime artifacts. Source snapshots and diagnostic logs for this pass are local under `artifacts/prompt4-2026-09-08/`; permanent provenance is stored in `docs/bilingual/`.

Graphify should route future work through this report and the audit/gate, parser, data loader, locale dictionaries and tests. Filter machine-readable rows by entity and field rather than loading the entire audit into agent context. The approved-content decision stays with human reviewers. Next workflow stage: Prompt 5 only on user request; it does not close P0-LOCALE or bypass the final release check.

The cross-repository graph was rebuilt: 2,178 nodes, 4,028 links, 130 communities. A bounded Prompt 4 query returns the report and implementation/test owners; the direct `validated_by` path to `audit-bilingual.mjs` was verified. Extraction warnings about some reference-node labels remain; the map is a navigation aid and does not override source files or approval records.
