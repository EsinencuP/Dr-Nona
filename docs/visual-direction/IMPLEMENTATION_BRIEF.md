# Handoff prompt для будущего этапа

Исторический handoff Prompt 1. Последующий bounded visual-system этап описан в [implementation report](../VISUAL_SYSTEM_REFINEMENT_2026-09-05.md); оставшиеся product/hero/content предложения требуют отдельного задания. Ниже сохранён исходный scope аудита.

**PENDING APPROVAL. Не запускать как инструкцию на production rewrite без отдельного задания пользователя.** Сейчас выполнены только аудит и design direction.

Работай в Dr. Nona Moldova, React/TypeScript/Vite informational catalogue. Сначала прочитай AGENTS.md, release-status.json, canonical DESIGN_SYSTEM.md, visual gap audit от 2026-09-05 и proposal TARGET_DIRECTION.md в этой директории. Proposal не имеет приоритета над canonical contract до явного согласования.

Первый будущий этап — согласованные comparative layouts catalogue и PDP на375/768/1440. Используй существующие утверждённые RU/RO тексты и официальные изображения. Сравни вариант4 desktop columns с улучшенным вариантом5; natural mobile card height; PDP identity/media/CTA order. Не подменяй ассортимент, ranking, источник изображений или текст для улучшения screenshots.

При implementation выбери только один согласованный component/surface:

1. Категории и карточки: G01/G03. Устрани разрывы слов и конфликтующие fixed heights; сохрани filter functionality и 50 продуктов.
2. PDP/media: G02/G04/G11. Сохрани complete packaging и permitted fields, не дублируй полный текст. Любые изменения public headings/flow согласовываются отдельно.
3. Header/selection: G06/G09/G13. Меню без фонового текста, полные product names, единый bookmark. Не меняй persistence, payload и review-before-send.
4. Home/editorial/About/Halo: G05/G07/G08/G12. Раздели poster/portrait/lifestyle crops; не добавляй claims. G10 — отдельная редакторская очередь.
5. Contact polish: G14, только после основных компонентов; все поля/consent/transport сохраняются.

Reference principles: Solace editorial rhythm, Vercel contain-stage и explicit grid, Saleor role widths/loading geometry. Не копируй commerce features, source code под неподходящей лицензией, card truncation,10px captions,9:16 cover для упаковок или20% hover zoom. Framework migration не входит в задачу.

Для каждого изменения покажи before/after и проверь RU/RO на320/375/430/768/1024/1440/1920/2048,844×390 landscape и настоящем200% browser zoom. Для fullscreen zoom capture используй viewport screenshot: старый Playwright fullPage capture обрезал область и не являлся UI evidence. Long-text stress проводи только в диагностическом DOM, не в product datasets.

Запусти relevant repository/architecture/typecheck/lint/unit/build gates и E2E для UI/routing изменений. Не ослабляй assertions для совпадения с redesign. Объясни, что исправлено, чем доказано и какие content/design approvals ещё открыты. Не объявляй production ready: этот prompt не закрывает существующие release blockers.
