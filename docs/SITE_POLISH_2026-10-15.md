# Site polish — 2026-10-15

The owner requested a complete local review and polish using Master Skill. Scope: the existing informational catalogue and the owner's preceding annotation decisions. No deployment, dependency addition, backend migration or claim approval is included.

## Corrections

- English product identity now persists from catalogue to homepage promotions, product heading, selection and application form in both locales. English headings carry `lang="en"`; descriptions, controls and metadata retain their localized copy. A shared name helper prevents presentation drift.
- Catalogue search includes both the English identity and the translated name printed on a card. Existing description/ingredient searches still use the publication gate, and the bounded typo fallback remains restricted to names/categories.
- On small screens, the three Halo controls sit below the circular diagram. They no longer overlap the centre or one another. Tests cover 320/390 px in both languages and verify switching the information panel.
- Homepage promotions use the agreed translated product names beneath their English headings. The company-age display derives completed years from the already documented founding date, 22 August 1994, and uses the correct Russian plural form.
- Repeated runtime/SEO generation leaves identical output files untouched. This prevents unnecessary Vite invalidation of context-provider dependencies while a local page is open. A filesystem test verifies timestamp preservation and changed-content writes.
- Contact-count, homepage-order and retired-route test expectations were synchronized with the owner's prior decisions. The full Romanian product test checks English headings, localized metadata, current H2 information sections and the approved removal of public source wording.
- Seven Windows catalogue screenshot baselines were refreshed for the agreed translated subtitles, header label and contact/section removals. The Linux-specific baseline was not regenerated on Windows.
- Remaining external-site referral phrases in the RU/RO company chapters were removed, completing the earlier source-reference instruction without changing the underlying figures or identities.

## Verification boundaries

The local matrix includes type checks, lint, unit/component tests, production build/SEO/claims/market/contrast gates, axe accessibility, responsive geometry, catalogue snapshots, selection and form behavior. Browser rendering was inspected at 320/390 px and at desktop width in RU/RO. Initial discovery runs surfaced obsolete test expectations; later changes and reruns must be assessed from their final results, not from those initial failures.

The runtime CSP check passed across five routes without violations. The runtime JavaScript performance gate passed for home, contact and catalogue. Repeated generator execution was independently checked for unchanged file timestamps.

## Final local results

| Check | Result |
|---|---|
| TypeScript and ESLint | PASS |
| Unit/component suite | 212 passed across 29 files, with one worker |
| Full browser suite | 369 passed, 18 intentionally skipped; three failures resolved by generator/test corrections |
| Focused final rerun of both affected browser files | 8 passed, covering all three failed scenarios plus the related locale cases |
| Combined unique browser outcomes | 372 passed, 18 intentionally skipped across 390 scenarios |
| Catalogue baselines | Seven Windows sizes updated and verified in the full run |
| Build and HTTP/SEO gates | PASS: 191 prerendered routes, 187 canonical sitemap URLs, 150 Product and no Article records |
| CSP runtime | PASS: five routes, no violations |
| Runtime JavaScript performance | PASS: home, contact and catalogue within configured budgets |
| Generation stability | PASS: repeated generation preserves unchanged projection timestamps |
| Repository/documentation validation | PASS under the pinned Node 22.23.1 runtime |
| Release check | Expected BLOCKED: six existing P0/P1 items |

One cold unit run under concurrent browser/graph load exceeded the default one-second lazy-route lookup; the unchanged test passed in the final single-worker suite. The browser locale failure was traced to a React-context invalidation during concurrent generation, rather than reclassified without evidence. The final focused rerun passed after the unchanged-file write fix.

Local dev remains available at `http://127.0.0.1:5173/`. The QA commands used the installed Node 24 host except the explicitly pinned repository validator; no production toolchain contract was changed. No commit, push or production deployment was performed.

The merged cross-repository graph was refreshed. Its existing extractor schema warnings remain (missing source/label fields and declared-edge confidence values); the refresh completes, but these warnings are not represented as repaired.

Production remains blocked by the six open items in [release-status.json](release-status.json). The release check correctly fails. Pending scientific/therapeutic copy remains in the review documents and is not approved by this UI polish. Live production transport, consent/legal approval, production origin, WAF, media rights and GitHub protection are outside the verified local result.

See also [product names](PRODUCT_CARD_NAMES_2026-10-15.md), [detail layout](PRODUCT_DETAIL_LAYOUT_2026-10-15.md), [source removal](PUBLIC_SOURCE_LINKS_2026-10-15.md), [editorial removal](EDITORIAL_REMOVAL_2026-10-15.md), [contact removal](CONTACT_REMOVALS_2026-10-15.md) and [homepage About copy](HOME_ABOUT_COPY_2026-10-15.md).
