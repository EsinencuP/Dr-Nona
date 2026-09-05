# Visual system refinement — Dr. Nona Moldova

Дата: 2026-09-05. База сравнения: `3800eb049d10e8fedd8c211bff3362ceaf5812d7` и рабочее дерево до этого этапа. Основание: [Prompt 1: visual gap audit](VISUAL_DESIGN_GAP_AUDIT_2026-09-05.md). Канонические правила обновлены в [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

Выполнен refinement существующей системы: типографическая иерархия, semantic colors, spacing, поверхности, состояния и CSS motion. Шрифты, брендовые цвета, продуктовые изображения и контейнер сохранены. Переводы, публичные тексты, ассортимент, маршруты, порядок PDP и транспорт формы не изменялись. Новых зависимостей нет. Production approval не предоставляется: остаются 8 существующих release blockers.

## Решение по шрифтам

**Cormorant Garamond + Manrope остаются.** Контрастный serif соответствует editorial/mineral характеру и сдержанному золоту марки. Замена не устранила бы реальные проблемы: слишком мелкое название товара, фиксированные слоты текста и чрезмерно тесный tracking.

Latin, Cyrillic и Romanian работают в существующих локальных файлах. В браузерном specimen проверены `Аа Бб Дд Жж Щщ Ыы Ээ Юю Яя`, `Ăă Ââ Îî Șș Țț` и смешанная строка Manrope. CDP `CSS.getPlatformFontsForNode` подтверждает custom Cormorant для обеих display-строк и custom Manrope для body; системного fallback в этих образцах нет. Имена PostScript в variable-font metadata не следует интерпретировать как фактический CSS weight. Проверка глифов не является редакторским одобрением переводов.

Одинаковое покрытие не означает одинаковую плотность текста: Cyrillic образует более плотные прямоугольные строки, а длинные Romanian подписи требуют места для слов и диакритики. Поэтому сохранены отдельные проверки двух локалей, а не только Latin screenshot.

| Роль | Решение |
|---|---|
| Крупные brand/editorial headings | Cormorant 600; мягче tracking, balanced wrapping |
| Название товара | Cormorant 600, 22–24 px, line-height 1.25, естественная высота, pretty wrapping |
| Body и инструкции | Manrope 400, shared 16 px / 1.65; PDP paragraph measure до 64ch |
| Labels, SKU, категории, controls | Manrope; информативный минимум 14 px сохраняется |
| Success/error heading | Manrope 18 px вместо мелкого serif |

Serif ухудшает чтение в длинных инструкциях, мелких метаданных и плотных статусах: туда он не переносится. Шесть WOFF2 subsets и их loading strategy не менялись. До/после есть также для диагностического type specimen.

## Color и surface hierarchy

Mineral Light сохранена. `--bg`, `--surface`, `--surface-raised`, `--text-primary`, `--text-secondary`, `--border`, `--border-strong`, `--action`, `--action-hover`, `--focus`, `--premium-accent`, success/error roles определены в `base.css`; значения и назначение приведены в каноническом документе.

Главное изменение — разделение декоративного separator и границы интерактивного поля. `--border-strong: #738e96` используется для inputs; pale `--line` остаётся спокойным divider. Primary hover теперь темнее исходного action, а не ярче. Gold для читаемого акцента использует `--gold-800`; botanical остается редким. Footer и Lord сохраняют свой bounded dark treatment.

Typography validator теперь разрешает semantic aliases и проверяет 14 дополнительных контрастных пар: primary/secondary, action/hover, controls, focus, premium accent, success/error и Lord muted/gold. Muted text: 5.48:1 на paper, 5.71:1 на white, 5.20:1 на mist, 4.92:1 на sea-050. Focus indicator: минимум 8.02:1 среди проверяемых пар. Decorative border не объявляется соответствующим требованию 3:1 для control boundary.

Каталог и editorial используют ограниченную image stage и подпись на фоне страницы. PDP information blocks разделены правилами и отступами. Forms и filters сохраняют tonal grouping. Shadows остаются у toast и перекрывающего hero rail; обычные карточки перестали выглядеть поднятыми над страницей. Световые кольца существующих mineral/science иллюстраций не превращены в универсальный card style.

## Review: Before / After / Why

| Before | After | Why |
|---|---|---|
| G01: категории на mobile разбивались внутри слов; при 720 px слишком тесно | Две mobile колонки, целые слова, адаптивная минимальная ширина desktop chip | RU/RO label и count можно прочитать вместе |
| G03: фиксированные слоты заголовка/описания и крошечный serif | Название 22–24 px без title clamp, естественная высота; shared row height | Сначала читается идентичность товара; baseline действий сохраняется |
| Белая карточка вокруг изображения и всей подписи, частые тени | Frame принадлежит image stage; copy лежит на page surface | Иерархию создают изображение и type, а не повторяющиеся коробки |
| G06: текст hero просвечивал через mobile menu | Непрозрачная mineral surface, короткий enter/exit | Навигация визуально отделена от страницы |
| G07: первая editorial карточка занимала два ряда и создавала пустоту | Сохранён span по двум колонкам, удалён span второго ряда | Убирает провал без нового шаблона или перестановки материалов |
| PDP composition/usage выглядят как независимые панели | Rule, 24 px padding, paragraph measure | Читаются как части одного документа |
| G13: heart в product save и bookmark в header; CRM самый тёмный control | Единый bookmark; CRM тихая utility-ссылка | Более последовательная навигационная иконография и salience |
| Inputs со слабой границей; ссылки на неопределённые sea tokens | Semantic control border/focus/error; исправлены undefined token references | States остаются читаемыми и предсказуемыми |
| Consent error наследовал fullscreen `.application-error` и занимал 812 px на mobile | Собственный `.application-form__error`, высота 39.2 px на 375×812, прежние text/ARIA/id сохранены | Field error больше не получает layout application error boundary |
| G14: два сценария формы в первом ряду, третий отдельно | На mobile три одинаковые полные строки | Одинаковый вес режимов и место для длинных RU/RO подписей |
| Dashed empty card; чрезмерно крупный pale 404 | Спокойные separators, bookmark/recovery action, читаемый gold 404 | Состояния выглядят частью бренда и сохраняют понятный следующий шаг |
| Разрозненные transition timings, 22 px reveal, layout animation фильтров | 140/220/420 ms vocabulary; 10 px reveal; только visual transition фильтров | Обратная связь быстрее и не двигает соседние элементы во время анимации |

Две регрессии пойманы и исправлены во время реализации. Border image stage изменял его внутреннюю геометрию на 2 px — заменён inset outline. Естественная высота текста нарушила существующий contract одинаковых action offsets — добавлены одинаковые grid rows, вычисляемые по содержимому. Исходные assertions сохранены; заголовки снова не обрезаются ради прохождения теста.

## Motion vocabulary и reduced motion

| Категория | Реализация | Reduced motion |
|---|---|---|
| Navigation / locale / underline | 140 ms; color и underline state | Состояние появляется сразу |
| Button, save, chip, toggle | 140 ms; color/border, restrained press | Без press displacement; label/state сохраняются |
| Card hover | 220 ms; обычно border, редко 1 px lift на home/About | Без lift |
| Image hover | Небольшой scale editorial media; catalogue packshot не увеличивается сверх `catalogScale` | Без hover displacement |
| Content reveal | Opacity + translateY 10 px, 420 ms, delay до 100 ms | Контент сразу видим, delay 0 |
| Mobile panel | Opacity + 6 px translate, 220 ms | Мгновенный доступ к содержимому |
| Route transition | Не добавлена: доказанной пользы для текущего каталога нет | Обычная смена route |

Нет heavy animation library, layout-property transition или нового clip-path animation. Статичная timeline line заменяет декоративную stroke-анимацию. Функциональный loading ring сохраняет 700 ms rotation только во время загрузки; при reduced motion он статичен, текст состояния остаётся.

Дополнительно исправлен CSS cascade: desktop hover перекрывал press transform primary button. Active feedback теперь имеет правильный порядок внутри hover media; reduced-motion правило отменяет displacement. Это проверено удержанием pointer down, а не только чтением деклараций.

## Evidence и воспроизведение

Локальные runtime evidence находятся в игнорируемом `artifacts/visual-system-2026-09-05/`; они не предназначены для Git или production. Семь согласованных catalogue PNG в `tests/e2e/responsive-matrix.spec.ts-snapshots/` являются versioned test fixtures, а не runtime reports.

- `comparison.html`: интерактивное сравнение 41 пары — 9 страниц × RU/RO × 375/1440 px, оба mobile menu, оба input focus, один type specimen.
- `compare-ru-catalog-1440.png`, `compare-ru-catalog-375.png`, `compare-ru-editorial-1440.png`, `compare-ru-menu.png`, `compare-ro-contact-375.png`: компактные сравнения до/после.
- `before/measurements.json`, `after/measurements.json`, оба `fonts.json`: viewport, document dimensions, реальный font rendering.
- `zoom-verified.json` и `screens/`: 32 дополнительных состояния при настоящем browser zoom 2, физический viewport 1440×900 → 720×450 CSS px, devicePixelRatio 2. Home, catalogue, 5 PDP, Halo, About, History, Lord filter, selection/empty, contact, editorial и original-language article в двух locale contexts. Ни горизонтального document overflow, ни broken images в этих состояниях.
- `states/`: реальный Suspense loader RU/RO с обычным и reduced motion (искусственно задержан только ответ route module); consent-error до/после. `a11y-ro.json`: отдельные axe результаты 9 RO routes × 375/1440 px.
- `capture.mjs`: `node artifacts/visual-system-2026-09-05/capture.mjs before` или `after` на локальном server 5173. Не запускать `before` после реализации для восстановления исходного вида: первоначальные PNG уже сохранены.

Before/after full-page capture ждёт fonts, проходит страницу для загрузки media/reveal, затем снимает текущий CSS без stylesheet overrides. В отличие от этого, некоторые существующие E2E suites принудительно отключают анимацию — поэтому их green status не использовался как доказательство визуального качества.

Пример измеряемого результата: RU editorial 1440 px уменьшился с 3863 до 3398 px высоты после удаления пустого ряда. RU catalogue 375 px — с 29764 до 26869 px, несмотря на увеличение названий. На desktop каталог практически той же высоты: 6283 → 6302 px; это осознанный компромисс полного заголовка и одинаковых action baselines, а не обещание экономии пространства в каждом viewport.

## Verification

| Проверка | Результат |
|---|---|
| `repository:validate` | PASS; документация, style/source boundaries и release state согласованы |
| `architecture:validate` | PASS; App 17 строк, 1 eager route / 16 lazy page modules |
| `typography:validate` | PASS; 12 stylesheets, минимум 14 px, 14 semantic contrast pairs |
| `typecheck`, `lint` | PASS |
| `test` | 144 passed, 20 test files |
| `build` | PASS, включая встроенные content/claims/security/SEO/performance budget gates; это не полная performance optimization |
| Полный `test:e2e` | 290 passed, 18 предусмотренных skips повторных viewport/composition матриц в mobile project; deep UI, responsive, typography, axe и функциональные suites включены |
| После финальных hover/consent исправлений | 44 targeted E2E passed: contact application, visual foundation и accessibility; также повторены typecheck/lint/unit/build |
| Дополнительный axe RO | 18 состояний: 9 routes × 375/1440 px, 0 violations; `aria-prohibited-attr` и `color-contrast` содержат incomplete/manual-check результаты, поэтому это не заявление о полной WCAG conformance |
| Before/after | 41 пара; 7 catalogue visual fixtures обновлены после просмотра результата, assertions не ослаблены |
| Responsive | Основная suite: 320/375/430/768/1024/1440/1920 и 844×390 landscape; новые RU/RO category tests дополнительно включают 720 и 2048 px |
| Настоящий 200% zoom | 32 состояния, 720×450 CSS viewport, без document overflow и broken images |

Новые regression checks проверяют фактическое размещение category labels/counts, opaque mobile panel, Escape, отсутствие reveal delay/displacement при reduced motion, pointer-down feedback кнопки и компактность consent error. Они не заменяют визуальное сравнение. Локальные logs находятся рядом с screenshots; они не коммитятся.

## Self-critique: что всё ещё выглядит как generic template?

Первая итерация всё ещё имела пустой editorial span и неравновесный mobile form switch. Оба участка доработаны в этом этапе. Излишняя boxed composition уменьшена на catalogue, editorial, PDP и empty states.

Остаются содержательные и композиционные ограничения из Prompt 1:

- Одинаковые English editorial summaries продолжают создавать template feeling. CSS не заменяет содержательную редактуру; тексты и переводы в этом этапе запрещены.
- Некоторые news covers плохо подходят к текущему crop. Публичные assets не подменялись; здесь нужна отдельная media/content работа.
- Home hero overlay и повторяющиеся Halo explanations требуют отдельного решения о композиции и тексте. Текущие изменения не выдаются за завершённый hero redesign.
- Короткая и длинная PDP copy по-прежнему дают разное положение CTA, особенно на mobile. Порядок информационной архитектуры не менялся.
- В первой итерации каталога оставалась пустота под короткими названиями из-за равной высоты всех rows. Это доработано в продолжении «Закрытие частично исправленных пунктов» ниже: выравнивание действий теперь ограничено соседями внутри одного ряда.
- About chapter panels по-прежнему выглядят как навигационные карточки. Их роль — переход между главами; уменьшена тень, но не выполнена механическая замена всех panels на один новый pattern.

Эта работа улучшает визуальную основу, но не закрывает все gaps Prompt 1. Product optical normalization (G04), PDP first-useful-viewport (G02), hero composition (G05), editorial asset cropping (G08), source/content issues (G10–G12) остаются отдельными задачами. Selection title truncation (G09) устранена в продолжении ниже.

## Продолжение: selected-product typography

После команды пользователя «продолжи» выполнена ограниченная доработка заполненной подборки. Реальные названия `Bath Salts with Ylang Ylang, Patchouli & Anis Star Extract` и `Bath Salts with Rosemary, Eucalyptus & Thyme extract` визуально обрезались, скрывая различия между позициями.

| Before | After | Why |
|---|---|---|
| Название ограничено двумя строками, leading 1.08 | Полное название, natural height, 22–32 px / 1.25, measure 44ch | Можно сверить выбранный вариант без перехода на PDP |
| Центрирование media/copy/remove при разной высоте | Общий верхний край; mobile gaps 8 px | Длинные строки читаются последовательнее, кнопка не прыгает по вертикали |
| SKU в отдельной заливке-pill | Спокойная строка metadata с tabular numbers | Артикул не выглядит интерактивным chip |
| Remove без согласованного feedback | 44 px target, semantic border, 140 ms hover/press, reduced-motion equivalent | Состояние действия соответствует остальной системе |

Первая итерация сделала desktop название слишком мелким и узким. После визуальной самокритики scale расширен до 32 px, measure — до 44ch. На 320 px длинные названия всё равно занимают несколько строк: это осознанный компромисс полного имени и сохранённых размеров media/controls. Подборка стала длиннее; уменьшение скролла здесь не заявляется.

Evidence: `artifacts/visual-system-2026-09-05/selection-polish/`. Исходный и итоговый capture: по 18 состояний, RU/RO × 320/375/430/768/1024/1440/1920/2048 и 844×390 landscape, пять наиболее длинных реальных названий. Сравнения хранятся как `compare-ru-320.png`, `compare-ru-375.png`, `compare-ro-1440.png`; отдельный browser zoom/axe результат — `zoom-a11y.json`. Исходный audit сохраняется как историческое свидетельство.

Новый `selection-typography.spec.ts` проверяет все 50 текущих product identities в обеих локалях на девяти ширинах, отсутствие clipping/перекрытия remove control, сохранение 44 px target и reduced-motion. Дополнительно внедряет только в диагностический DOM длинные RU/RO строки и user text spacing. Product datasets, названия, маршруты, persistence и consultation payload не изменены.

Первичный targeted прогон: 21 passed, 1 предусмотренный duplicate-matrix skip. После финальной коррекции scale/spacing: 5 passed, 1 duplicate-matrix skip для selection typography и существующего composition contract.

Общий regression прогон продолжения: **295 passed, 18 предусмотренных skips, 1 timeout** на RO contact heading (5000 ms). Отдельный повтор всей navigation/contact suite без изменения кода и assertions: **14 passed**, включая тот же RO тест в desktop/mobile. Timeout не воспроизведён; его точная причина не установлена, поэтому первоначальный общий прогон не объявляется полностью зелёным. Typography, deep UI, responsive и catalogue visual fixtures прошли; snapshots в этом продолжении не обновлялись.

Остальные проверки: `repository:validate`, `architecture:validate`, `typography:validate`, `typecheck`, `lint`, `build` — PASS; unit tests — 144 passed. Настоящий 200% browser zoom и axe на заполненной подборке RU/RO: без clipping/overflow, 0 violations; contrast содержит manual-check result, это не полная WCAG-сертификация. На 375 px высота выборки из пяти длинных названий выросла с 2210 до 2265 px, на 1440 px RO осталась 1926 px. `selection-polish/comparison.html` содержит 18 пар для локального просмотра.

## Закрытие частично исправленных пунктов: G03, G09, G14

По последнему заданию пользователя закрываются три пункта со статусом «Частично». Остальные семь открытых пунктов не включены в этот набор. Изменены существующие thematic styles и обёртка заполненной подборки; публичные тексты, products, assets, form scenarios, persistence, payload и dependencies не изменены.

| Finding | Before | After | Why |
|---|---|---|---|
| G03 | `grid-auto-rows: 1fr` растягивал все 50 карточек по самому длинному содержимому, включая одноколоночный mobile | `grid-auto-rows: auto`; естественная высота каждого ряда, action baselines совпадают внутри ряда | Длинное название в конце каталога больше не добавляет пустоту к первой карточке. Полные названия и уже улучшенная title hierarchy сохранены |
| G09 | Список на desktop занимал всю ширину; remove control был далеко от текста, передача подборки находилась под пятью строками | Выше 1180 px список и panel следующего действия расположены рядом, gap 32 px, panel 320–380 px; ниже — последовательная колонка | Следующее действие видно рядом с первыми товарами, строки ограничены по ширине. DOM/tab order и прежние действия сохранены |
| G14 | Desktop intro занимало отдельную малозаполненную колонку слева от длинной формы | Центрированная panel до 1040 px: intro → modes → form; поля используют всю полезную ширину, desktop field grid остаётся двухколоночным | Убрана пустая боковая колонка. Mobile modes сохраняют три равных строки |

Компромиссы: у соседних desktop карточек остаётся необходимый резерв для выравнивания действий внутри ряда; глобального резерва больше нет. Desktop contact с пятью выбранными товарами стал на 170 px длиннее, поскольку intro теперь находится над полями. Это исправление композиции, а не обещание сокращения формы. Панель передачи подборки не sticky; на узком экране она по-прежнему следует после списка.

Evidence находится в игнорируемом `artifacts/visual-system-2026-09-05/partial-closure/`:

- `comparison.html`: 54 пары full-page before/after — catalogue, заполненная selection и contact × RU/RO × 320/375/430/768/1024/1440/1920/2048 px и 844×390 landscape.
- `compare-{ru|ro}-{products|selection|contactus}-*.png`: восемь компактных сравнений; `matrix-*.png`: шесть обзорных листов по ширинам. Просмотрены обе локали, desktop/mobile и крайние ширины; измерения всех 54 состояний не показывают document overflow.
- `before/measurements.json`, `after/measurements.json`: RU catalogue на 375 px — 26869 → 25549 px, RO — 26869 → 25456 px; обе локали на 1440 px — 6302 → 5845 px. Подборка из пяти длинных названий на 1440 px — 1926 → 1601 px. Это высота целой страницы при зафиксированной выборке, не универсальная метрика эффективности.
- `zoom-a11y.json`: 12 состояний трёх страниц RU/RO при 100% и настоящем 200% browser zoom; физические 1440×900 превращаются в 720×450 CSS px, DPR 2. Document overflow отсутствует, axe: 0 violations. `aria-prohibited-attr` и `color-contrast` содержат incomplete/manual results; полной WCAG conformance не заявляется.

Regression contract каталога изменён осознанно: прежний тест требовал одинакового смещения действий во всех 50 карточках и тем самым закреплял G03. Теперь он проверяет совпадение action baselines внутри каждого ряда и отсутствие лишнего gap у одиночной карточки. Новый `audit-partial-closure.spec.ts` дополнительно проверяет независимость первого ряда от диагностически удлинённого последнего названия, placement подборки и последовательность intro/modes/form в RU/RO. Проверки количества 50 карточек, image containment и существующие функциональные assertions сохранены.

Проверки этого продолжения: targeted E2E — **41 passed, 1 предусмотренный skip**; typecheck/lint/typography/build — PASS, unit tests — **144 passed**. Семь catalogue visual fixtures обновлены после просмотра результата, их проверка — **7 passed**. Полный E2E-прогон выполняется отдельно после завершения сборки; его итог будет зафиксирован перед сдачей.

## Ownership и риски

### Повторная сверка всех G01–G14

Сверка исходного audit, текущего кода, сохранённых before/after и последних test logs. После первоначальной сверки 4/3/7 проведено продолжение G03/G09/G14 выше с новым визуальным прогоном трёх затронутых страниц. Новый полный визуальный прогон всех страниц исходного аудита не заявляется. Положительный automated result сам по себе не закрывает композиционный finding.

**Итого: 7 исправлены, 0 частично исправлены, 7 открыты.** «Исправлен» относится к подтверждённому дефекту, а не к обязательному внедрению всех предложенных вариантов дизайна.

| ID | Статус | Что подтверждено / что осталось |
|---|---|---|
| G01 | Исправлен | Whole-word category labels/counts, две mobile колонки, RU/RO matrix и 200% zoom |
| G02 | Открыт | Media-first PDP и поздняя CTA на длинном mobile content сохраняются |
| G03 | Исправлен | Title hierarchy сохранена, каждый row имеет естественную высоту; удалён глобальный резерв `1fr`, проверена независимость rows и baselines внутри ряда |
| G04 | Открыт | Asset-by-asset optical normalization не выполнялась; исходные `catalogScale` сохранены |
| G05 | Открыт | Безопасные зоны hero object/gradient/benefits rail не переработаны |
| G06 | Исправлен | Mobile panel opaque, background text не просвечивает; Escape/reduced-motion проверены |
| G07 | Исправлен | Удалён лишний второй grid row у editorial feature, сохранён порядок материалов |
| G08 | Открыт | Ролевое разделение crops для poster/portrait/lifestyle не реализовано |
| G09 | Исправлен | Полные названия, leading, SKU и remove alignment; desktop list ограничен соседней handoff panel, на mobile последовательный layout; RU/RO matrix и zoom |
| G10 | Открыт | Повторяющиеся English summaries не отредактированы |
| G11 | Открыт | Полнота разрешённого RU/RO content и повторения PDP не согласованы; улучшение surfaces не закрывает проблему содержания |
| G12 | Открыт | Повторяющаяся Halo triad/composition сохраняется |
| G13 | Исправлен | Bookmark согласован с selection entry; CRM имеет utility treatment |
| G14 | Исправлен | Mobile modes — три равных строки; desktop intro над modes/form, panel до 1040 px без пустой боковой колонки; функциональные scenarios сохранены |

Первоначальное устранение обрезания названий закрывало только часть G09; последующее изменение ширины списка и расположения handoff закрывает оставшуюся часть. Помимо исходных пунктов исправлены consent-error/fullscreen selector collision и hover/press cascade; они не компенсируют семь открытых пунктов аудита.

Исторический общий E2E продолжения typography: 295 passed / 18 skips / 1 timeout; повтор navigation/contact — 14 passed. Причина того timeout не доказана. Текущее продолжение проходит отдельный полный regression run. Release status по-прежнему `release-blocked`, 8 открытых blockers, включая P0-LOCALE. Полное закрытие visual audit, bilingual approval и production release не заявляется.

`src/styles.css` по-прежнему только импортирует 12 thematic files. Tokens/primitives/header остаются в `base.css`; catalogue, PDP, contact, content, selection — в своих файлах; footer/loader/reveal — в `shell.css`; cross-page breakpoints и reduced-motion — в `responsive.css`. Не добавлен глобальный override stylesheet. Consent error получил собственный `.application-form__error`, чтобы разорвать подтверждённый конфликт с fullscreen application error boundary; validation, ARIA и payload не изменены.

Главный visual риск — более сильные input borders могут показаться утилитарными; это приемлемый компромисс control contrast для зрелой аудитории. Естественные длинные product titles могут увеличивать высоту своего ряда после будущего изменения контента; другие rows независимы. Эти изменения следует оценивать на новых source-backed названиях при их публикации.

Рекомендуемый следующий этап: product image optical normalization и PDP first viewport, затем hero/editorial composition. Bilingual editorial approval и release blockers ведутся отдельно. Полную performance optimization этот этап не выполняет.
