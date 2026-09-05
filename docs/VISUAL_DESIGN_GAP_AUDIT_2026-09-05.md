# Dr. Nona: visual audit и направление refinement

Дата: 2026-09-05. База: `3800eb049d10e8fedd8c211bff3362ceaf5812d7`.

**Статус: аудит и предложение для обсуждения. Production UI не изменён.** Этот документ не заменяет [каноническую дизайн-систему](DESIGN_SYSTEM.md), не утверждает public copy и не меняет [release status](release-status.json). P0/P1 release blockers остаются открытыми.

## Вывод

Проблема текущего сайта — не отсутствие фирменного стиля. Mineral palette, Cormorant Garamond + Manrope, тёмные морские главы и композиция About уже создают узнаваемую основу. Основные слабости находятся между компонентами: фиксированные пустые строки в карточках, несогласованный оптический масштаб упаковок, слишком долгий путь к действию на мобильной PDP, переносы внутри слов в фильтрах и одинаковое кадрирование разных типов editorial assets.

Повторный запуск существующих `ui-ux-deep-audit` и `responsive-matrix` дал **82/82 passing E2E**. Это совместимо с обнаруженными проблемами: попадание элемента в допустимый диапазон размеров не доказывает хорошую композицию. Наличие предполагаемого пользователем бага не использовалось как доказательство.

Новых **P0 visual defects не установлено**. P1 ниже — приоритет исправления интерфейса внутри этого аудита, а не изменение классификации release blockers.

## Метод и покрытие

Проект запущен локально через `npm run dev -- --host 127.0.0.1 --port 5173`. Проверка: Playwright Chromium, реальные DOM/CSS, загруженные шрифты, прокрутка для lazy images/reveal. Исходные изображения и тексты не подменялись, кроме явно обозначенного временного stress-теста заголовка в DOM.

| Surface | Проверенные RU и RO адреса / состояние |
|---|---|
| Home | `/ru`, `/ro` |
| Catalogue | `/{locale}/products`, все 50 карточек при прокрутке |
| PDP: туба | `/{locale}/product/solaris-body-lotion` |
| PDP: длинное название, флакон | `/{locale}/product/salts-ylangylang` |
| PDP: коробка + флакон | `/{locale}/product/after-shave-lord` — фактическое имя Eau De Parfume (LORD) |
| PDP: широкая упаковка | `/{locale}/product/gonseen` |
| PDP: банка | `/{locale}/product/okseen` |
| Halo Complex | `/{locale}/ourformula` |
| About | `/{locale}/about` |
| History | `/{locale}/about/our-history` |
| Lord | `/{locale}/products?q=Lord` и Lord-блок на Home; отдельного Lord route в текущем UI нет |
| Selection | `/{locale}/selection`, 5 выбранных продуктов и отдельно empty state |
| Contact | `/{locale}/contactus`, начальный сценарий консультации |
| Editorial | `/{locale}/editorial` |
| Content detail | `/news/zoom-08-07-2026`, отдельно RU и RO shell; original-language материал остаётся русским |

**Основная матрица:** 16 surface/state × 2 locale × 9 viewport = **288 снимков**. Для каждой строки выше проверены все восемь запрошенных ширин и landscape:

| Width, CSS px | Height, CSS px | Наблюдение |
|---:|---:|---|
| 320 | 800 | Наиболее слабые переносы категорий и ширина текста selection |
| 375 | 812 | Карточки слишком высокие; мобильные crops и hero overlay |
| 430 | 932 | Переносы легче, но структура карточек остаётся разреженной |
| 768 | 1024 | Одноколоночная PDP со stage 549 px; слабая видимость упаковки в Home |
| 1024 | 768 | Desktop header помещается; 4 колонки каталога; editorial feature растянут |
| 1440 | 900 | Основной desktop: 5 колонок, слабое отличие card title от body |
| 1920 | 1080 | Контейнер ограничивает разрастание; пустота editorial feature сохраняется |
| 2048 | 1152 | Та же композиция внутри max-width; само ограничение ширины не дефект |
| 844 | 390 | Mobile landscape: header переключается корректно, PDP stage выше экрана |

**Дополнительные 70 состояний:** 32 при настоящем browser zoom 200%; 8 с длинным RU/RO заголовком; 10 открытых mobile menu; 8 открытых фильтров; 8 с выбранной категорией; 2 hover; 2 saved. Итого **358 основных проверенных состояний**, без подсчёта повторов и диагностических close-up.

Zoom установлен через Chromium extension `chrome.tabs.setZoom(2)` и проверен `getZoom`: физическое окно 1440×900, layout viewport 720×450, DPR 2. Финальные zoom-снимки — viewport-only. Это не CSS `zoom`, не просто DPR и не эмуляция 720 px без увеличения.

Long-text stress: «Подробная информация о составе и способе применения продукта» и «Informații detaliate despre compoziția și modul de utilizare a produsului», только вместо H1 в диагностическом DOM на 320/375/768/1024. Это административные тестовые строки, **не утверждённые тексты продукта**. Реальное длинное название соли, RO категории, RU/RO contact labels также проверены без подмены.

Визуальная проверка матриц охватывала первый полезный экран, а full-page обзоры — нижние секции и повторяющиеся компоненты. Точные замечания о переносах подтверждались снимками в исходном масштабе и DOM-размерами. Это не пользовательское исследование: увеличение конверсии и предпочтения аудитории здесь не измерены.

### Evidence и воспроизведение

Все runtime evidence находятся локально в `artifacts/design-audit-2026-09-05/` и намеренно исключены из Git согласно AGENTS.md:

- `index.html` — галерея с поиском по locale, surface и viewport; оригиналы открываются отдельно.
- `screens/{locale}-{surface}-{width}x{height}.png` — 288 baseline screenshots.
- `screens/{locale}-{surface}-zoom200.png` — 32 финальных viewport-снимка zoom.
- `measurements.json`, `details.json`, `extras.json`, `zoom-verified.json` — DOM evidence. Для zoom актуален `zoom-verified.json`; он заменяет ранние zoom-строки `extras.json`.
- `detail-*.png`, `annotated-*.png`, `sheets/` — close-up, аннотации и контактные листы.
- `capture.mjs`, `extras.mjs`, `zoom-viewport.mjs`, `details.mjs` — локальные диагностические скрипты; `existing-e2e.log` — результат 82 тестов.

Для воспроизведения достаточно запустить указанный route, выставить viewport из матрицы, дождаться шрифтов и прокрутить страницу. Для selection выбрать пять перечисленных продуктов. Ни заявка, ни email не отправлялись; состояние selection создавалось только в изолированном browser context.

**Исключённые артефакты измерения:** прямой запуск Vite вне npm lifecycle нарушал dev CSP; ранний снимок Home без прокрутки не активировал reveal; одна navigation race была повторена; один пустой снимок RO empty selection переснят. Полноразмерный Playwright capture при browser zoom обрезал правую половину, поэтому все 32 zoom-снимка повторены без `fullPage`. Эти случаи не выданы за дефекты production UI.

В baseline 288/288 геометрий нет document overflow. В финальном zoom измерении RU catalogue и Lord дают 721 px scrollWidth при 720 px viewport: небольшой выход края связан с тесной строкой категорий, см. G01. Это не основание объявлять весь сайт сломанным при zoom. Проверка выполнена в Chromium; физические iOS/Android, Safari и Firefox не проверялись в этом этапе.

## Design gap report

Severity: **P0** — критическая недоступность основного действия; **P1** — заметное препятствие распознаванию/выполнению основной задачи; **P2** — существенная слабость композиции или чтения; **polish** — локальная несогласованность. Reference principles подробно разобраны в [source analysis](visual-direction/SOURCE_STUDY.md).

### G01 · P1 · Категории распадаются на части слов

- **Surface / viewport:** catalogue и Lord, RU/RO, особенно 320/375; также тесная строка при 200% zoom, effective width 720.
- **Evidence:** `detail-category-ru.png`, `detail-category-ro.png`, `screens/ru-catalog-zoom200.png`. RU 320: «Все / проду / кты», «Пище / вые / добав / ки»; RO 375: «Suplime / nte / alimenta / re». `responsive.css` сначала задаёт 2 колонки, ниже переопределяет на 3; `overflow-wrap:anywhere`, count и gap отнимают место у слова.
- **Why:** корректно кликабельные кнопки превращаются в медленно распознаваемые фрагменты; одинаковая ширина получена ценой смысла названия.
- **Correction:** раскладка по доступной ширине полного label+count: 2 колонки на узком экране, при необходимости 1 для длинного label; на tablet перенос всей кнопки на следующую строку. Не уменьшать 14 px и не сокращать утверждённые названия автоматически.
- **Reference principle:** Hydrogen — контент определяет необходимую ширину; Saleor — явные responsive варианты. Конкретный Hydrogen min-width 355 px не переносить буквально.
- **Risk:** рост высоты control area; проверить first product visibility и filter state. **Files:** `src/styles/catalog.css`, `src/styles/responsive.css`, `src/pages/CatalogPage.tsx`.

### G02 · P1 · Mobile PDP слишком поздно показывает название и действие

- **Surface / viewport:** все 5 PDP, RU/RO, 375/768/844 landscape и 200% zoom; особенно длинная RU карточка Gonseen.
- **Evidence:** `screens/ru-pdp-gonseen-375x812.png`, `screens/ru-pdp-solaris-body-lotion-844x390.png`, `measurements.json`. На 375 stage 347 px; H1 Solaris начинается около y504, CTA около y1069; Gonseen CTA около y1225. На 768 stage 549 px; на landscape 844×390 stage 570 px, H1 около y745. Desktop 1440: Solaris CTA y566, Gonseen y699 — помещаются в 900 px.
- **Why:** пользователь проходит media, длинный вводный текст и highlights до действия. Landscape первый экран почти целиком занимает изображение, даже название ещё ниже.
- **Correction:** предложить порядок identity → ограниченный по высоте contain-stage → краткая проверенная вводная → существующая CTA → подробности; на коротком landscape использовать ограничение по высоте, а не только ratio. Цель для 375×812 — название, полная упаковка и CTA в первом экране либо не более чем после одного короткого скролла; для 844×390 — минимум название и доступный следующий шаг.
- **Reference principle:** Vercel Commerce — явный media/content budget; Medusa DTC — действие отдельным блоком от подробностей.
- **Risk:** изменение порядка чтения требует проверки keyboard/DOM order, canonical square-stage contract и нового design approval. Не удалять предупреждения ради CTA. **Files:** `src/pages/ProductPage.tsx`, `src/styles/product.css`, `src/styles/responsive.css`.

### G03 · P2 · Карточка разрежена на mobile и типографически слаба на desktop

- **Surface / viewport:** catalogue, Lord, related products; RU/RO, 320–2048.
- **Evidence:** `detail-category-ru.png`; `screens/ru-catalog-1440x900.png`; `sheets/ro-pdp-gonseen-full.jpg`. RU 320: однострочный Solaris H2 имеет высоту **69.03 px** при font 18.56/line 23.76. Общий heading `height:2.5em`, mobile `3.72em`; описание сохраняет `height:4.65em`. Обнуление `min-height` не обнуляет `height`. На 1440 title около **16.13 px** serif против body 15 px. Каталог 375 при 50 товарах занимает около **29.8 тыс. CSS px**.
- **Why:** изображение, название и действие выглядят отдельными островами. Desktop serif title почти теряется среди служебных labels; equal-height решает baseline, но создаёт пустые строки даже в single-column list.
- **Correction:** natural height текста в single-column; выравнивать actions только внутри desktop row; card title 20–22 px Cormorant с нормальным переносом; уменьшить вертикальные резервы. Кандидат: 4 более читаемые колонки внутри 1392 px вместо 5, проверить рядом с вариантом 5×увеличенный title.
- **Reference principle:** Solace — image и caption образуют единицу; Saleor — shared card geometry; не копировать truncation product identity.
- **Risk:** потеря ровных desktop baselines, ухудшение быстрого сравнения при чрезмерном уменьшении плотности. **Files:** `src/components/ui.tsx`, `src/styles/components.css`, `src/styles/catalog.css`, `src/styles/responsive.css`.

### G04 · P2 · Оптический масштаб упаковок не согласован

- **Surface / viewport:** catalogue first rows, related grid, пять PDP; особенно 1024/1440/1920.
- **Evidence:** `screens/ru-catalog-1440x900.png`, `screens/ru-pdp-gonseen-1440x900.png`, `screens/ru-pdp-okseen-1440x900.png`. Банки визуально тяжелее узких туб; коробка чая занимает существенно меньше высоты square-stage. Равный box/ratio не создаёт равной воспринимаемой массы объекта.
- **Why:** некоторые продукты выглядят второстепенными только из-за силуэта и пустоты исходника. Stage доминирует над небольшим объектом.
- **Correction:** оптическая проверка групп «туба / банка / широкая коробка / комплект», safe padding и допустимый диапазон occupied area; использовать существующий `catalogScale` только после просмотра всего силуэта. PDP сохранять `contain`, stage ограничивать отдельно от изображения. Точные значения масштаба назначать после asset-by-asset QC, не общей формулой.
- **Reference principle:** Vercel Commerce `object-contain`; Shopware explicit image display modes.
- **Risk:** scale может обрезать упаковку; увеличение слабого исходника снижает резкость. Никакой AI-реконструкции или замены официальных файлов. **Files:** `src/components/ProductImage.tsx`, `src/components/ui.tsx`, `src/styles/components.css`, `src/styles/product.css`, `src/data/products.json` (только если позже одобрен optically checked scale).

### G05 · P2 · Home hero теряет объект при адаптации

- **Surface / viewport:** home RU/RO, 320/375/430/768 и landscape.
- **Evidence:** `detail-hero-tablet.png`; `screens/ru-home-375x812.png`. На 768 белый gradient почти стирает банку; на mobile benefits rail закрывает часть этикетки. На широком desktop текст и объект разделены значительно лучше.
- **Why:** композиция исходного растрового hero рассчитана на другой crop; поверх неё независимо расположены gradient и HTML rail. Важный объект оказывается под маской или панелью.
- **Correction:** задать безопасную область объекта для каждого layout; вывести rail из зоны упаковки; сместить/ограничить mask так, чтобы она обслуживала только текст. При нехватке высоты перейти к последовательным text/media/benefits зонам с тем же исходником.
- **Reference principle:** Solace — разделение image и editorial text; Vercel — явные, устойчивые media areas.
- **Risk:** ослабление mask может снизить contrast текста; увеличение hero height усугубит scrolling. **Files:** `src/pages/HomePage.tsx`, `src/styles/home.css`, `src/styles/responsive.css`.

### G06 · P2 · Открытое mobile menu просвечивает несколькими слоями текста

- **Surface / viewport:** header/menu RU/RO, 320/375/430/768/844.
- **Evidence:** `detail-menu-ru.png`, повторный viewport capture после 1200 ms; `screens/ro-menu-375.png`. Под навигацией видны Halo headline и benefits. Panel background `rgba(...,0.9)`; наличие `backdrop-filter` в CSS не устранило двойной текст в проверенном Chromium.
- **Why:** навигация выглядит временным полупрозрачным слоем поверх другого интерфейса. Чтение ссылок конкурирует с текстом страницы.
- **Correction:** непрозрачная mineral surface у открытого menu; сохранить деликатную прозрачность только у закрытого sticky header. Ясные active/focus states и один уровень разделителей.
- **Reference principle:** Hydrogen aside / Solace navigation — самостоятельная поверхность для навигации.
- **Risk:** проверить stacking, scroll lock и reduced motion; не менять пункты и маршруты. **Files:** `src/styles/shell.css`, `src/styles/responsive.css`, `src/app/AppShell.tsx` (если потребуется структура; проверить фактический shell owner перед implementation).

### G07 · P2 · Editorial feature создаёт необоснованное пустое поле

- **Surface / viewport:** editorial RU/RO, 1024/1440/1920/2048.
- **Evidence:** `detail-editorial.png`, `sheets/ru-editorial-full.jpg`. Первый `.article-card` занимает `grid-column:span 2; grid-row:span 2`, но содержимого под изображением меньше, чем высота двух соседних карточек. Большая нижняя часть остаётся белой.
- **Why:** размер feature обещает большой материал, фактический контент заканчивается в верхней половине. Визуальный акцент определяется grid span, а не содержанием.
- **Correction:** featured row самостоятельной высоты плюс короткий news list рядом; следующая группа начинается сразу после реального содержимого. Сохранить один выраженный feature, но убрать зависимость от двух автоматически растянутых рядов.
- **Reference principle:** Vercel explicit mosaic tracks; Solace чередование large image / compact captions.
- **Risk:** не менять порядок/приоритет публикаций без approval; pagination/sort не добавлять. **Files:** `src/styles/content.css`, `src/styles/components.css`, `src/features/editorial/EditorialPages.tsx`, `src/components/ArticleCard.tsx`.

### G08 · P2 · Один crop применяется и к афишам, и к портретам

- **Surface / viewport:** editorial cards/article, About; RU/RO, 320/375/430; About history/founders также desktop.
- **Evidence:** `screens/ru-article-320x800.png`, `screens/ru-editorial-320x800.png`, `sheets/ro-about-full.jpg`. На афише Zoom при узком crop теряется часть даты; secondary cards показывают обрезанные надписи. В About «Наука и технологии» mobile strip обрезает лицо выше рта, портреты истории/основателей частично срезаны.
- **Why:** raster text — часть информации, а лицо — композиционный центр. `cover` и низкая одинаковая высота не учитывают тип asset.
- **Correction:** афиша — contain/естественный ratio и нейтральное поле; портрет — осмысленный focal point и достаточная высота; атмосферное фото — cover. Не считать декоративный crop универсальным.
- **Reference principle:** Shopware displayMode distinction; Solace gallery использует разные ratio по роли изображения.
- **Risk:** потребуется asset classification, а для неизвестного focal point — ручная проверка; не дорисовывать/не менять текст афиши. **Files:** `src/components/ArticleCard.tsx`, `src/features/editorial/EditorialPages.tsx`, `src/features/about/AboutPages.tsx`, `src/styles/components.css`, `src/styles/content.css`, `src/styles/about.css`, `src/styles/responsive.css`.

### G09 · P2 · Selection затрудняет сверку длинных названий

- **Surface / viewport:** selection с пятью товарами, RU/RO, 320/375; на desktop 1440–2048 — противоположная разреженность.
- **Evidence:** `screens/ru-selection-320x800.png`, `screens/ro-selection-375x812.png`, `screens/ru-selection-1440x900.png`. Media + delete button оставляют узкую середину; `line-clamp:2` скрывает часть длинного salts name, SKU pill переносится. Desktop media 160 px, row min-height 192 px; delete далеко справа, следующий шаг после пяти рядов.
- **Why:** подборка предназначена для сверки идентичности, а важное различие названия скрыто. На широком экране длинное горизонтальное движение глаза не добавляет информации.
- **Correction:** полное название с естественной высотой; mobile thumbnail 72–88 px как кандидат; SKU обычной строкой; desktop list ограниченной ширины с существующим handoff блоком рядом, если хватает места. Empty state сохраняется.
- **Reference principle:** Saleor отдельный prose/content width; Solace container roles.
- **Risk:** не менять состав сохраняемых данных, persistence, copy/email payload и review-before-send flow. **Files:** `src/pages/SelectionPage.tsx`, `src/styles/selection.css`, `src/styles/responsive.css`.

### G10 · P2 · Editorial summaries не помогают отличать материалы

- **Surface / viewport:** editorial и article, RU/RO, все размеры.
- **Evidence:** `sheets/ru-editorial-full.jpg`, `screens/ro-article-1440x900.png`: один общий английский рекламный description повторяется у новостей о Zoom, юбилее, мероприятиях и статей. Это фактический текст из текущего content pipeline, а не предложенная копия.
- **Why:** визуально одинаковые серые абзацы образуют шум; дата и title — почти единственные различители. Шаблонное ощущение нельзя устранить перестановкой card borders.
- **Correction:** отдельная editorial-review задача: получить source-backed summaries или после approval не показывать бесполезный общий excerpt. Визуальный шаблон должен аккуратно работать без summary. Русский original-language article не выдавать за перевод на RO.
- **Reference principle:** Solace — минимальный caption с реальной информационной ролью; не заполнять пустоту generic copy.
- **Risk:** **content approval required**; не писать переводы, claims или новые descriptions в рамках redesign. **Files:** `src/components/ArticleCard.tsx`, `src/features/editorial/EditorialPages.tsx`, `src/claims.ts`, `src/data/official-pages.json` (только отдельный одобренный content этап).

### G11 · P2 · PDP layout плохо переносит разную полноту approved content

- **Surface / viewport:** прежде всего RU/RO Gonseen и Solaris, 375/768/1440.
- **Evidence:** `sheets/ru-pdp-gonseen-full.jpg` и `sheets/ro-pdp-gonseen-full.jpg`. RU synopsis/highlights дублируются в нижних info cards. В RO CTA выше, но нижний заголовок «Descriere, compoziție și utilizare» соседствует только с кратким «Despre produs». Причина отсутствующих полей — публикация/quarantine, не доказанный layout bug.
- **Why:** RU выглядит многословным, RO — незавершённым в тех же фиксированных областях. Обещание section title шире фактического содержимого.
- **Correction:** один полный текст каждого поля; верхняя зона — только полезная краткая вводная. Секции строятся из реально разрешённых полей. Изменение видимого заголовка требует source/editorial approval; без него изменить лишь geometry, не наполнять пустоту.
- **Reference principle:** Medusa DTC разделяет info/actions, Saleor скрывает gallery chrome при единственном изображении — интерфейс соответствует реальному объёму данных.
- **Risk:** P0-LOCALE/P0-CONTENT не закрывать программно; все medical/wellness ограничения сохраняются. **Files:** `src/pages/ProductPage.tsx`, `src/styles/product.css`, `src/styles/responsive.css`; publication logic только как dependency, не цель изменения.

### G12 · P2 · Halo повторяет композиционный приём и содержание

- **Surface / viewport:** Halo RU/RO, 768/1024/1440 и mobile full page.
- **Evidence:** `sheets/ru-halo-full.jpg`, `sheets/ro-halo-full.jpg`: triad в тёмном hero и следующая последовательность крупных круглых иконок повторяют те же темы, но не создают заметного нового уровня чтения.
- **Why:** одинаковые icon + heading + short body конструкции делают короткий материал длиннее без сопоставимого прироста информации.
- **Correction:** один вводный тезис и три главы с разным ритмом: крупный индекс, короткий текст, разделитель; использовать только имеющийся разрешённый материал. Сохранить тёмное вступление и морскую тему.
- **Reference principle:** Solace чередует полное изображение, короткую вводную и асимметричную группу; ритм зависит от роли секции.
- **Risk:** не добавлять научные диаграммы/доказательства/claims для заполнения главы. **Files:** `src/styles/formula.css`, `src/pages/FormulaPage.tsx`, `src/styles/responsive.css`.

### G13 · polish · Несогласованная визуальная иерархия navigation/actions

- **Surface / viewport:** desktop header 1024–2048, catalogue/PDP/selection все размеры.
- **Evidence:** `screens/ru-catalog-1440x900.png`: тёмный CRM pill с тенью сильнее ссылок каталога/подборки. На card save — сердце, на PDP и в header — bookmark для одной selection-механики. При 320 часть card CTA остаётся только иконкой.
- **Why:** внешняя служебная функция получает сильный акцент; одна пользовательская сущность выглядит как две разные функции.
- **Correction:** сохранить CRM вход, но визуально сделать utility; единый bookmark, одинаковая толщина/размер и ясные saved/focus состояния. Не копировать cart icon из storefront references.
- **Reference principle:** Saleor/Solace отделяют primary navigation от utilities.
- **Risk:** сохранить aria-label, hit area ≥44 px, внешнюю ссылку и все состояния; изменение названий не входит в этап. **Files:** `src/components/ui.tsx`, `src/styles/shell.css`, `src/styles/components.css`, фактический shell component.

### G14 · polish · Contact scenarios получают случайную иерархию на mobile

- **Surface / viewport:** contact RU/RO, 320/375/430.
- **Evidence:** `sheets/ru-contact-full.jpg`, `sheets/ro-contact-full.jpg`: три равноправных сценария превращаются в 2 сверху + один на всю ширину снизу.
- **Why:** перенос делает третий сценарий похожим на отдельный уровень. Tall form также растягивает почти пустую вводную колонку desktop.
- **Correction:** на узком экране три одинаковые строки выбора; desktop компактный intro сверху либо align-start без необходимости визуально заполнять всю высоту формы.
- **Reference principle:** Hydrogen — предсказуемое перестроение control layout по breakpoint, без декоративного равенства высот.
- **Risk:** оставить все поля, валидацию, consent, сценарии и порядок отправки; никаких новых шагов/сокращений формы без решения владельца. **Files:** `src/features/contact/ApplicationForm.tsx`, `src/styles/contact.css`, `src/styles/responsive.css`.

## Что проверено и НЕ признано дефектом

- Все пять packshot PDP целиком помещаются в stage; комплект LORD сохраняет коробку и флакон. Универсальный clipping или «сломанный ratio» не подтверждён.
- Main H1 на реальных длинных PDP и в synthetic RU/RO stress остаётся читаемым. Не найдено оснований уменьшать все заголовки или менять шрифт глобально. Плохие переносы подтверждены прежде всего в фильтрах и узкой selection.
- На 1024 RU/RO desktop navigation помещается, а на 768/844 действует mobile menu. Проблема menu — поверхность, не сам breakpoint switch.
- Header, основной container и повторяемые desktop sections в целом выровнены. Массовых случайных x-offset и «прыгающих baselines» не установлено; есть локальные G03/G07/G09.
- Home и About уже содержат разные композиции; утверждение «везде один card template» слишком сильное. Повтор особенно заметен в Halo и editorial summaries.
- Empty selection, filters, saved feedback и hover работают. Не вводить новую логику ради декоративного redesign.
- Разная длина RU/RO PDP связана с approved content availability; это не разрешение переводить/дополнять состав и применение.
- Ограниченный container на 1920/2048 полезен для чтения; широкие внешние поля сами по себе не «лишний whitespace».
- History wave/timeline имеет смысл и читается; его упрощение — необязательный polish, не top-priority defect.

## Top 10 и наибольший impact

Top 10 реальных weaknesses: **G01, G02, G03, G04, G05, G06, G07, G08, G09, G10** в порядке описания выше. G11/G12 — следующие кандидаты, G13/G14 — polish.

Top 5 изменений по ожидаемому visual impact (оценка дизайна, не измеренная конверсия):

1. **Catalogue foundation:** читаемые категории + естественная высота mobile card + заметный title, G01/G03.
2. **PDP first viewport:** перераспределение media/content и CTA, адаптация к реальному объёму разрешённых полей, G02/G11.
3. **Image discipline:** оптический масштаб packshot, безопасная зона hero, отдельное поведение poster/portrait/photo, G04/G05/G08.
4. **Editorial composition:** feature по содержимому, меньше повторяющихся обёрток, G07/G10/G12; content approval отдельно.
5. **Navigation clarity:** непрозрачное menu и согласованные selection actions, G06/G13.

## Что сохранять

Логотип и золото как редкий brand accent; mineral/sea palette; Cormorant + Manrope; тёмные морские главы Home/Halo/Lord; официальный image identity; complete packaging; информационный каталог без цен/корзины/покупки; подборку с проверкой перед передачей; RU/RO routes и original-language editorial; контентный quarantine; 14 px minimum informative type, видимый focus, reduced motion, 44 px controls; ограниченный desktop container и спокойные outer margins.

## Предлагаемый implementation order

1. **Согласовать direction**, не весь сайт: две сравнительные композиции catalogue и PDP на 375/768/1440 с существующим текстом/asset. Подробные параметры — в [proposal brief](visual-direction/TARGET_DIRECTION.md).
2. **Category/card primitive:** G01/G03, затем 50-card contact sheet и RU/RO visual QA. Убирать конфликтующие fixed heights, а не добавлять очередной cascade override.
3. **PDP и imagery:** G02/G04/G11; проверить пять разных силуэтов, длинное название, пустые approved fields, landscape и реальный 200% zoom.
4. **Header/selection:** G06/G09/G13 с keyboard, persistence и review-before-send regression checks.
5. **Home/Halo/editorial/About:** G05/G07/G08/G12. G10 — отдельная редакторская очередь; не делать публикацию машинного текста частью visual PR.
6. **Contact polish и финальная согласованность:** G14, motion/surfaces, затем полная RU/RO viewport matrix и ручная оценка композиции. Release gates остаются самостоятельными.

Каждый implementation PR — один bounded surface/component, before/after на одинаковом content и viewport. Сначала пересмотреть существующий контракт и получить согласование затрагиваемых public flows/copy; этот аудит сам по себе не является разрешением на их изменение.

## Проверки этого этапа

Повторно: 82 E2E из двух существующих audit/responsive suites прошли. Repository/documentation validation, architecture validation, typecheck, lint, 144 unit tests (20 файлов) и production build прошли. Документационная проверка подтверждает 27 Markdown files и 8 синхронизированных release blockers. Существующие исторические QA counts не подменяются этими текущими результатами.

Имена новых companion documents адаптированы к repository hygiene: `SOURCE_STUDY.md`, `TARGET_DIRECTION.md`, `IMPLEMENTATION_BRIEF.md`. Старые legacy research filenames запрещены текущим валидатором; правило не ослаблялось. Runtime screenshots и клоны остаются в ignored artifacts, а выводы и immutable source links — в docs. В этом этапе не выполнялся production deploy и не менялись release approvals.
