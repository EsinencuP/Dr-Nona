# Prompt 2 — Design System Refinement

Дата: 2026-09-06. Scope: visual system, typography, Mineral Light palette, spacing, surfaces, component states and motion foundation. Статус: **PASS** — visual review и соответствующие technical gates завершены. Это статус Prompt 2, не финального release всего проекта.

Это завершение ранее начатого Prompt 2 из [workflow](DR_NONA_PROMPT_WORKFLOW.md), а не новый redesign. Основание — [Prompt 1](VISUAL_DESIGN_GAP_AUDIT_2026-09-05.md), [source study](visual-direction/SOURCE_STUDY.md) и [первый refinement](VISUAL_SYSTEM_REFINEMENT_2026-09-05.md). Канонические правила: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

## Что принято и что изменено сейчас

Существующие semantic tokens, типографическая шкала, облегчённые карточки, menu/input/save states и CSS motion проверены повторно. Они уже решают основную часть Prompt 2; повторная замена этих решений не нужна.

Подтверждённый остаточный visual gap — нижние главы Halo повторяли круглые иконки верхнего summary, а заголовки читались как мелкие служебные labels. Исправлена именно эта композиция:

- Нижние главы получили спокойную нумерацию 01–03, семантические H2 и отдельную колонку чтения.
- На desktop номер, название и paragraph образуют три согласованные зоны; на mobile название находится над текстом. Использован существующий breakpoint ≤640 px.
- Заголовок: Cormorant, fluid 24–32 px, leading 1.2, pretty wrapping. Декоративный номер: Cormorant 500, fluid 32–48 px, доступный gold token; `aria-hidden` исключает лишнее объявление номера.
- Body: Manrope 16 px / 1.65, measure до 64ch; без clamp или удаления текста. Separators и отступы заменяют повторяющиеся круги.
- Hero, его три summary-блока, утверждения, source links, public copy и порядок разделов сохранены.

Ownership: `src/pages/FormulaPage.tsx`, `src/styles/formula.css`, существующий mobile-раздел `src/styles/responsive.css`. Регрессионный контроль: `tests/e2e/visual-foundation.spec.ts`. Изменений persistence, API, CRM или database нет.

## Typography decision

**Cormorant Garamond + Manrope остаются.** Cormorant подходит для mineral/editorial бренда, больших заголовков и идентичности товара. Он не используется для длинных инструкций, мелких метаданных, labels и состояний формы: там Manrope лучше сохраняет читаемость.

Latin, Cyrillic и Romanian проверены в реальном браузере. CDP `CSS.getPlatformFontsForNode` подтвердил custom Cormorant для RU specimen (26 glyphs), RO specimen (30 glyphs, включая ĂăÂâÎîȘșȚț) и custom Manrope для смешанного body specimen (92 glyphs). В этих образцах системного fallback нет. Это проверка покрытия конкретных образцов, а не доказательство идеальной типографики любого текста или одобрение перевода. Имена Light/ExtraLight в metadata variable font не означают такой CSS weight.

Существующая шкала сохраняется: display 44–72 px, title 36–60 px, section 30–48 px, card title 22–24 px; Cormorant 600 для основных headings, Manrope 400 для body и 600–750 для controls. Заголовки имеют natural height, balance/pretty wrapping; body ограничен readable measure. RU и RO могут занимать разное количество строк. Шесть self-hosted WOFF2 subsets, preload и dependencies не менялись.

## Palette, depth and motion acceptance

| Область | Принятое решение / проверка |
|---|---|
| Mineral white / sea / ink | `--bg`, `--surface`, `--surface-raised`, `--text-primary`, `--text-secondary` сохраняют существующие paper, mist, white и ink; нового SaaS-blue treatment нет |
| Border / controls | `--border` — divider; `--border-strong: #738e96` — читаемая граница поля, ≥3:1 на проверяемых light surfaces |
| Action / hover / focus | `--action: #084e5c`, hover `#063f49`; focus остаётся явным, ≥8.02:1 среди проверяемых пар |
| Muted copy | Проверяемые light-surface пары 4.92–5.71:1; dark Lord muted/gold также входят в typography validator |
| Gold / botanical | `--premium-accent` использует readable gold; botanical остаётся редким accent/success, не становится главным действием |
| Success / error | Semantic text/surface tokens, иконка/текст/ARIA сохраняют смысл без одного цвета |
| Depth | Catalogue/editorial copy на фоне страницы, image stage ограничен отдельно; PDP использует rules; tonal grouping остаётся у форм/filters; shadow — у toast и hero rail |
| Micro / standard / reveal | 140 / 220 / 420 ms; reveal opacity + translateY 10 px; mobile panel opacity + 6 px translate; heavy library не добавлена |
| Reduced motion | Видимый стационарный reveal без delay; без hover/press displacement; panel доступен сразу. Loader сохраняет читаемый loading UI с практически мгновенной одной итерацией |
| Route transition | Не добавлена: дополнительная анимация перехода не решает подтверждённую проблему текущего каталога |

Цветовые transitions остаются короткой обратной связью. Пространственное движение основано на transform/opacity; layout properties не анимируются. Полный performance baseline/optimization относится к Prompt 5 и здесь не заявляется.

## Component review

| Component | Review и сохранённое поведение |
|---|---|
| Buttons / text links | Primary, hover, pressed, keyboard focus, disabled; понятная salience и text-link treatment; E2E проверяет press и reduced motion |
| Locale / navigation | RU/RO widths, selected locale, active navigation и underline; без нового routing behavior |
| Product save / chips | Bookmark согласован с selection; saved state, `aria-pressed`, count; category labels/counts проходят responsive fit |
| Inputs / forms | Видимые border/focus, состояния validation/network/provider failures и success в существующих mock E2E; реальные заявки для визуальной проверки не отправлялись |
| Cards | Packshot stage сохраняет geometry; подпись и action не превращены в дополнительную shadow card |
| Mobile menu | Непрозрачная mineral surface, длинные RU/RO labels, открытие/закрытие и Escape; before/after screenshots |
| Loading | Реальный Suspense fallback при задержанном route module, normal/reduced motion, RU/RO; без подмены production success |
| Empty / populated selection | Оба состояния проверены в RU/RO; понятный следующий action и сохранённый bookmark |
| 404 | Читаемая gold hierarchy, recovery action и общий locale shell; обе локали в screenshot set |
| Footer / Lord | Сохранены bounded dark surfaces и restrained gold; проверены screenshots desktop/mobile, без отдельной смены темы каталога |

## Before / after evidence

Локальные generated artifacts: `artifacts/prompt2-2026-09-06/` (ignored, не добавлять в Git). Интерактивное сравнение хранится локально в `artifacts/prompt2-2026-09-06/comparison.html`; файл отсутствует в чистом checkout и на Vercel и не является обязательной ссылкой документации. Сравнение содержит **49 paired screenshots** — 11 route/state surfaces × RU/RO × 375/1440 px = 44, плюс RU/RO menu, RU/RO input focus и font specimen. До и после сняты в этом запуске, с production CSS, загруженными fonts и раскрытыми reveal; ни одна пара не выдается за результат исходного redesign от 2026-09-05.

Surfaces: home, catalogue, Gonseen PDP, About, History, Lord collection, Halo, editorial listing, contact, empty selection, 404. Дополнительно сохранены saved-card/populated selection и четыре loader-состояния. Это acceptance Prompt 2, не новый полный 50-PDP sweep Prompt 3/6.

Halo дополнительно снят на 320, 430, 768, 1024, 1920 и 844×390 px в обеих локалях — 12 screenshots. Новые regression tests проверяют главы на 320/375/430/768/1024/1440/1920/844, затем RU/RO text-spacing stress и reduced motion на 320 px. Общий E2E включает deep UI audit, responsive matrix, typography/accessibility и 200% zoom **equivalent** reflow; настоящий browser zoom в этом повторном Prompt 2 запуске отдельно не заявляется.

| Halo full-page height | Before | After | Delta |
|---|---:|---:|---:|
| RU, 375 px | 4402 px | 4110 px | −292 px |
| RO, 375 px | 4352 px | 4087 px | −265 px |
| RU, 1440 px | 2056 px | 1975 px | −81 px |
| RO, 1440 px | 2033 px | 1952 px | −81 px |

Основное изменение высоты даёт текстовая композиция без повторяющихся кругов; clipping не используется, body приведён с 1.02rem к shared 16 px / 1.65. `after/measurements.json`: в 44 route captures нет document horizontal overflow. `before/fonts.json` и `after/fonts.json` хранят font evidence. `states/results.json`: 16 axe-проверок home/Halo/contact/editorial × RU/RO × 375/1440 px, **0 violations**. Axe incomplete результаты сохранены; это не сертификат полного WCAG соответствия.

При self-review просмотрены full-page Halo before/after, mobile comparison, desktop/mobile contact sheets, menu/focus, tablet Halo, saved and loading states. Оценивались hierarchy, мера абзацев, пустоты, повторение patterns и intentional mobile stacking. Screenshots не заменены одними automated assertions.

## Verification ledger

| Command / evidence | Result |
|---|---|
| `npm run repository:validate` | PASS |
| `npm run architecture:validate` | PASS |
| `npm run typography:validate` | PASS, 14 semantic contrast pairs, 12 stylesheets, informative minimum 14 px |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test -- --maxWorkers=2` | PASS, 151 tests / 21 files |
| `npm run build` | PASS, 315 prerendered routes; build report: 50 products, 137 content records, 399 claims, 8 unchanged blockers |
| `PLAYWRIGHT_PORT=5173 npm run test:e2e -- --workers=2` | PASS, 332 passed / 18 skipped / 0 failed, 8.1 min; `e2e-final.log`. Включает visual-foundation, responsive-matrix, typography/accessibility и deep UI audit |
| Additional axe / loader diagnostics | PASS, 16 runs / 0 violations, 4 loader states |

Первый unit run при одновременных build/browser diagnostics не уложился в ожидание render двух integration tests; полный повтор с ограничением workers прошёл без изменения app или assertions. В новом тесте reduced motion исходное буквальное ожидание `transform: none` исправлено: браузер также возвращает неподвижную identity matrix. Итоговый assertion проверяет именно отсутствие displacement (`none` либо `DOMMatrixReadOnly.isIdentity`).

Первый полный E2E стартовал до этой правки и выполнял старую версию четырёх новых проверок; также был timeout одного tablet route sweep при параллельной диагностической нагрузке. Исходные логи сохранены. Итоговый полный прогон выполнен отдельно с двумя workers и прошёл без ошибок; timeout budgets, skip conditions и visual baselines для получения green не изменялись. Существовавшие до этого запуска dirty snapshots и другие изменения сохранены.

## Self-critique: что всё ещё выглядит как generic template?

Главы Halo раньше повторяли icon + eyebrow + paragraph сразу после похожего summary. Этот visual pattern заменён типографической нумерацией и различимыми заголовками. Карточки архива и timeline History остаются знакомыми структурами, но здесь помогают сканировать материалы; добавление декоративных вариаций каждой карточке ухудшило бы предсказуемость и плотность.

Ограничение остаётся в содержании: **G11** и editorial часть **G12** (повторяемость Halo-тезисов) не закрыты перестановкой CSS. Неполнота RO и формулировки требуют content/editorial решения; Prompt 2 не предоставляет такого approval. Таким образом, текущий visual portion G12 исправлен, а весь G12 не объявляется закрытым. Эта граница явно уточняет прежний PARTIAL snapshot, в котором visual acceptance и content review были смешаны.

Нет подтверждённого оставшегося дефекта в изменённой visual foundation, требующего нового redesign. Это не утверждение, что все surfaces проекта уже прошли финальный release audit. Prompt 3/4/5/6 сохраняют собственные критерии и выполняются по отдельному запросу.

## Handoff and release boundary

Следующий этап — Prompt 3: responsive typography/text/image geometry и полный 50-product coverage. Вход: этот отчёт, DESIGN_SYSTEM, Prompt 1 gap report и результаты G02/G04/G05/G08/G10. Не повторять уже принятые font/palette решения без нового evidence.

Graphify обновлён командой `npm run graphify:cross-repo`: **2134 nodes / 3950 links**, включая 22 declared contract/workflow links. Запрос `graphify query "Prompt 2 Design System Refinement" --graph graphify-out/graph.json --budget 500` подтверждает связь workflow → PASS report → FormulaPage и visual-foundation/responsive/typography/deep-audit tests. В node сохранены scope, evidence paths, open findings и следующий этап.

CSS ownership перечислен в отчёте, поскольку code-only extractor не индексирует stylesheet contents как полноценные source nodes. Extractor также сообщает 306 reference-field warnings и два zero-node JSON в CRM; эти ограничения зафиксированы, merged graph и новый report node доступны. Источник статуса — этот документ и фактические логи, не label карты сам по себе. CRM/database сохранены в объединённой карте без копирования их реализации в каталог.

`docs/release-status.json` остаётся `release-blocked`, **8 blockers**. Production approvals, RU/RO editorial approval, claims и release:check не закрывались в этом этапе. Нельзя выводить готовность всего проекта к production из PASS Prompt 2.
