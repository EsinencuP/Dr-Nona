# Dr. Nona improvement workflow

Этот документ является единым workflow-контрактом для шести последовательных промптов улучшения Dr. Nona. Он хранит полный текст промптов, порядок их выполнения, критерии перехода и правила сохранения контекста в Graphify.

## Статус и порядок выполнения

Промпты выполняются строго последовательно:

1. Deep visual audit + 2026 reference research.
2. Design system 2026 + premium visual refinement.
3. Responsive typography, headings, text and image geometry.
4. RU/RO content parity and translation integrity.
5. Performance, speed, responsive media optimization.
6. Final release-quality visual QA.

Prompt 1 считается пройденным только при наличии current-state evidence, route/viewport coverage, reference research и отдельного audit document в `docs/`. Если evidence неполный, Prompt 1 нужно повторить перед переходом к Prompt 2.

## Текущий evidence snapshot перед повторным запуском

По состоянию текущего checkout Prompt 1 **PASS по документированному evidence** и повторно запускать его только из-за предположения о наличии бага не требуется: [VISUAL_DESIGN_GAP_AUDIT_2026-09-05.md](VISUAL_DESIGN_GAP_AUDIT_2026-09-05.md) фиксирует RU/RO surfaces, 320–2048 px, landscape, настоящий 200% zoom, long-text stress, 358 состояний и design-gap report; [SOURCE_STUDY.md](visual-direction/SOURCE_STUDY.md) содержит Saleor, Shopify Hydrogen, Medusa DTC и три дополнительных source/layout references.

Статусы обновляются по отдельному evidence каждого этапа. Prompt 2 повторно проверен и принят 2026-09-06; остальные незавершённые этапы сохраняют свою оценку:

| Prompt | Текущий статус | Evidence / незакрытая часть |
|---|---|---|
| 1 | **PASS** | Audit и reference research зафиксированы; P0 visual defects не подтверждены. |
| 2 | **PASS** | [Prompt 2 acceptance report](PROMPT_2_DESIGN_SYSTEM_REFINEMENT_2026-09-06.md): visual foundation повторно проверена, Halo chapters доработаны; 49 before/after pairs, 16 axe runs / 0 violations, 151 unit tests, 332 E2E passed / 18 skipped, build и relevant gates PASS. G11 и editorial часть G12 остаются открытыми за пределами design-system scope. |
| 3 | **PARTIAL** | G02/G04/G05 и image geometry имеют regression evidence; полный единый Prompt 3 отчёт по всем responsive surfaces и каждому acceptance пункту не зафиксирован как отдельный PASS. |
| 4 | **PARTIAL / HUMAN REVIEW REQUIRED** | Технические parity/quarantine gates существуют, но 50 RO product records, claims, source gaps и editorial approval остаются human-review scope; P0-LOCALE нельзя закрывать программно. См. [TEXT_BILINGUAL_AUDIT.md](TEXT_BILINGUAL_AUDIT.md). |
| 5 | **NOT VERIFIED** | Runtime/performance budget checks существуют, но отдельный Prompt 5 baseline → optimization report с полным asset inventory и всеми LCP/CLS/INP/request/decode deltas не подтверждён. |
| 6 | **BLOCKED / NOT RUN AS A FINAL PASS** | Отдельные audits и CI gates зелёные, но нет единого final report по всем route surfaces, 50 PDP, RU/RO, 200% zoom, full performance/runtime и `release:check`; repository release остаётся blocked внешними approvals. |

Следовательно, все шесть промптов **не считаются полностью пройденными**. Prompt 1 и Prompt 2 приняты по evidence; следующий рабочий этап по запросу пользователя — Prompt 3, затем отдельно Prompt 4 human-review accounting, Prompt 5 baseline/after measurement и только после этого Prompt 6.

Перед каждым следующим промптом агент должен:

- запросить Graphify по этому workflow и связанным узлам;
- открыть результаты предыдущего промпта и актуальные документы проекта;
- проверить, какие пункты закрыты, частично выполнены или остаются открытыми;
- не объявлять следующий этап завершённым по одному green automated test;
- отделять visual release readiness от full production release readiness;
- сохранять новые evidence, решения, blockers и ссылки на изменённые файлы в `docs/`.

После каждого промпта агент должен сохранить в Graphify:

- узел workflow-промпта;
- status: `PASS`, `PARTIAL` или `BLOCKED`;
- scope и проверенные поверхности;
- evidence files и test commands;
- открытые P0/P1/P2/polish findings;
- зависимости следующего промпта.

Graphify используется как карта навигации и памяти, а исходники и отчёты остаются source of truth. При конфликте карта обновляется из checkout; предположение не считается evidence. Для запроса контекста сначала используется bounded `graphify query`, затем `path`/`affected`, и только после этого читаются найденные файлы.

## Общий workflow после шести промптов

Финальная проверка должна ответить на четыре независимых вопроса:

- полностью ли прошли все шесть промптов;
- какие visual/UI и responsive defects реально исправлены;
- есть ли RU/RO parity и approved-content blockers;
- проходит ли технический frontend release gate, при этом не подменяя его production approval.

Финальный отчёт должен содержать сводку статусов `Prompt 1`–`Prompt 6`, unresolved findings, evidence, файлы, тесты и отдельно указанные repository release blockers. Формулировка `Frontend visual/technical quality is release-ready` разрешена только когда соответствующие UI/technical gates действительно проходят. Формулировка `Project is production-ready` запрещена, если `npm run release:check` и repository release status этого не подтверждают.

---

# PROMPT 1 — DEEP VISUAL AUDIT + 2026 REFERENCE RESEARCH

Работай только над аудитом и design direction.

Пока НЕ делай масштабных изменений production UI.

## ЦЕЛЬ

Найти реальные visual/UI weaknesses текущего Dr. Nona, несмотря на существующие passing automated tests, и определить точное направление premium redesign.

Существующий UI/UX audit может быть зелёным, поэтому не принимай предположение пользователя о наличии бага как доказанный факт.

## 1. ПРОВЕДИ CURRENT STATE AUDIT

Запусти проект и визуально проверь основные страницы как минимум:

### RU:

- home;
- catalogue;
- 3–5 разных product detail pages;
- Halo Complex;
- About;
- History;
- Lord;
- selection;
- contact;
- editorial/content page.

### RO:

те же критические страницы.

### Viewport matrix:

- 320
- 375
- 430
- 768
- 1024
- 1440
- 1920

Дополнительно:

- mobile landscape;
- 200% zoom;
- long RU strings;
- long RO strings.

Проверяй не только automated assertions, но и визуальное качество.

## 2. ИЩИ КОНКРЕТНО

### Typography

- некрасивые line breaks;
- orphan words;
- headings слишком крупные/маленькие;
- несогласованный rhythm;
- плохую ширину text measure;
- недостаточную разницу display/body;
- длинные RU/RO строки.

### Layout

- разные visual alignment для похожих sections;
- прыгающие baselines;
- лишний whitespace;
- чрезмерную плотность;
- чрезмерную разреженность;
- элементы, которые выглядят случайно выровненными.

### Product imagery

- объект слишком маленький внутри stage;
- слишком много пустого пространства;
- product packshot визуально смещён;
- разные товары выглядят разного масштаба;
- image stage слишком высокий;
- clipping;
- unstable ratio.

### Catalogue

- quality product grid;
- card density;
- title hierarchy;
- hover;
- filters;
- visual scanning;
- relationship между изображением и текстом.

### Header/navigation

- hierarchy;
- spacing;
- RU/RO width;
- transition desktop → tablet → mobile.

### Product detail

- media/content balance;
- first useful viewport;
- CTA visibility;
- typography;
- information architecture.

### Editorial

- repetitive sections;
- template feeling;
- одинаковые card patterns;
- слабый visual rhythm.

## 3. DEEP SEARCH REFERENCES

Исследуй минимум:

- Saleor Storefront;
- Shopify Hydrogen;
- Medusa DTC Starter;

и ещё 3–5 действительно качественных open-source storefront/catalogue implementations, актуальных в 2025–2026.

Не выбирай repository только потому, что README говорит "premium".

Изучи реальный source/layout implementation.

Сравни:

- grid strategy;
- containers;
- type scale;
- image stages;
- product aspect ratios;
- navigation;
- responsive breakpoints;
- loading;
- transitions;
- visual hierarchy.

## 4. СОЗДАЙ DESIGN GAP REPORT

Для каждой проблемы:

### Severity:

P0 / P1 / P2 / polish.

### Поля:

- Surface.
- Viewport.
- Evidence.
- Why it looks wrong.
- Proposed design correction.
- Reference principle.
- Risk.
- Files likely affected.

## 5. СОЗДАЙ TARGET DESIGN DIRECTION

Не меняя brand identity радикально, предложи refinement существующей системы:

- typography;
- palette;
- spacing;
- surface hierarchy;
- borders;
- shadows;
- product imagery;
- icon treatment;
- motion language;
- navigation;
- catalogue;
- PDP.

Сохрани mineral / sea / editorial identity.

## 6. РЕЗУЛЬТАТ ЭТАПА

Создай отдельный audit document в `docs/`.

Не делай large visual rewrite.

Допустимы только небольшие диагностические изменения/tests.

В конце дай пользователю:

1. Top 10 реальных visual weaknesses.
2. Top 5 изменений с наибольшим visual impact.
3. Что НЕ следует менять.
4. Какие references оказались наиболее полезны.
5. Предлагаемую последовательность implementation.

---

# PROMPT 2 — DESIGN SYSTEM 2026 + PREMIUM VISUAL REFINEMENT

Используй результаты Prompt 1.

На этом этапе работай только над:

- visual system;
- typography;
- palette;
- spacing;
- surfaces;
- micro-interactions;
- motion foundation.

Не занимайся полной performance optimization и переводами.

## ЦЕЛЬ

Поднять существующий design system с уровня "хороший QA frontend" до уровня visually distinctive premium release frontend.

## TYPOGRAPHY

Сначала оцени существующую пару:
Cormorant Garamond + Manrope.

Не меняй шрифты автоматически.

Ответь:

- подходит ли Cormorant бренду;
- одинаково ли хорошо работает Latin/Cyrillic/Romanian;
- где serif действительно нужен;
- где он ухудшает читаемость.

Если существующая пара остаётся — улучши:

- optical hierarchy;
- font weights;
- fluid scale;
- line-height;
- text-wrap;
- max-inline-size;
- paragraph measure;
- title wrapping.

Если предлагаешь новый font:

- он должен иметь качественные Cyrillic + Romanian glyphs;
- быть self-hostable;
- не ухудшить loading;
- обязательно представить before/after evidence.

Никакой замены шрифта исключительно ради новизны.

## COLOR SYSTEM

Refine существующую Mineral Light palette.

Основной характер:

- mineral white;
- subtle blue-green sea;
- deep ink;
- restrained gold;
- rare botanical accent.

Проверь:

- contrast;
- muted text;
- border visibility;
- hover states;
- active states;
- dark footer;
- Lord surfaces.

Не превращай интерфейс в blue SaaS.

Создай/уточни semantic tokens:

- bg;
- surface;
- surface-raised;
- text-primary;
- text-secondary;
- border;
- border-strong;
- action;
- action-hover;
- focus;
- premium-accent;
- success/error при необходимости.

## DEPTH

Убери ощущение "CSS cards everywhere".

Используй комбинацию:

- whitespace;
- subtle borders;
- tonal surfaces;
- typography;
- image composition;
- редкие shadows.

Shadow должен показывать hierarchy, а не украшать каждую карточку.

## MOTION SYSTEM

Создай ограниченную motion vocabulary.

Разрешённые категории:

1. navigation transitions;
2. button/toggle feedback;
3. card hover;
4. image hover;
5. subtle content reveal;
6. mobile panel enter/exit;
7. route/content transition только если действительно улучшает perceived quality.

Используй преимущественно:

- opacity;
- transform;
- clip-path только при доказанной необходимости.

Не анимируй layout properties без необходимости.

Не добавляй heavy animation library, пока CSS/Web Animations API достаточно.

Если предлагаешь dependency вроде Framer Motion:
сначала измерь bundle/performance impact и докажи необходимость.

Motion duration ориентировочно:

- micro: 120–180 ms;
- standard: 180–260 ms;
- editorial reveal: максимум около 400–550 ms.

Никакой sluggish luxury animation.

Все transitions обязаны иметь reduced-motion equivalent.

## COMPONENT POLISH

Отдельно проработай:

- buttons;
- text links;
- locale switch;
- product save action;
- chips;
- inputs;
- cards;
- navigation underline;
- mobile menu;
- loading UI;
- empty state;
- 404.

## IMPLEMENTATION

Изменяй существующие CSS tokens и thematic files, соблюдая style boundaries проекта.

Не создавай global overrides, которые ломают ownership selectors.

## ACCEPTANCE

После изменений:

- сравни screenshots before/after;
- проверь desktop/mobile;
- проверь RU/RO;
- запусти typography validation;
- test;
- deep UI audit;
- responsive matrix;
- accessibility tests.

Сформулируй self-critique:

"Что всё ещё выглядит как generic template?"

Если такие зоны есть — доработай их.

---

# PROMPT 3 — RESPONSIVE TYPOGRAPHY, HEADINGS, TEXT AND IMAGE GEOMETRY

Работай исключительно над responsive geometry и визуальными дефектами:

- заголовки;
- wrapping;
- кривой текст;
- переполнение;
- clipped content;
- product images;
- editorial images;
- card images;
- alignment;
- mobile/tablet behaviour.

Не меняй общую brand direction.

## ЦЕЛЬ

Сделать layout resilient, а не breakpoint-patched.

## MATRIX

Обязательно проверить:

- 320
- 375
- 430
- 768
- 1024
- 1440
- 1920

и mobile landscape.

Проверять RU и RO.

## HEADINGS

Найди все H1/H2/H3 patterns.

Ищи:

- фиксированную высоту;
- nowrap;
- brittle line-clamp;
- oversized clamp;
- заголовок, который красиво работает только с конкретным текстом;
- переносы, нарушающие hierarchy.

Используй по необходимости:

- clamp();
- min();
- max();
- minmax();
- text-wrap: balance;
- text-wrap: pretty;
- overflow-wrap;
- адекватный max-inline-size.

Не используй font-size reduction как универсальный костыль.

## TEXT CONTENT

Не обрезай meaningful content line-clamp'ом только ради одинаковой высоты cards.

Если cards требуют alignment:
предпочитай корректную grid/flex structure и content zones.

Допустимый line-clamp:
только для вторичного preview content, где есть очевидный путь открыть полный текст.

## PRODUCT CARDS

Проверь 50 продуктов.

Используй script/Playwright для автоматического обхода.

Проверить:

- title fit;
- media stage;
- consistent baseline;
- action position;
- image object scale;
- visual weight.

## PRODUCT DETAIL IMAGES

Для каждого продукта на mobile и desktop:

- объект полностью помещается;
- нет clipping;
- нет неожиданного upscale;
- нет excessive dead space;
- image stage не прыгает при загрузке;
- caption не меняет geometry неожиданно.

Не используй object-fit: cover для packshots, если это режет продукт.

Исследуй стратегию responsive images в Shopify Hydrogen:

- intrinsic dimensions;
- aspect ratio;
- correct responsive source size;
- LCP-specific priority.

Адаптируй принцип к Vite/static asset architecture проекта.

## EDITORIAL MEDIA

Раздели:

- packshot → contain;
- lifestyle/editorial photography → cover;
- decorative image → controlled crop.

Не применяй один универсальный image style ко всему сайту.

## TABLET

Отдельно проверь диапазон 768–1180.

Это часто самый проблемный участок.

Не создавай десятки narrow breakpoint overrides.

Сначала попробуй решить через intrinsic layout:

- grid auto-fit;
- minmax;
- flexible measure;
- container-aware composition.

## TESTS

Расширь Playwright assertions, если нашёл класс дефекта, который существующие тесты не ловят.

Особенно полезны assertions:

- bounding boxes;
- image bounds;
- CTA overlap;
- computed overflow;
- H1/H2 dimensions;
- document scrollWidth;
- actual image natural dimensions;
- text clipping.

Новый visual defect считается исправленным только если:

- есть evidence before;
- есть fix;
- есть regression test или visual baseline, если это практически возможно.

---

# PROMPT 4 — RU/RO CONTENT PARITY AND TRANSLATION INTEGRITY

Работай только над bilingual integrity RU ↔ RO.

НЕ занимайся redesign.

## КРИТИЧЕСКОЕ ОГРАНИЧЕНИЕ

Это wellness/health catalogue.

Запрещено:

- придумывать медицинские claims;
- усиливать claims при переводе;
- дополнять отсутствующий состав;
- самостоятельно придумывать применение;
- представлять машинный перевод как approved content.

Если source недостаточен:
маркируй запись как requiring editorial review.

## SOURCE OF TRUTH

Сначала изучи:

- `docs/TEXT_BILINGUAL_AUDIT.md`;
- current RU datasets;
- current RO datasets;
- locale resources;
- content publication/quarantine logic;
- official source URLs;
- Moldova source content.

## ЦЕЛЬ

RU и RO versions должны иметь одинаковую:

- information architecture;
- route availability;
- UI functionality;
- sections;
- buttons;
- forms;
- metadata structure;
- alt-text coverage;
- product field coverage.

Текст не обязан быть дословным переводом, но смысл должен соответствовать источнику.

## СОЗДАЙ MACHINE-READABLE PARITY AUDIT

Для каждой route/content entity сравни:

RU field  
RO field  
Source  
Status

Status:

- EXACT/PARITY
- SEMANTIC_PARITY
- MISSING_RO
- MISSING_RU
- SUSPICIOUS_TRANSLATION
- TRUNCATED
- WRONG_FIELD_MAPPING
- NEEDS_EDITORIAL_REVIEW
- NOT_APPLICABLE

## ОСОБО ПРОВЕРЬ PRODUCTS

Для всех 50:

- product name;
- category;
- description;
- composition;
- usage;
- metadata;
- alt;
- CTA text;
- related labels.

Лови ситуации, когда:

- composition содержит кусок description;
- usage содержит соседний абзац;
- RU и RO описывают разные свойства;
- RO текст подозрительно короткий;
- поле обрезано.

## UI RESOURCES

Все UI keys должны быть симметричны.

Добавь automated validation:
RU keyset == RO keyset.

Никаких silent fallbacks на русский для пользовательского UI, кроме явно разрешённых original-language editorial materials.

## ORIGINAL LANGUAGE

Если article существует только на русском:
не выдавай его как румынский перевод.

Сохраняй корректный `lang`.

UI shell вокруг статьи при этом должен быть RO.

## SEO

Проверь:

- title;
- description;
- canonical;
- hreflang/alternates;
- OpenGraph;
- product metadata;
- route language.

RO URL не должен иметь RU metadata.

## РЕЗУЛЬТАТ

Исправляй только те переводы, для которых есть надёжный source.

Всё сомнительное вынеси в отдельную editorial-review таблицу.

Не закрывай P0-LOCALE программно, если для него требуется human approval.

Финальный отчёт:

- total RU entities;
- total RO entities;
- parity;
- repaired;
- quarantined;
- human review required.

---

# PROMPT 5 — PERFORMANCE / SPEED / RESPONSIVE MEDIA OPTIMIZATION

Теперь работай только над производительностью.

Внешний вид должен остаться практически идентичным предыдущему утверждённому состоянию.

## СНАЧАЛА BASELINE

Не оптимизируй вслепую.

Измерь:

- initial JS raw/gzip/brotli;
- initial CSS;
- route chunks;
- preload graph;
- font payload;
- hero media;
- catalogue media;
- LCP;
- CLS;
- INP;
- scripting time;
- long tasks;
- image decode;
- request count.

Используй существующие repository performance tools.

## ARCHITECTURE

Сохрани существующий принцип:

Home:
только LCP-critical content + small projections.

Catalogue:
full catalogue data загружается только на catalogue route.

Product:
только необходимые product/detail resources.

Editorial:
не должен тянуть catalogue datasets.

Не объединяй lazy route modules обратно в огромный bundle.

## IMAGES

Проведи inventory всех production assets.

Для каждого определи:

- format;
- intrinsic dimensions;
- rendered maximum;
- file size;
- usage count;
- LCP/non-LCP.

Проверь возможность:

- AVIF;
- WebP;
- responsive variants;
- correct width/height;
- srcset;
- sizes;
- lazy load;
- fetch priority.

LCP hero:
не lazy-load.

Below-fold:
не загружать заранее без необходимости.

Не создавай responsive variants, которые почти не уменьшают transfer size.

## PRODUCT MEDIA

Так как продуктовые packshots повторяются в catalogue/home/PDP:
проанализируй, стоит ли иметь build-generated responsive derivatives.

Цель:
mobile не должен скачивать desktop-size asset без необходимости.

При этом нельзя ухудшать sharpness.

## FONTS

Существующий проект уже self-hosts font subsets.

Проверь:

- actual glyph coverage RU/RO;
- duplicate subsets;
- unused weights;
- preload;
- fallback metrics;
- layout shift.

Не превращай font-display optimisation в FOUT/CLS проблему.

## CSS

Ищи:

- duplicated selectors;
- obsolete overrides;
- repeated declarations;
- слишком большой responsive tail;
- specificity wars.

Но не объединяй thematic CSS files вопреки architecture contract.

Оптимизируй внутри существующих boundaries.

## ANIMATIONS

Проверь новый motion system.

Требования:

- compositor-friendly transforms/opacity;
- никаких constant animations offscreen;
- никакого heavy JS scroll observer без причины;
- hover animation не должна force layout;
- reduced motion.

## REACT

Профилируй прежде чем добавлять memo/useMemo/useCallback.

Не делай ritual optimisation.

Ищи реальные:

- excessive rerenders;
- duplicated state;
- heavyweight route imports;
- synchronous work;
- unnecessary parsing.

## TARGET

Не ставь искусственные Lighthouse 100 как единственную цель.

Главный критерий:
реальное улучшение measured runtime + no visual regression.

После оптимизации предоставь таблицу:

Metric | Before | After | Delta | Explanation

Запусти:

- performance validation;
- runtime performance;
- build;
- E2E;
- responsive tests.

Никакая "оптимизация" не принимается, если она ухудшила UX или layout stability.

---

# PROMPT 6 — FINAL RELEASE-QUALITY VISUAL QA

Это финальный технический и визуальный polish pass.

Не начинай новый redesign.

Работай только с дефектами, найденными через final QA.

## ЦЕЛЬ

Добиться состояния:
"нет очевидной причины считать интерфейс prototype/beta".

При этом различай:

VISUAL RELEASE READY

и

FULL PRODUCTION RELEASE READY.

Repository может оставаться production-blocked из-за legal/content/business approvals.

Не помечай такие blockers закрытыми.

## FULL ROUTE SWEEP

Проверь все реальные route surfaces.

Минимум:

- home;
- catalogue;
- all 50 products;
- Halo;
- About;
- History;
- Lord;
- Blog/News/editorial;
- selection;
- contact;
- official dynamic pages;
- 404/error states.

RU + RO.

## VIEWPORT SWEEP

- 320
- 375
- 430
- 768
- 1024
- 1440
- 1920
- landscape mobile
- 200% zoom

## VISUAL CHECKLIST

### Header

- alignment;
- compactness;
- sticky behaviour;
- locale switch;
- mobile menu;
- active route.

### Hero

- LCP;
- crop;
- text contrast;
- fold;
- CTA;
- no giant dead zone.

### Typography

- consistent hierarchy;
- no ugly orphaning;
- no accidental 1–2 word second line where avoidable;
- no clipped labels;
- readable body.

### Catalogue

- card alignment;
- packshot consistency;
- title height;
- actions;
- filters;
- empty states.

### PDP

- image not clipped;
- product identity obvious;
- first useful viewport;
- information hierarchy;
- CTA;
- mobile stacking.

### Editorial

- visual rhythm;
- no monotonous repeated cards;
- appropriate media ratios;
- readable paragraphs.

### Footer

- hierarchy;
- language;
- long links;
- mobile wrapping.

### States

- hover;
- keyboard focus;
- active;
- loading;
- error;
- empty;
- success;
- disabled.

## SCREENSHOT REVIEW

Создай canonical screenshot set для ключевых страниц.

Проведи self-review так, как будто это внешний design QA:

Для каждого screenshot спроси:

- Есть ли визуально случайное выравнивание?
- Есть ли ненужное пустое пространство?
- Выглядит ли секция template-generated?
- Достаточно ли сильна hierarchy?
- Есть ли конкурирующие CTA?
- Продукт является визуальным фокусом?
- Есть ли некачественные image crops?
- Есть ли typography awkwardness?
- Выглядит ли mobile как отдельный продуманный layout, а не squeezed desktop?
- Есть ли что-то, что senior designer попросил бы исправить перед release?

Исправляй только подтверждённые проблемы.

## AUTOMATED GATES

Запусти полный repository CI/gates, включая:

- repository validation;
- architecture;
- typography;
- content;
- claims;
- security;
- typecheck;
- lint;
- unit/integration;
- build;
- performance;
- runtime performance;
- Playwright;
- responsive matrix;
- deep UI audit;
- release check.

Не ослабляй тесты, чтобы получить green.

Если тест устарел из-за утверждённого design change:
объясни причину изменения baseline/assertion.

## FINAL REPORT

В конце дай:

### Visual status

PASS / BLOCKED.

### Technical frontend status

PASS / BLOCKED.

### RU/RO technical parity

PASS / BLOCKED.

### Performance

before / after.

### Remaining P0/P1

Скопируй только реальные актуальные blockers из repository release status.

### Files changed

Кратко.

### Design improvements

До/после.

### Regressions

None либо список.

### Final statement

Используй формулировку:

"Frontend visual/technical quality is release-ready"

только если соответствующие UI/technical gates реально проходят.

Не используй:

"Project is production-ready"

пока npm run release:check и repository release status не подтверждают это.

---

## Graphify persistence contract

Этот файл является workflow-node `dr-nona::prompt-improvement-workflow`. При добавлении нового audit evidence или изменении статуса промпта агент должен обновить этот документ либо связанный audit document, затем пересобрать cross-repo map командой `npm run graphify:cross-repo`. Карта должна позволять найти этот workflow по понятиям `Prompt 1`, `Prompt 2`, `Prompt 3`, `Prompt 4`, `Prompt 5`, `Prompt 6`, `visual audit`, `design system`, `responsive geometry`, `RU/RO parity`, `performance`, `final QA`.

Карта не заменяет полный текст этого файла: если query возвращает только workflow-node, агент открывает этот документ как canonical prompt source и не восстанавливает требования по памяти.
