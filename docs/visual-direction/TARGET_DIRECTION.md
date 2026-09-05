# Target direction: mineral editorial refinement

2026-09-05 · **PROPOSAL / PENDING DESIGN APPROVAL**

Исторический brief этапа Prompt 1. Последующее задание пользователя разрешило ограниченный visual-system refinement; выполненная часть зафиксирована в [implementation report](../VISUAL_SYSTEM_REFINEMENT_2026-09-05.md). Остальные предложения не считаются реализованными или согласованными.

Это brief для следующего этапа, не замена [канонического DESIGN_SYSTEM](../DESIGN_SYSTEM.md). Основание: [visual gaps G01–G14](../VISUAL_DESIGN_GAP_AUDIT_2026-09-05.md), [source references](SOURCE_STUDY.md). Никаких production changes по этому brief в текущем этапе не сделано.

## Характер

Спокойный информационный каталог о продукции, происхождении формулы и бренде. Ощущение качества строится на читаемом тексте, уверенном размере упаковки, ясном порядке действий и аккуратной работе с изображениями. Mineral / sea / editorial identity сохраняется. «Premium» не означает больше пустого пространства, более мелкий текст, полный отказ от границ или набор гигантских lifestyle screens.

Не менять логотип, официальные упаковки, смысл текстов, ассортимент, RU/RO routes, publication/quarantine logic, contact/consent, набор функций. Не переносить commerce features из референсов.

## Typography

| Роль | Кандидат | Правило |
|---|---|---|
| Display hero | Cormorant Garamond, 40–48 mobile / 56–72 desktop | Для короткой brand-фразы; не стандарт для каждого H1 |
| Page H1 | Cormorant, 34–40 mobile / 48–60 desktop | Line-height 1.04–1.12; естественная ширина; long-title variant определяется реальными строками |
| Section H2 | Cormorant, 28–34 mobile / 36–48 desktop | Не конкурирует с H1; один размер на сходную роль |
| Product card title | Cormorant 20–22, weight 600, line 1.2–1.3 | Сравнить с текущими 16.13 desktop; полный смысл названия, без искусственных пустых строк |
| Body / product description | Manrope 16–18, line 1.6–1.72 | Prose 55–68ch; PDP description ориентир 58–64ch |
| UI / supporting labels | Manrope 14–16 | Информативный текст не меньше 14px; count не уменьшать для спасения кнопки |
| Eyebrow | Manrope 14, умеренное tracking | Не использовать много uppercase labels подряд; служебный слой вторичен |

Значения — диапазоны для comparative layout, не готовые CSS tokens. Не применять один fluid clamp ко всем заголовкам. На узком экране разрешать дополнительные строки, переносить по словам; `anywhere` оставить как emergency protection для непрерывных строк, а не как способ ужать обычные labels. Не вставлять ручные `<br>` в RU/RO datasets ради одной ширины. Balanced wrapping оценивать визуально: оно не гарантирует отсутствие orphan words.

## Palette и surface hierarchy

Сохранить текущие: paper `#f7fbfc`, white `#ffffff`, mist `#edf6f7`, ink `#14262d`, muted `#536a73`, sea700 `#0b6676`, sea800 `#084e5c`, line `#c8dde1`, gold `#b99a5a`, Lord deep `#071827`. Не делать тёплый beige total look по примеру furniture storefront и не переводить бренд в чёрно-белый fashion.

Три явных уровня:

1. Paper canvas — спокойное поле страницы, без отдельного gradient у каждой секции.
2. White/mist surface — media, формы, компактные информационные группы; outline только когда нужен разделитель.
3. Sea/Lord chapter — крупная смысловая глава, редкий акцент; внутри не добавлять ещё несколько конкурирующих nested cards.

Gold — логотип, отдельный brand marker; не новый цвет primary CTA. Текст на границах/пастельных фонах проверять по реальному contrast, не по образцу palette.

## Spacing, containers, borders, shadows

- Сохранить внешний desktop limit 1392px как исходную точку. Внутри ввести явные роли: reading 55–68ch; content/grid до1392; image chapter допускает full-bleed с внутренними aligned captions.
- Базовый spacing ряд 4/8/12/16/24/32/48/64. Inline icon+label 8; title→body 8–12; content→action 16–24; section separation 40–64 в зависимости от роли.
- Gutters: ориентир 14–18px на320–430, 24px tablet, 32px desktop. Все связанные headings/grid/toolbar начинают одну ось. Внешние поля 1920/2048 не заполнять декоративными блоками.
- Natural height на mobile. Равнять desktop CTA внутри ряда, не через фиксированный резерв title/description на всех экранах.
- Кандидат radii: controls12–16, cards18–24, крупная chapter surface24–32. Пилюли — compact state/action, не каждая служебная подпись. Сокращение текущих радиусов требует обновления canonical contract после approval.
- Border1px с одним семейством line/sea-opacity. Обычная card — border или очень мягкая тень, не сильная двойная рамка и тень. Overlay/menu имеет собственную непрозрачную поверхность.
- Shadow только объясняет elevation: overlay/сфокусированное действие; статические editorial блоки не должны все «парить».

## Product imagery

Source assets и complete packaging неприкосновенны. Packshot — `contain`; нельзя применять cover/обрезку этикеток для достижения равного масштаба. Для комплектов считать коробку и флакон одним силуэтом. Не создавать вторую PDP-картинку или fake gallery при одном официальном image.

Следующий image-QC: 50 товаров в одной sheet, сгруппированных по силуэту. Проверить occupied area, apparent center, baseline и safe padding. Начальный визуальный ориентир: объект занимает около 65–80% длинной стороны stage; широкие комплекты оцениваются по ширине. Это диапазон для ручной калибровки, не автоматическое требование растянуть каждый исходник. Любой scale ограничивается наличием всех краёв упаковки и резкостью source.

Catalogue: одинаковый stage ratio внутри одного режима grid. Mobile stage candidate 4:3 с реальной natural row height без скрытого `minmax(280px,auto)` резерва. PDP: desktop stage близок к квадрату; mobile и landscape могут потребовать ограничения высоты — это явное расхождение с текущим square-stage contract, которое надо согласовать, а не молча переопределить.

Poster/афиша: contain/естественный ratio, дата и надписи читаемы. Portrait: focal point + достаточная высота. Lifestyle/nature: cover допустим при проверке композиции. Hero gradient не пересекает критическую область продукта.

## Navigation, icons, motion

Desktop: brand → основные разделы → locale/selection → utility CRM. Сохранить доступные пункты; ослабить CRM shadow/fill как предложение hierarchy, не удалять вход. Mobile: opaque mineral panel, clear active row, large hit areas, Escape/keyboard/scroll остаются предсказуемыми.

Один bookmark для selection на card/PDP/header/list, одна семья Phosphor и согласованный stroke. State меняется outline→filled + доступный текст; hover не единственный индикатор. Не использовать cart, shopping bag или декоративное сердце для другой сущности.

Motion: interactions 160–220ms, panel 200–240ms; short opacity/translate. Не анимировать текстовую верстку и не масштабировать упаковку на20%. Hover image scale не обязателен; предпочтительнее border/state feedback. Сохранить reduced-motion и отсутствие зависимости доступности текста от reveal. Loading держит тот же media box, а failure имеет явный fallback; skeleton не остаётся бесконечным.

## Catalogue target

Порядок чтения: compact introduction → readable search/filter state → image/name → краткая полезная информация → details/selection. Полный ассортимент и сортировка сохраняются.

| CSS width | Первая гипотеза для сравнения |
|---|---|
| 320–430 | 1 колонка natural-height cards; 2 колонки category buttons или перенос целой кнопки |
| 768 | 2 product columns; категории wrap по полному label+count |
| 1024 | Сравнить 3 читаемые колонки с текущими4 |
| 1440–2048 | Сравнить 4 колонки в1392 с текущими5 при усиленном title |

Это не разрешение выбрать 4 колонки только потому, что reference так делает. Решение принимается на карточках тубы, банки, соли с длинным названием и комплекта. Признаки успеха: title различим без увеличения страницы; product identity не скрыта; no word fragments в filters; action baselines ровные внутри desktop row; single-column не резервирует несуществующие строки.

Для `q=Lord` активный query должен быть виден и при закрытом mobile search. Показ уже существующего значения как state summary — кандидат UI-refinement; новую Lord route, категорию или товары не добавлять. Не изменять ranking для красивого первого ряда.

## PDP target

Desktop: 45–48% media / 52–55% information как стартовая пропорция; text measure ограничен отдельно. Title, verified short intro и existing CTA — один блок. Ingredients/usage/details идут ниже как единственный полный источник, без повторного набора одинаковых cards.

Mobile: identity → media с ограничением высоты → verified intro → existing selection CTA → полноценные разрешённые поля. Проверить title/CTA position при375×812,768×1024,844×390 и browser200%. Не делать sticky bottom CTA автоматически: сначала проверить, решает ли задачу порядок и stage budget; липкий слой — отдельное flow decision.

RO с отсутствующими approved полями должен выглядеть законченным за счёт компактной geometry, без заполнителей. Заголовок секции, обещающий отсутствующие composition/usage, требует editorial решения; автоматическое придумывание полей запрещено.

## Editorial, About, Halo, selection, contact

- Editorial: один сильный feature, затем компактные новости и спокойная article grid. Высота feature зависит от содержимого; poster assets сохраняют текст. Generic excerpts отправить в editorial review.
- About: сохранить четыре разные роли в композиции и морскую завершающую полосу; пересмотреть mobile portrait crops. Не превращать всё в одинаковые вертикальные cards.
- Halo: сохранить тёмное вступление, убрать повтор композиционного triad; три небольших главы с ясными разделителями, только утверждённый материал.
- History: сохранить wave/timeline, даты и хронологию. Уменьшение внутреннего padding на320 — optional polish после основных задач.
- Selection: полное название важнее большого thumbnail; SKU без отдельной тяжёлой pill. Desktop handoff рядом с читаемым списком как кандидат, empty state сохраняется.
- Contact: три равных scenario controls на узком экране. Поля/consent/transmission и copy не менять; не добавлять wizard ради внешней компактности.

## Acceptance для следующего этапа

1. Before/after на одинаковых data/assets для RU/RO и всех8 ширин плюс landscape/реальный200% zoom.
2. Все category labels читаются словами; count внутри control; desktop title заметно отличается от body без уменьшения informative text.
3. Mobile cards имеют естественную высоту; полная упаковка и полезное действие доступны в разумном первом reading sequence PDP.
4. Posters не теряют значимый текст, portraits — лица; hero benefits не перекрывают упаковку; no unsupported data fill.
5. Меню отделено от фонового текста; focus/keyboard/reduced motion/selection regression tests проходят.
6. Документировать спорные эстетические решения и проверку человека. Passing screenshots assertions не заменяют сравнение композиции.

Implementation не начат. После согласования переносить принятые параметры в canonical DESIGN_SYSTEM, затем делать bounded component PR по очереди из audit report.
