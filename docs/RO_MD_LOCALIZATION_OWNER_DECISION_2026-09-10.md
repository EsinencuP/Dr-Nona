# RO-MD localization — User Direct Decision #1

Date: 2026-09-10. Scope: the 50-product catalogue, its Romanian names, descriptive fields, categories, alt text, UI and generated product metadata. No CRM, database, legal approval or redesign is included.

## Owner authorization

The project owner explicitly authorized in this conversation:

> Я, как владелец проекта, даю прямое подтверждение и авторизацию (User Direct Decision #1) на внедрение полной румынской локализации (ro-MD).

1. Разрешаю автоматический качественный перевод на румынский язык для всех 50 продуктов в каталоге (названия, shortDescription, longDescription, ingredients, howToUse, category, alt-тексты).
2. Заполни недостающие румынские тексты так, чтобы на румынской версии не оставалось пустых полей и не было смешивания с русским языком.
3. Дополни словарь src/locales/ro.ts всеми недостающими строками UI.
4. Обнови docs/release-status.json и docs/RELEASE_STATUS.md: переведи блокер P0-LOCALE в статус "resolved".
5. Запусти валидацию: npm run content:validate, npm run typecheck, npm run test. Добейся статуса PASS без ошибок.

This direct decision supersedes the previous requirement for separate editorial approval before publishing automated Romanian product translations. It does not constitute independent professional linguistic review or Moldova medical/legal claims approval.

## Translation and source policy

- All 50 records have Romanian names, short descriptions, long descriptions, composition text, usage text, categories and alt text. Trade names, SKU, slugs, product identity, assets and assortment remain unchanged.
- Descriptions are automated, source-grounded condensed adaptations of [the RU Moldova dataset](../src/data/products.json), not literal translations of every promotional sentence. Regulated marketing assertions were omitted, not approved. Exact available quantities, times and usage limits are retained.
- Public source links point to the actual source used for translation. Source URLs, source/translation SHA-256 fingerprints, authorization and field-level source issues are in [products-ro-review.json](../src/data/products-ro-review.json). Publication fails if approved source or translation changes without renewed evidence.
- Missing or ambiguous composition/instructions are represented by explicit Romanian absence notices. These notices fill the interface but do **not** make the underlying information known. Partial ingredient lists remain labeled partial. No dosage, botanical identity or complete formula is reconstructed from assumptions.
- 31 field-level source issues remain in the [editorial review queue](bilingual/EDITORIAL_REVIEW.md). Resolving the language publication blocker does not resolve those source deficiencies.
- The RU dataset and original-language articles remain unchanged. Russian articles keep their explicit `lang="ru"` within the Romanian UI shell; they are not presented as translations.
- The existing claims gate remains independent. Superseded Romanian claim candidates are retained in [the archival record](bilingual/superseded-ro-claims-2026-09-10.json); removal from current copy is not legal approval.

## Validation and release outcome

`P0-LOCALE` is `resolved` in [release-status.json](release-status.json), under `resolvedBlockers`; the seven other blockers remain open. The generated [release status](RELEASE_STATUS.md) retains the production-blocked verdict.

| Check | Result |
|---|---|
| Product coverage | 50 RU / 50 RO; 350 nonempty RO fields; 200 public descriptive fields |
| Publication quarantine | 0 RO products / 0 RO field slots; legal claims gate remains enforced |
| UI and routing | 35/35 central keys, 16 paired inline dictionaries, 64/64 locale routes |
| Source issues | 31 fields across 19 products still require source clarification; explicit notices/partial-list labels are published |
| `npm run content:validate` | PASS; 3,072 machine-readable field comparisons, 0 technical errors |
| `npm run typecheck` / `npm run lint` | PASS |
| `npm run test` | PASS; 175 tests in 25 files, including a negative test proving that owner translation authorization cannot publish a pending Romanian legal claim |
| Production build | PASS; 315 prerendered routes, 150 Product schemas, 311 sitemap URLs; SEO HTTP, claims and performance budgets pass |
| Browser QA | 36 scoped desktop/mobile tests PASS, including 100 PDP visits (50 products × 2 viewports), complete composition/usage, localized metadata, zero horizontal/title overflow and six RO axe scans |
| Final sorting/catalogue regression | 16/16 desktop/mobile tests PASS after the collation fix, including A–Z/Z–A, locale switching, original-language articles and error states |
| Repository / architecture / typography | PASS; documentation links and synchronized release state verified |
| `npm run release:check` | EXPECTED BLOCKED (exit 1): seven remaining P0/P1 blockers, excluding P0-LOCALE |
| Graphify | Cross-repository map rebuilt; bounded query returns this current decision and links to the historical Prompt 4/6 evidence. Catalog, API, CRM and database boundaries remain separate. |

The existing generic RU accessibility suite also passed (16 scans). Reviewed desktop and mobile screenshots include Dynamic, long-title bath salts and FAYA. No CSS or image changes were needed. A separate confirmed localization defect was corrected: A–Z/Z–A sorting now uses `ro-MD` collation for Romanian products, with a regression test for Ă/Î/Ș/Ț. Popularity ranking and canonical product identity remain unchanged.

Test expectation changes follow the explicit owner decision: RO display names and descriptions are now published rather than expecting English names and quarantined fields. Canonical tests accept the configured `SITE_URL` independently of the preview port; they still assert the full URL. Initial four failures were solely a 4291 preview / 4173 build-origin mismatch, not a route regression.

The frontend's initial payload increased from the Prompt 6 baseline of 119,949 B gzip / 101,065 B Brotli to 120,883 B / 101,911 B when the existing six Home projections gained their authorized RO text. Full catalogue/detail datasets remain route-separated. This is a localization change, not a new performance optimization pass.

The parity report retains the 148 historical source-access checks from Prompt 4. They were not fetched again for this decision; translations are based on the exact checked-in source snapshot bound by hashes. Historical HTTP 200 is not a new approval or a guarantee of current source accuracy.

Local diagnostic output: `artifacts/locale-2026-09-10/`. These generated files are not committed and are not documentation links required by CI.
