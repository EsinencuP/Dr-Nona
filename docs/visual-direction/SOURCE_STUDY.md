# Source/layout references для Dr. Nona

Дата исследования: 2026-09-05. **Аналитический материал, не новая каноническая дизайн-система.** Связан с [visual gap report](../VISUAL_DESIGN_GAP_AUDIT_2026-09-05.md) и [target direction](TARGET_DIRECTION.md).

## Как отбирались

Изучены реальные компоненты grid, image, PDP, navigation, CSS/tokens и loading, а не только screenshots README. Локальные shallow clones закреплены commit SHA ниже. Четыре публичных demo также открыты в браузере при 1440×900, просмотрены full-page captures; это проверка композиции live homepage, **не полный аудит чужих user flows**. Версия deployment не доказана равной commit: source conclusions и live appearance разделены.

Три обязательных reference: Saleor, Shopify Hydrogen skeleton, Medusa DTC. Три дополнительных открытых implementation: Vercel Commerce, Solace, Shopware Frontends Vue demo + наследуемый CMS layer. Solace выбран за последовательный image/editorial rhythm; Vercel за чистую media hierarchy; Shopware за явные режимы изображения и адаптивный CMS listing. Shopware полезен как компонентный reference, а не как образец цельного luxury-бренда. Hydrogen и DTC — функциональные основы, не доказательство premium aesthetics.

| Implementation | Проверенный HEAD | Дата commit | License в checkout |
|---|---|---|---|
| Saleor Storefront | `9e7fec76454237583b8cb3baf129d213096a02de` | 2026-09-04 | FSL 1.1, ALv2 Future License; **source-available**, не обычный OSI open-source на дату snapshot |
| Shopify Hydrogen | `b543c6d2b00b4157ee944ffb63d3820ef6d563fb` | 2026-09-03 | MIT |
| Medusa DTC Starter | `19e8a6fbefea5a385e9502409908bfbebbecf526` | 2026-09-03 | MIT |
| Vercel Commerce | `3761e52e60df9c6a316e067dbfd7032e494d3634` | 2026-06-10 | MIT |
| Shopware Frontends | `fa3327291bbf158ce6322e7c87caf1dd7c71bcdf` | 2026-09-03 | MIT |
| Solace Medusa Starter | `68006af56d1cb0bca14d103ad44326b3406c71c6` | 2026-02-26 | MIT |

Таким образом, обязательный Saleor рассмотрен с явной оговоркой о лицензии, а все три дополнительных — MIT. [Лицензия Saleor](https://github.com/saleor/storefront/blob/9e7fec76454237583b8cb3baf129d213096a02de/LICENSE). Исходный код референсов не переносился в проект.

Solace дополнительно подтверждён как проект 2025 года [публикацией Medusa от 4 марта 2025](https://medusajs.com/blog/building-solace). Наличие свежего commit показывает актуальность snapshot, но не гарантирует качество или долгосрочную поддержку.

## Сравнение implementation

| Reference | Grid / container | Type / hierarchy | Image stage / ratio | Navigation / breakpoints | Loading / transitions |
|---|---|---|---|---|---|
| Saleor | PLP 2 mobile, desktop 3/4; gaps 16→24. Role widths: prose 48rem, content 80rem, wide 96rem, nav отдельно | Semantic display/H1/H2; display clamp 44→72, H1 32→48; card title medium, одна строка | PLP 3:4 cover, hover alternate image. PDP shell сохраняет одну геометрию между skeleton/fallback/content | Mobile/desktop components, отдельный nav container, lazy mega-menu | Explicit priority/sizes для first row; shared PDP shell; card scale 1.05 и transition 500ms; tokens 150/250/400ms |
| Hydrogen skeleton | Auto-fit с min 355 px; PDP 2 колонки от 45em. Это минимальный scaffold, не широкая editorial система | System body 16/1.4, H1 1.6rem/1.4; простая heading/body hierarchy | ProductItem square 1:1, нативный responsive image contract | Header 64 px, desktop nav от 48em; aside width 400 px | Intent prefetch; image loading prop; aside transform около 200ms. Показывает механизм, не готовый branded motion |
| Medusa DTC | PLP 2→3→4 при small/medium; gaps 24×32. Content max 1440, gutters 24. PDP три зоны, крайние max 300 px | Inter; функциональные title/body/price роли. В globals встречаются 10px captions — не переносить | Thumbnail 9:16, featured 11:14, square option; cover | Sticky header 64 px. small=1024, medium=1280; есть 320/512/1440/1680/1920 | Suspense для nav/actions, placeholders; image fill; thumbnail shadow transition 150ms |
| Vercel Commerce | Home 6 tracks: main 4×2, secondary 2×1; gap16; max1536. PDP media 4/6, info 2/6 на lg | Небольшая utility навигация, product label как компактный caption; hierarchy через масштаб изображения | Tile contain; PDP square fallback max550; label overlay | md mobile/desktop switch, lg расширяет layout; центрированная search zone | Explicit first-image priority, Next image sizes; hover300ms scale1.05, active border. Резервирование media geometry |
| Shopware Vue demo / CMS layer | Inherited listing 1→2→3→4 на sm/lg/2xl, auto rows, адаптивные gaps. Header own gutters; max-width зависит от CMS area | Demo ProductCard title20px, min-height60, clamp2; границы читаемой группы выражены | Card h240/320 в зависимости от layout; explicit cover/contain/scale-down, responsive thumbnails | Demo header скрывает search до md, меняет logo/menu order на lg. CMS breakpoints названы utility markers; не принимать за Dr. Nona values | Listing skeleton использует тот же grid; ClientOnly fallback в nav; hover300ms и image scale1.20 — слишком много для упаковки |
| Solace | Actual PLP ProductTile 1→2→3 на 640/900, gap8×24. Container content1328 + gutters16/56, отдельные max600/900/full | Inter scale12/14/16/20/24/32/40/48; actual tile title text-lg=16, clamp2. Hero/section scale и плотный caption создают rhythm | Actual PLP fixed h290→504, cover. PDP first image 29:20, далее29:34; mobile carousel | Centered logo, utility zone; medium=768. Breakpoints355/640/768/900/1100/1700 | LoadingImage сохраняет wrapper и pulse до onLoad; gallery first eager, остальные lazy; nav transition400ms |

**Не путать одинаковые имена breakpoint:** DTC `small` = 1024, Solace `small` = 640. В Solace найден старый Thumbnail, но реальный listing вызывает **ProductTile**; выводы в таблице относятся к вызываемому компоненту. Shopware demo наследует CMS base layer через nuxt config: listing и локальный ProductCard прочитаны на обоих уровнях.

## Source evidence и извлечённые принципы

### Saleor — role-based widths и loading geometry

[Brand tokens](https://github.com/saleor/storefront/blob/9e7fec76454237583b8cb3baf129d213096a02de/src/styles/brand.css) · [PLP grid](https://github.com/saleor/storefront/blob/9e7fec76454237583b8cb3baf129d213096a02de/src/ui/components/plp/product-grid.tsx) · [Card](https://github.com/saleor/storefront/blob/9e7fec76454237583b8cb3baf129d213096a02de/src/ui/components/plp/product-card-base.tsx) · [PDP shell](https://github.com/saleor/storefront/blob/9e7fec76454237583b8cb3baf129d213096a02de/src/ui/components/pdp/product-gallery-shell.tsx) · [Navigation loading](https://github.com/saleor/storefront/blob/9e7fec76454237583b8cb3baf129d213096a02de/src/ui/components/nav/components/nav-links-desktop.tsx)

Полезно для G03/G06/G09/G11: container width зависит от задачи; skeleton и загруженный image используют один layout; gallery chrome не нужен при одном image. Это не означает добавление gallery Dr. Nona. На [live demo](https://storefront.saleor.io/en/default) видны спокойный общий grid и короткие captions; одна карточка в захвате осталась без видимого объекта — не объявляем весь demo визуальным эталоном. Cover 3:4, truncated title и длинный 500ms zoom не подходят для wellness packaging и длинных названий.

### Hydrogen — прозрачная механика responsive scaffold

[Layout CSS](https://github.com/Shopify/hydrogen/blob/b543c6d2b00b4157ee944ffb63d3820ef6d563fb/templates/skeleton/app/styles/app.css) · [Type/reset](https://github.com/Shopify/hydrogen/blob/b543c6d2b00b4157ee944ffb63d3820ef6d563fb/templates/skeleton/app/styles/reset.css) · [ProductItem](https://github.com/Shopify/hydrogen/blob/b543c6d2b00b4157ee944ffb63d3820ef6d563fb/templates/skeleton/app/components/ProductItem.tsx)

Полезно для G01/G14: зависимость grid от минимальной полезной ширины и понятный момент перехода PDP к двум колонкам. Но минимум 355px нельзя копировать в 320px viewport без min(100%, ...). Skeleton визуально минимален; его системная типографика не является направлением для Dr. Nona. Полноценный live storefront Hydrogen в этой работе не оценивался: это framework/template, а не один унифицированный магазин.

### Medusa DTC — независимая зона действия

[PLP](https://github.com/medusajs/dtc-starter/blob/19e8a6fbefea5a385e9502409908bfbebbecf526/apps/storefront/src/modules/store/templates/paginated-products.tsx) · [PDP](https://github.com/medusajs/dtc-starter/blob/19e8a6fbefea5a385e9502409908bfbebbecf526/apps/storefront/src/modules/products/templates/index.tsx) · [Thumbnail](https://github.com/medusajs/dtc-starter/blob/19e8a6fbefea5a385e9502409908bfbebbecf526/apps/storefront/src/modules/products/components/thumbnail/index.tsx) · [Nav](https://github.com/medusajs/dtc-starter/blob/19e8a6fbefea5a385e9502409908bfbebbecf526/apps/storefront/src/modules/layout/templates/nav/index.tsx) · [Containers/type](https://github.com/medusajs/dtc-starter/blob/19e8a6fbefea5a385e9502409908bfbebbecf526/apps/storefront/src/styles/globals.css) · [Breakpoints](https://github.com/medusajs/dtc-starter/blob/19e8a6fbefea5a385e9502409908bfbebbecf526/apps/storefront/tailwind.config.js)

Полезно для G02/G11: action area имеет собственный layout и loading state. Три desktop-колонки по 300px для длинного RU материала переносить не следует; интерфейс каталога не нуждается в account/cart. Ratio9:16 и quality50 тоже не проектные требования. Visual evaluation здесь основана на source layout, без заявления о live demo parity.

### Vercel Commerce — media hierarchy через явную композицию

[Home mosaic](https://github.com/vercel/commerce/blob/3761e52e60df9c6a316e067dbfd7032e494d3634/components/grid/three-items.tsx) · [Contain tile](https://github.com/vercel/commerce/blob/3761e52e60df9c6a316e067dbfd7032e494d3634/components/grid/tile.tsx) · [PDP](https://github.com/vercel/commerce/blob/3761e52e60df9c6a316e067dbfd7032e494d3634/app/product/[handle]/page.tsx) · [Navigation](https://github.com/vercel/commerce/blob/3761e52e60df9c6a316e067dbfd7032e494d3634/components/layout/navbar/index.tsx)

На [live demo](https://demo.vercel.store/) главный product занимает крупную область, два вторичных подчинены ей, и содержимое не требует одинаковых card bodies. Полезно для G04/G05/G07: сначала назначить роли и tracks, затем размеры. Принцип contain переносим; ценовой pill, purchase flows, black/blue palette и малые overlay labels — нет. Commerce эстетически чист, но его короткая одежная номенклатура гораздо проще наших RU/RO текстов.

### Shopware — режимы изображения и responsive component contracts

[Demo ProductCard](https://github.com/shopware/frontends/blob/fa3327291bbf158ce6322e7c87caf1dd7c71bcdf/templates/vue-demo-store/app/components/product/ProductCard.vue) · [CMS listing / skeleton](https://github.com/shopware/frontends/blob/fa3327291bbf158ce6322e7c87caf1dd7c71bcdf/packages/cms-base-layer/app/components/public/cms/element/CmsElementProductListing.vue) · [Demo header](https://github.com/shopware/frontends/blob/fa3327291bbf158ce6322e7c87caf1dd7c71bcdf/templates/vue-demo-store/app/components/layout/LayoutHeader.vue) · [Layer inheritance](https://github.com/shopware/frontends/blob/fa3327291bbf158ce6322e7c87caf1dd7c71bcdf/templates/vue-demo-store/nuxt.config.ts)

[Live demo](https://frontends-demo.vercel.app/) чередует большие фото, короткую центральную текстовую полосу и дополнительные media blocks. Это reference modular layout и asset handling, а не премиальный тон целиком. Для G04/G08 полезен явный displayMode: фото и packshot не обязаны обрабатываться одинаково. Hover scale1.20, heartbeat wishlist и commerce UI исключены. CMS infrastructure не требуется переносить в Vite.

### Solace — наиболее полезный reference editorial rhythm

[Actual PLP](https://github.com/rigby-sh/solace-medusa-starter/blob/68006af56d1cb0bca14d103ad44326b3406c71c6/src/modules/store/templates/paginated-products.tsx) · [Actual ProductTile](https://github.com/rigby-sh/solace-medusa-starter/blob/68006af56d1cb0bca14d103ad44326b3406c71c6/src/modules/products/components/product-tile/index.tsx) · [LoadingImage](https://github.com/rigby-sh/solace-medusa-starter/blob/68006af56d1cb0bca14d103ad44326b3406c71c6/src/modules/products/components/product-tile/loading-image.tsx) · [Gallery](https://github.com/rigby-sh/solace-medusa-starter/blob/68006af56d1cb0bca14d103ad44326b3406c71c6/src/modules/products/components/image-gallery/index.tsx) · [Container](https://github.com/rigby-sh/solace-medusa-starter/blob/68006af56d1cb0bca14d103ad44326b3406c71c6/src/modules/common/components/container/index.tsx) · [Breakpoints](https://github.com/rigby-sh/solace-medusa-starter/blob/68006af56d1cb0bca14d103ad44326b3406c71c6/preset/theme/constants.js) · [Type](https://github.com/rigby-sh/solace-medusa-starter/blob/68006af56d1cb0bca14d103ad44326b3406c71c6/preset/theme/typography.js) · [Nav](https://github.com/rigby-sh/solace-medusa-starter/blob/68006af56d1cb0bca14d103ad44326b3406c71c6/src/modules/layout/templates/nav/index.tsx)

[Live Solace](https://solace-medusa-starter.vercel.app/dk) поддерживает различие hero photo, editorial headline, асимметричной коллекции и компактных product captions. Это наиболее близкий принцип к сохранению Dr. Nona editorial identity без card-template everywhere. Для G03/G05/G07/G12 переносим ритм и экономность surface decoration. Не переносим fixed h504, furniture cover crops и center-aligned длинные RU names. LoadingImage ждёт onLoad, но найденный компонент не содержит отдельного onError: сам по себе skeleton не доказательство устойчивости при failed image.

## Что было рассмотрено, но не выбрано основой

- `medusajs/nextjs-starter-medusa`, SHA `9818886f06e493cb2249733d114d339aa216ef00`, 2026-04-23: README помечает deprecated. Исторический reference, не current default вместо DTC.
- Shopify Horizon: свежий код, но лицензия ограничена Shopify integration; не считать дополнительным MIT/OSI reference и не копировать.
- Nitrogen: при первичном просмотре не найден явный LICENSE; поэтому не вошёл в подтверждённую open-source тройку.
- Эти preliminary checks не считаются полным source/layout аудитом дополнительных проектов.

## Решение

Рекомендуется сочетать **Solace rhythm + Vercel contain/composition + Saleor width/loading contracts** с текущими Dr. Nona typography/palette. Hydrogen, DTC и Shopware помогают проверить responsive/state mechanics. Ни один reference не оправдывает смену React/Vite, добавление магазина или замену официальных packshot.

Локальные evidence: `artifacts/design-audit-2026-09-05/references/`, `reference-{saleor,commerce,solace,shopware}.png`, `reference-live.json`. Клоны и screenshots остаются runtime artifacts вне Git. Проверенные commit links выше сохраняют source traceability независимо от локального evidence.
