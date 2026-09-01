# Аудит текста и двуязычности Dr. Nona Moldova

Дата: 2026-08-31  
Репозиторий: `C:\Users\User.DESKTOP\Documents\Web dev\Dr Nona`  
Commit: `10f41f3d413c` (`main`)  
Основной источник: <https://www.drnona.md/catalog>  
Дополнительный источник: <https://drnona.com/>

## Статус устранения на 2026-09-01

Исходные наблюдения ниже сохранены как доказательство состояния commit `10f41f3d`. Реализация исправлена: product claims проходят единый publication gate; неутверждённые RO-поля находятся в редакционном карантине; выбранная локаль сохраняется в URL, storage и заявке; Telegram получает `RU`/`RO`; recovery, certificates и editorial shell локализованы; оригинальные статьи явно размечены `lang="ru"`; SEO не использует английский boilerplate, соблюдает диапазоны длины и объявляет только существующие alternates; четыре недоступных source URL имеют статус `tombstone`; документация синхронизирована с 50 продуктами, 137 source records, 399 pending claims и 315 маршрутами.

Не являются программными дефектами и остаются release blockers: human approval румынского product copy, legal review claims, privacy/recipient approval, подтверждение production origin, media rights, ranking source и branch protection. Эти данные не были выдуманы или помечены как закрытые.

| Контрольная проверка 2026-09-01 | Результат |
|---|---:|
| TypeScript / ESLint | PASS |
| Unit/integration | 22 files, 165 tests PASS |
| Production build / prerender | PASS, 315 routes |
| SEO output | PASS, 311 indexable routes |
| Focused RU/RO route flows | 14/14 PASS (desktop + mobile) |
| Contact/application flows | 12/12 PASS (desktop + mobile) |
| Deep UI/UX audit | 65/65 PASS |
| Release readiness | BLOCKED только 8 внешними P0/P1 approvals |

## Исполнительное резюме

Исходное предположение задания о том, что румынская версия ещё не реализована, устарело. В текущем репозитории есть 34 из 34 UI-ключей RO, 50 из 50 румынских продуктовых записей, шесть локализованных разделов о компании, три главы Halo Complex и 60 явных RO-записей в SEO-манифесте.

При этом сайт нельзя считать редакционно готовым. Главный P0 — 97 неутверждённых продуктовых claims для 37 товаров попадают в публичный интерфейс, потому что `getProductCopy()` возвращает исходный текст без проверки runtime publishability. Второй P0 — структура `products-ro.json` формально полна, но семантически повреждена: состав и применение часто являются обрезками соседнего текста. Третий системный разрыв — любой внутренний URL получает `/ro`, хотя сертификаты, editorial, 404/400 и большая часть dynamic official pages не локализованы; при этом документ получает `lang="ro"`.

Текущий релизный статус и инвентарь также отстают от кода: документация говорит о 301 маршруте, 42 изображениях и восьми заглушках, тогда как актуальный генератор создаёт 307 маршрутов, а каталог содержит 50 локальных PNG и ни одной заглушки.

## Метод и ограничения

- Проверены `AGENTS.md`, content/market/release/page документы, исходники UI, данные RU/RO, claims registry, runtime content и SEO manifest.
- Инвентарь названий зафиксирован явно в `scripts/sync-moldova-catalog.mjs:14-67` на основании карточек основного каталога. 48 из 50 товаров имеют дополнительный `officialSourceUrl`; `body-butter` и `shower-gel-lord` имеют только источник Moldova.
- Полный live-sync источника в ходе проверки не завершился за 90 секунд и был остановлен без записи. Поэтому колонка имени ниже означает совпадение с сохранённым source-backed inventory, а не новую независимую live-верификацию всех 50 страниц.
- `NV` означает `NOT VERIFIED`: поле отсутствует в текущем источнике/наборе и не было выдумано.
- Для длины применён стандарт задания: short 50–200 символов, long 200–800 символов.

## Критические дефекты (P0)

### P0-1. Product claims обходят публикационный gate — CLOSED 2026-09-01

На момент исходного аудита registry содержал 286 записей и runtime обходил публикационный фильтр. Исправлено 2026-09-01: сканер охватывает RU/RO и четыре продуктовых поля, registry содержит 399 pending записей, а `getProductCopy()` скрывает непроверенные поля и использует нейтральное описание для карточки. Генератор дополнительно создаёт `products-public.json` и `products-ro-public.json`: pending/rejected поля заменяются на `null` до Vite bundling, поэтому исходный claim-текст не попадает даже в browser-facing product chunks.

Все публичные потребители используют один gate: карточки, поиск, главная и product detail вызывают `getProductCopy()`. Главная хранит в runtime только product slugs и разрешает их через уже очищенный public dataset. Дисклеймер остаётся дополнительным пояснением и не используется как замена approval.

Критерий закрытия выполнен: pending/rejected поля отсутствуют в public datasets и не рендерятся; краткая карточка получает нейтральный текст, остальные секции скрываются. `content:validate` и unit regression test блокируют повторную утечку.

### P0-2. RO product copy структурно присутствует, но семантически повреждён — TECHNICAL FIX COMPLETE 2026-09-01 / EDITORIAL APPROVAL PENDING

Исходные доказательства на commit `10f41f3d` (в текущих полях больше не воспроизводятся):

- `src/data/products-ro.json:5`: `ingredients` Solaris начинается с «și ingrediente!» и включает преимущества, медицинские эффекты и применение.
- `src/data/products-ro.json:15`: `howToUse` Hand and Nail Cream равен обрывку `, vei simți diferența!`.
- `src/data/products-ro.json:23`: `ingredients` Dynamic Cream начинается с `unică:.` и заканчивается рекламным обещанием.
- В RO отсутствуют 13 составов и 28 способов применения; это существенно больше, чем RU (7 и 14 соответственно).

Причина системная: `scripts/sync-moldova-catalog.mjs:317-330` режет весь текст страницы регулярными выражениями между маркерами. `scripts/check-product-content.mjs:16-30` проверяет только наличие обязательных строк и отсутствие кириллицы, но не границы секций, грамматику и семантический тип поля.

Техническая причина устранена 2026-09-01. `scripts/romanian-product-content-lib.mjs` извлекает текст по реальным `<br>`-границам Tilda, а не из одной склеенной строки. `ingredients` и `howToUse` создаются только при явном смысловом заголовке и останавливаются перед преимуществами, промо-текстом или соседним разделом. Если самостоятельного раздела в источнике нет, сохраняется `null` — обрывок больше не изобретается.

`npm run content:repair:ro:write` повторно обработал 50 из 50 live source pages: подтверждено 8 явных разделов состава и 1 явный раздел применения. Остальные поля намеренно `null`, поскольку самостоятельный раздел не подтверждён источником; это не считается отсутствием данных, которое можно заполнять догадкой. Исправлены исходные примеры Solaris, Hand and Nail Cream и Dynamic Cream. `content:validate` теперь запускает semantic validation для каждой RO-записи, а unit fixtures блокируют обрывки, смешение разделов, захват промо-текста и искусственное заполнение отсутствующих секций.

В `products-ro-review.json` сформирована явная очередь из 50 товаров / 200 описательных полей. Все статусы остаются `pending`; public datasets содержат `null` до отдельного human approval и legal decision по claims. Поэтому программный P0-2 устранён, но редакционный критерий закрытия релиза — ручная проверка и подтверждение каждого применимого поля — намеренно остаётся внешним blocker.

### P0-3. `/ro` обещает полный румынский документ для непереведённых страниц — CLOSED 2026-09-01

`src/router.tsx:103-112` добавляет текущий locale ко всем внутренним путям. `src/locales/LocaleProvider.tsx:24-28` затем ставит `html[lang]` в `ro`. Но следующие публичные поверхности остаются русскими:

- certificates — `src/pages/CertificatesPage.tsx:12-66`;
- editorial/blog/news shell — `src/features/editorial/EditorialPages.tsx:25-121`, `src/components/ArticleCard.tsx:13-38`;
- 404/400/error boundary — `src/pages/NotFoundPage.tsx:7-9`, `src/pages/BadRequestPage.tsx:16-21`, `src/app/ApplicationErrorBoundary.tsx:47-61`;
- большая часть 137 dynamic official pages, для которых в `company-pages.json` нет RO override.

SEO подтверждает неполное покрытие: 307 маршрутов = 120 RU, 60 RO, 127 implicit/default. Для `/ro/certificates`, `/ro/editorial`, `/ro/blog` и `/ro/news` нет отдельных manifest records, хотя runtime такие URL открывает.

Исправлено 2026-09-01. `src/locale-routing.mjs` стал единым контрактом поддержки языковых URL для runtime router и SEO generator. `/ru` и `/ro` создаются только для полностью локализованных страниц: home, catalogue, product detail, selection, contacts, certificates, company chapters, Halo Complex и editorial hubs. Оригинальные article detail, FAQ, legal и остальные dynamic official pages остаются на единственном unprefixed canonical URL.

При переходе из RO shell ссылки на оригинальный материал больше не получают ложный `/ro`; прямой legacy-ввод такого префикса безопасно нормализуется к исходному URL с сохранением UI locale. Русский title, description, article body и image alt размечены `lang="ru"`, тогда как навигация, даты, CTA и source labels остаются румынскими. Для таких страниц manifest объявляет только `ru-MD` и `x-default`, без фиктивного `ro-MD`.

Certificates, editorial hubs, 404, 400 и application error screen имеют полный румынский UI. Runtime metadata для RO 404/400 также локализованы, остаются `noindex` и не публикуют hreflang. Unit route fixtures и Chromium E2E блокируют повторное появление `/ro/blog/{article}`, `/ro/faq`, ложного canonical или неверной языковой разметки. Критерий закрытия выполнен.

### P0-4. Язык заявки теряется на сервере — CLOSED 2026-09-01

Исходное состояние на commit `10f41f3d`: форма была визуально локализована, но `ApplicationInput` не передавал locale; server record разрешал только `"ru-MD"`, а service жёстко записывал `"ru-MD"`. Заявка с `/ro/contactus` уходила оператору как русская.

Исправлено 2026-09-01. Общая `applicationInputSchema` принимает только `ru-MD | ro-MD`; клиент формирует locale из фактического UI route, API повторно валидирует значение на сервере, а `processApplication()` переносит его без fallback и hardcode в `ApplicationRecord`. Серверный тип locale теперь выводится непосредственно из `ApplicationInput["locale"]`, поэтому отдельный контракт не может разойтись со schema.

Telegram formatter выводит `Язык: RU` или `Язык: RO` из проверенной записи. Unit/integration matrix покрывает обе локали на уровнях shared schema, API handoff, application service и Telegram message. Browser E2E перехватывает фактические запросы `/contactus` и `/ro/contactus` и подтверждает payload `ru-MD` и `ro-MD`. Критерий закрытия выполнен.

## Дефекты P1

1. **P1 — release documents не отражают текущую реализацию.** `docs/RELEASE_STATUS.md:36` всё ещё говорит, что RO «not implemented»; `docs/PAGE_INVENTORY.md:5` фиксирует 301/299 вместо 307/303; `docs/CONTENT_MODEL.md:22` и `docs/PROJECT_STATUS.md:27` говорят о 42 изображениях и восьми заглушках, хотя сейчас 50 PNG и 0 placeholder.
2. **P1 — SKU отсутствует у двух опубликованных товаров.** Пустые SKU: `body-butter` (`src/data/products.json:90`) и `shower-gel-lord` (`src/data/products.json:815`). Значение нельзя выдумывать; до подтверждения источник/интерфейс должен честно показывать NV.
3. **P1 — content length и структура не выдержаны.** 25 из 50 short descriptions выходят за 50–200 символов; 29 из 50 long descriptions выходят за 200–800. Большинство длинных строк представляют не описание, а слитые преимущества, состав и применение.
4. **P1 — SEO-текст неоднороден.** Среди 303 indexable routes: 56 title вне 30–65, 38 descriptions вне 70–160, 115 descriptions содержат английский fallback `Shop Dr. Nona International...`, 126 routes не имеют locale alternates. Дубликатов title/description групп не найдено.
5. **P1 — locale сохраняется только через URL, не восстанавливается на unprefixed entry.** `LocaleProvider` записывает `drnona-locale`, но не читает его. Переходы внутри `/ro/...` сохраняют язык, однако новое открытие `/` после RO снова выбирает RU.
6. **P1 — автоматический content gate даёт ложный PASS.** Nullability проверяется по категории, но RO `ingredients/howToUse` не проверяются как nullable/semantically valid; сообщение `RU/RO records complete` не соответствует фактической редакционной полноте.
7. **P1 — четыре официальные записи повреждены fetch error.** `/blog/Mastopathy`, `/news/happypassover`, `/news/july-promo`, `/news/ukraine-results-2022` имеют пустые title/description и `Error: 404 Not Found`. Editorial lists их фильтруют, но записи остаются в SSOT и должны быть удалены или помечены tombstone.
8. **P1 — румынские product claims не имеют отдельного реестра/approval mapping.** Registry построен по RU/official content. RO содержит дополнительные терапевтические формулировки, но проверка не связывает их с claim fingerprint.
9. **P1 — актуальный build заблокирован typography gate.** `src/styles/responsive.css:1414` задаёт видимому тексту 0.78rem (12.48px), а `src/styles/responsive.css:1420` — 0.84rem (13.44px). Оба значения ниже проектного минимума 14px и особенно нежелательны для заявленной зрелой аудитории.

## Дефекты P2

1. `productsFound` присутствует в обоих locale resources, но напрямую не используется.
2. В TS/TSX вне `src/locales` найдено 268 строк с кириллицей в 20 файлах. Значительная часть — нормальные локальные RU/RO copy objects, но это осложняет контроль полноты и позволяет непереведённым страницам пройти без ошибки.
3. Стиль RU product copy неоднороден: разговорное «твой/попробуй», двойные восклицательные знаки, слитые списки, `Dr. Nona—`, `Преимущества:.`, опечатки вроде «пртивоспалительная» и «мыщцах».
4. Названия сохраняют spelling первичного каталога, включая `Parfume`, `Lavander`, `Musk`. Это допустимо только как осознанное source fidelity; перед релизом владелец бренда должен подтвердить, что эти варианты являются торговыми названиями, а не ошибками источника.
5. International email опубликован корректно как «международная поддержка», а не как Moldova contact (`docs/MOLDOVA_MARKET.md:17`, `src/pages/ContactPage.tsx:61,84`). Это не дефект, но его нельзя переименовывать в локальный email без approval.

## Инвентарь i18n UI

Все 34 ключа имеют RU и RO значение. Колонка «исп.» показывает число файлов с прямым обращением `t.key`; динамические/косвенные обращения не учитываются.

| Ключ | RU | RO | Исп. | Статус |
|---|---|---|---:|---|
| `catalog` | Каталог | Catalog | 2 | ✓ |
| `about` | О компании | Despre companie | 1 | ✓ |
| `formula` | Halo Complex™ | Halo Complex™ | 1 | ✓ brand |
| `editorial` | Блог / Новости | Blog / Noutăți | 1 | ✓ |
| `selection` | Подборка | Selecție | 1 | ✓ |
| `allProducts` | Все продукты | Toate produsele | 1 | ✓ |
| `details` | Подробнее | Detalii | 1 | ✓ |
| `add` | В подборку | Adaugă în selecție | 2 | ✓ |
| `added` | Добавлено | Adăugat | 2 | ✓ |
| `search` | Поиск по названию | Caută după denumire | 1 | ✓ |
| `allCategories` | Все категории | Toate categoriile | 1 | ✓ |
| `sortPopular` | По популярности | După popularitate | 1 | ✓ |
| `sortAZ` | По алфавиту А—Я | Alfabetic A—Z | 1 | ✓ |
| `sortZA` | По алфавиту Я—А | Alfabetic Z—A | 1 | ✓ |
| `sortUpdated` | Недавно обновлённые | Actualizate recent | 1 | ✓ |
| `productsFound` | продуктов | produse | 0 | ⚠ unused |
| `empty` | По этим параметрам ничего не найдено. | Nu am găsit produse pentru filtrele selectate. | 1 | ✓ |
| `reset` | Сбросить фильтры | Resetează filtrele | 1 | ✓ |
| `source` | Источник | Sursă | 1 UI | ✓ |
| `ingredients` | Состав | Compoziție | 2 | ✓ |
| `use` | Способ применения | Mod de utilizare | 1 | ✓ |
| `related` | Дополнить уход | Completează îngrijirea | 1 | ✓ |
| `category` | Категория | Categorie | 8 | ✓ |
| `sku` | Артикул | Cod produs | 7 | ✓ |
| `menu` | Открыть меню | Deschide meniul | 1 | ✓ |
| `close` | Закрыть меню | Închide meniul | 1 | ✓ |
| `home` | Главная | Pagina principală | 2 | ✓ |
| `skipToContent` | Перейти к содержанию | Sari la conținut | 1 | ✓ |
| `brandHome` | Dr. Nona Moldova — главная | Dr. Nona Moldova — pagina principală | 1 | ✓ |
| `primaryNavigation` | Основная навигация | Navigare principală | 1 | ✓ |
| `mobileNavigation` | Мобильная навигация | Navigare mobilă | 1 | ✓ |
| `breadcrumbs` | Хлебные крошки | Fir de navigare | 1 | ✓ |
| `consentText` | Согласие на обработку данных | Acord pentru prelucrarea datelor | 1 | ⚠ legal approval pending |
| `privacyPolicy` | Политика конфиденциальности | Politica de confidențialitate | 1 | ⚠ target page remains RU |

## Полный аудит продуктов

Легенда: `⚠ 29` — фактическая длина вне стандарта; `— NV` — данных нет и они не выдуманы; `✗ N pending` — количество найденных pending claims; `⚠ review` — RO поля заполнены, но редакторская/семантическая проверка не пройдена.

| # | Slug | Source-backed officialName | Short RU | Long RU | Ingredients RU | Use RU | Claims | Alt | RO |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `solaris-body-lotion` | `Solaris Body Lotion` | ⚠ 29 | ⚠ 999 | ✓ | ✓ | ✗ 1 pending | ✓ | ⚠ 1 null |
| 2 | `hand-and-nail-treatment` | `Hand and Nail Cream` | ⚠ 252 | ✓ | ✓ | ✓ | ✗ 1 pending | ✓ | ⚠ review |
| 3 | `dynamic-hydrating-cream` | `Dynamic Cream` | ✓ | ⚠ 854 | ✓ | ✓ | ✗ 3 pending | ✓ | ⚠ review |
| 4 | `body-butter` | `Shea Body Butter` | ✓ | ⚠ 819 | — NV | — NV | ✗ 1 pending | ✓ | ⚠ 2 null |
| 5 | `facial-solaris` | `Solaris Facial Cream` | ✓ | ⚠ 809 | ✓ | ✓ | ✗ 3 pending | ✓ | ⚠ 2 null |
| 6 | `eye-contour-balm` | `Eye Care Balm` | ✓ | ✓ | ✓ | ✓ | ✓ 0 detected | ✓ | ⚠ 2 null |
| 7 | `face-milk` | `Face Milk` | ✓ | ✓ | ✓ | ✓ | ✗ 1 pending | ✓ | ⚠ 2 null |
| 8 | `night-cream` | `Night Cream` | ⚠ 28 | ✓ | ✓ | ✓ | ✓ 0 detected | ✓ | ⚠ 1 null |
| 9 | `anti-aging-serum` | `Anti-Aging Serum` | ✓ | ⚠ 1098 | ✓ | ✓ | ✗ 2 pending | ✓ | ⚠ 2 null |
| 10 | `ard-complex` | `Moisturizing Cream / For Face` | ⚠ 220 | ✓ | — NV | ✓ | ✗ 1 pending | ✓ | ⚠ 1 null |
| 11 | `shp-day-time-face-cream-lc` | `Day Time Face Cream` | ⚠ 255 | ⚠ 1087 | — NV | — NV | ✗ 1 pending | ✓ | ⚠ 1 null |
| 12 | `samples-kit` | `Top Samples Kit` | ⚠ 207 | ✓ | — NV | — NV | ✓ 0 detected | ✓ | ⚠ 2 null |
| 13 | `gonseen` | `Gonseen Tea` | ✓ | ⚠ 1103 | ✓ | ✓ | ✗ 3 pending | ✓ | ⚠ review |
| 14 | `coffee-mix` | `Slimseen Coffee Mix` | ⚠ 41 | ✓ | ✓ | ✓ | ✗ 1 pending | ✓ | ⚠ review |
| 15 | `chocoseen` | `Chocoseen` | ⚠ 34 | ⚠ 1395 | ✓ | ✓ | ✗ 5 pending | ✓ | ⚠ 1 null |
| 16 | `soupseen` | `Soupseen` | ⚠ 255 | ⚠ 1393 | ✓ | ✓ | ✗ 2 pending | ✓ | ⚠ 1 null |
| 17 | `okseen` | `OKSEEN` | ✓ | ⚠ 965 | ✓ | ✓ | ✗ 6 pending | ✓ | ⚠ review |
| 18 | `fase-9` | `PHASE-9` | ⚠ 218 | ✓ | ✓ | ✓ | ✗ 3 pending | ✓ | ⚠ 1 null |
| 19 | `dnd-chewing-gum-tablets` | `DND` | ✓ | ⚠ 1099 | ✓ | ✓ | ✗ 4 pending | ✓ | ⚠ 1 null |
| 20 | `imunseen` | `IMUNSEEN` | ✓ | ⚠ 1100 | ✓ | ✓ | ✗ 8 pending | ✓ | ⚠ 1 null |
| 21 | `goldseen` | `GOLDSEEN` | ✓ | ⚠ 954 | ✓ | ✓ | ✗ 6 pending | ✓ | ⚠ 1 null |
| 22 | `cleanseen` | `CLEANSEEN` | ⚠ 41 | ✓ | ✓ | ✓ | ✗ 3 pending | ✓ | ⚠ review |
| 23 | `ravseen` | `RAVSEEN` | ⚠ 253 | ✓ | ✓ | ✓ | ✗ 4 pending | ✓ | ⚠ 1 null |
| 24 | `pulmoseen` | `PULMOSEEN` | ✓ | ✓ | ✓ | ✓ | ✗ 5 pending | ✓ | ⚠ review |
| 25 | `reumoseen` | `REUMOSEEN` | ⚠ 48 | ✓ | ✓ | ✓ | ✗ 2 pending | ✓ | ⚠ 1 null |
| 26 | `yamseen` | `YAMSEEN` | ✓ | ✓ | ✓ | ✓ | ✓ 0 detected | ✓ | ⚠ review |
| 27 | `newseen` | `NEWSEEN` | ✓ | ⚠ 946 | ✓ | ✓ | ✓ 0 detected | ✓ | ⚠ review |
| 28 | `femseen` | `FEMSEEN` | ⚠ 247 | ⚠ 1152 | ✓ | ✓ | ✗ 4 pending | ✓ | ⚠ 2 null |
| 29 | `mouthwash` | `Multi Mouthwash` | ✓ | ⚠ 1216 | ✓ | ✓ | ✗ 4 pending | ✓ | ⚠ review |
| 30 | `dead-sea-water-compresses` | `Compressed Wipes` | ✓ | ⚠ 1098 | ✓ | ✓ | ✗ 2 pending | ✓ | ⚠ 1 null |
| 31 | `shower-gel-lord` | `Shower Gel ( LORD )` | ✓ | ⚠ 1108 | ✓ | — NV | ✗ 1 pending | ✓ | ⚠ 1 null |
| 32 | `lady-deodorant` | `Deodorant ( LADY )` | ⚠ 32 | ✓ | ✓ | ✓ | ✗ 1 pending | ✓ | ⚠ 1 null |
| 33 | `kiwi-deodorant` | `Deodorant ( KIWI )` | ✓ | ✓ | ✓ | ✓ | ✗ 1 pending | ✓ | ⚠ 1 null |
| 34 | `lord-deodorant` | `Deodorant ( LORD )` | ✓ | ✓ | ✓ | ✓ | ✓ 0 detected | ✓ | ⚠ 1 null |
| 35 | `face-soap` | `Facial Foam Soap` | ✓ | ⚠ 967 | — NV | — NV | ✓ 0 detected | ✓ | ⚠ review |
| 36 | `halo-pure-unisex-deodorant-stick` | `Unisex Deodorant Stick` | ✓ | ⚠ 965 | ✓ | ✓ | ✓ 0 detected | ✓ | ⚠ 1 null |
| 37 | `halo-shenseen-toothpaste` | `Shenseen Mousse Toothpaste` | ⚠ 250 | ⚠ 883 | ✓ | — NV | ✗ 3 pending | ✓ | ⚠ 1 null |
| 38 | `halo-gel` | `Shower Gel` | ⚠ 252 | ⚠ 1333 | ✓ | ✓ | ✓ 0 detected | ✓ | ⚠ review |
| 39 | `frequent-use-tonic-shampoo` | `Mineral Shampoo` | ⚠ 208 | ⚠ 1268 | ✓ | ✓ | ✗ 2 pending | ✓ | ⚠ review |
| 40 | `conditioner` | `Mineral Hair Conditioner` | ✓ | ⚠ 1313 | ✓ | ✓ | ✗ 1 pending | ✓ | ⚠ review |
| 41 | `lipstick-new` | `Mineral Lipstick` | ✓ | ✓ | ✓ | ✓ | ✗ 2 pending | ✓ | ⚠ 1 null |
| 42 | `beauty-mask-for-face` | `Recovering Mud Musk` | ⚠ 255 | ⚠ 1500 | ✓ | ✓ | ✗ 1 pending | ✓ | ⚠ review |
| 43 | `salts-camomile` | `Bath Salts with Camomile extract` | ⚠ 256 | ⚠ 1477 | ✓ | — NV | ✗ 3 pending | ✓ | ⚠ review |
| 44 | `salts-ylangylang` | `Bath Salts with Ylang Ylang, Patchouli & Anis Star Extract` | ⚠ 257 | ⚠ 1761 | ✓ | — NV | ✗ 1 pending | ✓ | ⚠ review |
| 45 | `salts-rosemary` | `Bath Salts with Rosemary, Eucalyptus & Thyme extract` | ⚠ 255 | ⚠ 1756 | ✓ | — NV | ✗ 2 pending | ✓ | ⚠ review |
| 46 | `salts-lavander` | `Bath Salts with Lavander extract` | ⚠ 257 | ⚠ 1611 | ✓ | — NV | ✗ 3 pending | ✓ | ⚠ review |
| 47 | `after-shave-lord` | `Eau De Parfume ( LORD )` | ⚠ 45 | ✓ | — NV | — NV | ✓ 0 detected | ✓ | ⚠ 2 null |
| 48 | `perfume-kiwi` | `Eau De Parfume ( KIWI )` | ✓ | ✓ | ✓ | — NV | ✓ 0 detected | ✓ | ⚠ 1 null |
| 49 | `perfume-lady` | `Eau De Parfume ( LADY )` | ✓ | ✓ | ✓ | — NV | ✓ 0 detected | ✓ | ⚠ 2 null |
| 50 | `parfum-faya` | `Eau De Parfume ( FAYA )` | ⚠ 256 | ✓ | — NV | — NV | ✓ 0 detected | ✓ | ⚠ 2 null |

Важно: `0 detected` не означает «approved»; это только отсутствие совпадения с текущими автоматическими правилами.

## Полный аудит страниц

| Маршрут | H1 | RU | RO | Claims/data | Итог |
|---|---|---|---|---|---|
| `/` | ✓ | ✓ | ✓ | Product snippets обходят gate | P0 |
| `/products` | ✓ | ✓ | ✓ | 37 товаров с pending claims; RO data quality | P0 |
| `/product/:slug` | ✓ | ✓ | Формально ✓ | Claims обходят gate; RO sections повреждены | P0 |
| `/about` | ✓ | ✓ | ✓ | Локальный approved status для текста не зафиксирован | P1 |
| `/about/company` | ✓ | ✓ | ✓ | Source traceability есть, editorial approval не зафиксирован | P1 |
| `/about/our-history` | ✓ | ✓ | ✓ | Даты/имена требуют owner approval | P1 |
| `/about/founders` | ✓ | ✓ | ✓ | Торговые имена сохранены | P1 |
| `/about/science` | ✓ | ✓ | ✓ | Нейтральный тон; source claim approval не зафиксирован | P1 |
| `/ourformula` | ✓ | ✓ | ✓ | Pending formula claims заменяются neutral fallback | ✓ технически |
| `/selection` | ✓ | ✓ | ✓ | Product copy/alt зависят от повреждённого RO dataset | P1 |
| `/contactus` | ✓ | ✓ | ✓ | `ru-MD` / `ro-MD` проходят до Telegram | закрыто |
| `/certificates` | ✓ | ✓ | ✗ | `/ro/certificates` runtime возможен, SEO/RO нет | P0 locale |
| `/editorial`, `/blog`, `/news` | ✓ | ✓ original | ✗ shell | Оригинал допустим, но `lang`/route обещают RO | P0 locale |
| Dynamic official routes | обычно ✓ | RU/original | ✗ кроме 6 overrides | 4 fetch errors; 126 routes без alternates | P1 |
| `/bad-request`, 404, Error Boundary | ✓ | ✓ | ✗ | Critical recovery UI не локализован | P0 locale |

## Gap-анализ румынского языка

| Область | Фактическое покрытие | Разрыв |
|---|---|---|
| UI resources | 34/34 RU и RO | 1 unused key; локальные copy objects распределены по компонентам |
| Продукты | 50/50 RO records | 13 ingredients null; 28 howToUse null; 50/50 требуют human editorial review |
| Категории | 5/5: Creme, Băuturi, Suplimente alimentare, Igienă, Parfumerie | ✓ |
| Company/formula | 6 company paths + 3 formula chapters | Approval/source registry для нового локального copy не связан с claims pipeline |
| Home/selection/contact | RU/RO UI реализован | Contact locale валидируется и доходит до Telegram; original privacy route сохраняет корректный language contract |
| Editorial/news | Контент разрешено оставить оригинальным | Нужны корректные language boundaries, а не ложный RO document |
| Certificates/errors | RU only | Нужна RO версия или запрет `/ro` для этих routes |
| Official pages | 137 source records | 4 error; большинство не имеет RO equivalent |
| SEO | 307 total: 120 RU, 60 RO, 127 default | 126 indexable routes без alternates; runtime/manifest locale coverage расходится |

## Контактная форма

| Элемент | RU | RO | Состояние |
|---|---|---|---|
| Заголовок/режим заявки | ✓ | ✓ | ✓ |
| Имя, фамилия, телефон, город | ✓ | ✓ | ✓ |
| Consultation mode/date/time | ✓ | ✓ | ✓ |
| Consent | ✓ | ✓ | ⚠ юридический approval остаётся P0-CONTACT |
| Validation errors | ✓ | ✓ client mapping | Server schema strings RU, известные ошибки локализуются client-side |
| Success/error/retry | ✓ | ✓ | ✓ только после Telegram response |
| Product context | ✓ | ✓ | ✓ SKU/slug/name; 2 SKU остаются NV |
| Locale в payload | `ru-MD` | `ro-MD` | ✓ |
| Moldova contacts | ✓ | ✓ | Телефоны/адрес совпадают с market SSOT |
| Email | International support | Suport internațional | ✓ корректно обозначен, не выдан за Moldova email |

## SEO и runtime content

- 307 manifest routes, 303 indexable, 4 noindex.
- Locale: 120 RU, 60 RO, 127 implicit/default.
- 56 title length violations; 38 description length violations.
- 115 descriptions смешивают RU title с английским generic fallback.
- 126 indexable routes не имеют locale alternates.
- 137 official page records; 4 fetch-error records с пустыми title/description.
- Старый `dist` не является доказательством актуального результата: он не содержит недавно добавленный `/ro/contactus`, поэтому перед релизом требуется новый clean build/prerender.

## Рекомендуемый порядок исправлений

1. **Claims gate:** применить field publishability ко всем product consumers; добавить regression tests для home/card/search/detail.
2. **RO editorial quarantine:** временно не индексировать RO product routes либо показывать только безопасный краткий neutral copy до проверки всех 50 записей.
3. **Locale route contract:** завести allowlist полноценно локализованных routes; оригинальные articles размечать языком контента; локализовать recovery UI.
4. **Application locale:** добавить locale в shared schema, server record и Telegram formatter.
5. **RO parser/content gate:** semantic fixtures, длина, fragment detection, section-boundary checks, отдельный claims sync для RO.
6. **Product editing:** разделить long description, benefits, ingredients и use; привести short/long к установленным диапазонам без выдумывания данных.
7. **SEO:** устранить English fallback, нормализовать длины, генерировать alternates только для реально существующих локалей.
8. **Docs SSOT:** перегенерировать release/page/project/content документы из текущих count reports.
9. **Source follow-up:** повторить batch live verification drnona.md, подтвердить 48 international cross-references и отдельно запросить SKU для двух Moldova-only products.

## Выполненные проверки

| Проверка | Результат | Интерпретация |
|---|---|---|
| `npm run typecheck` | PASS | TypeScript contract не нарушен |
| `npm run lint` | PASS | ESLint: 0 warnings/errors |
| `npm run test` | PASS | 22 files, 165 tests |
| `npm run content:validate` | PASS | Подтверждает форму данных, но не ловит описанные semantic RO defects |
| `npm run claims:validate` | PASS | Registry консистентен: 399 pending, 0 approved, 0 rejected; pending-поля не публикуются |
| `npm run seo:validate` | FAIL до fresh build | Manifest уже содержит 307 routes, а текущий ignored `dist` старее: отсутствуют новые locale pages и JSON-LD/alternate contracts не совпадают. Нужен clean build/prerender перед повторной SEO-проверкой |
| `npm run build` | FAIL | Остановлен на `typography:validate`: 0.78rem и 0.84rem в selection preview ниже обязательных 14px; prerender/SEO этапы после этого не выполнялись |

Проверки подтверждают главный вывод аудита: текущие automated gates хорошо ловят форму и типы, но зелёный результат не доказывает редакционную корректность или legal publishability.

## Критерий готовности текста

Румынская версия может считаться полной только когда на каждом `/ro/...` маршруте нет русского UI (кроме явно обозначенного оригинального материала), `html[lang]` соответствует преобладающему языку, все 50 продуктовых записей прошли human review, pending claims не публикуются, а server payload сохраняет выбранную локаль.
