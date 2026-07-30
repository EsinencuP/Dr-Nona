# Dr. Nona Website — Implementation Readiness

Status: **FRONTEND QA CANDIDATE / PRODUCTION RELEASE BLOCKED**  
Last updated: 2026-07-30

Пользователь явно разрешил реализацию 2026-07-26. Ниже отдельно отмечены
завершённые frontend-ворота и решения, которые всё ещё блокируют production.

## Gate 1 — Scope

- [x] Каталог, не интернет-магазин.
- [x] Целевой рынок — Молдова.
- [x] Создана page parity inventory официальной платформы.
- [x] Зафиксированы запрещённые commerce-функции.
- [x] Текущий frontend использует 10 записей из `src/data/products.json`.
- [x] Текущий проверяемый интерфейс зафиксирован на русском языке, D-048.
- [x] Утверждена основная зрелая и старшая аудитория.
- [x] Текущий язык — русский; URL strategy утверждена D-058: unprefixed RU,
  будущий RO на `/ro/...`.
- [ ] Утверждены полный румынский UI, контент, metadata и alt-тексты.

## Gate 2 — Content

- [x] Текущий продуктовый реестр содержит 10 исходных записей: 7 опубликованы,
  3 остаются редакционными черновиками.
- [x] Для каждого товара сохранены source URL и source lastmod.
- [x] Для прототипа используется официальная таксономия категорий.
- [x] В frontend подключены catalog/card изображения для всех 10 исходных
  товарных записей; публичный UI показывает только 7 опубликованных.
- [x] Контактное окно приведено к официальной пяти-полевой структуре.
- [x] Реализован официальный country selector и реестр 28 российских
  сертификатов.
- [x] Синхронизированные изображения founders/science/business отображаются на
  контентных страницах.
- [ ] Утверждён источник отзывов.
- [ ] Медицинские/терапевтические claims прошли проверку.
- [ ] Утверждены события timeline.
- [ ] Утверждён контент Blog.

## Gate 3 — Selection and consultant flow

- [x] В прототипе подборка хранится локально в `localStorage`.
- [x] Определён предварительный набор каналов: Telegram, телефон, корпоративная
  почта.
- [ ] Определён основной канал и необходимость формы на сайте.
- [x] Неотправляющая контактная форма удалена, D-047.
- [ ] Утверждены получатель, транспорт формы, spam protection и consent.
- [ ] Определён способ выбора консультанта.
- [x] Подборка передаёт name, SKU и URL через route/email payload, D-049.
- [ ] Утверждены consent и privacy requirements.

## Gate 4 — Design system

- [x] Для прототипа выбрана пара Cormorant Garamond + Manrope из Google Fonts.
- [x] Утверждено premium-modern, спокойное типографическое направление.
- [x] Утверждено направление Mineral Light и роль цветов.
- [x] Рабочие color tokens v0.3 приняты как текущая база.
- [x] Проведена visual calibration на реализованной главной, каталоге, истории
  и Lord product page.
- [x] Реализованы responsive breakpoints 640 / 960 / 1180.
- [x] Реализована адаптивная spacing scale.
- [x] Утверждено направление Lord navy/gold.
- [x] Утверждена полная page-level смена темы внутри Lord.
- [x] Lord theme переключает также header, mobile navigation и browser
  theme-color.
- [x] Для прототипа реализован route `/lord` и кластер из двух официально
  определённых Lord-продуктов.
- [ ] Утверждена женская тема.
- [x] Утверждено фото-направление: Мёртвое море, ингредиенты и минералы.
- [x] Iconography прототипа — Phosphor outline icons.
- [x] Утверждены мягкие округлые формы и функциональная плотность каталога.
- [x] Утверждено сдержанное производительное motion-направление.
- [x] Motion прототипа: 150–420 ms, opacity/transform, без постоянных
  декоративных циклов, с `prefers-reduced-motion`.

## Gate 5 — Technical handoff

- [x] Пользователь явно разрешил писать код.
- [x] Стек прототипа: React 19, TypeScript, Vite, Phosphor Icons.
- [x] Контент синхронизируется из официального sitemap скриптом
  `scripts/sync-official-content.mjs`.
- [x] Проверены viewport 1440×900 и 390×844.
- [x] Реализованы WCAG-ориентированные состояния: focus-visible, touch targets,
  semantic landmarks, reduced motion.
- [x] Production bundle разделён на React, icons, catalog и official content.
- [x] QA-критерии и фактические результаты записаны в `QA_REPORT.md`.
- [x] Настроены отдельные `typecheck`, ESLint, Vitest и Playwright gates.
- [x] Playwright проверяет desktop/mobile Chromium, keyboard и axe WCAG A/AA.
- [x] Добавлен GitHub Actions job `quality-gates`.
- [ ] После push check `quality-gates` отмечен обязательным в GitHub ruleset.
- [x] Post-implementation аудит записан в
  `docs/audit/2026-07-26/AUDIT_REPORT.md`.

## Текущий вывод

Frontend проходит текущие технические проверки, но production release
заблокирован. Канонический список P0/P1 находится в `RELEASE_STATUS.md`.
