# Dr. Nona Moldova — Implementation Handoff

Status: Implemented frontend handoff; not a release status  
Last updated: 2026-07-30

Этот документ фиксирует реализованную архитектуру и ограничения следующей
production-стадии.

## Files to read

1. `MASTER_DESIGN_FOUNDATION.md`
2. `DECISIONS.md`
3. `DESIGN_CONTRACT.md`
4. `DESIGN.md`
5. `COLOR_SYSTEM.md`
6. `DESIGN_SKILL_STACK.md`
7. `PROJECT_BRIEF.md`
8. `PAGE_INVENTORY.md`
9. `CONTENT_MODEL.md`
10. `OPEN_QUESTIONS.md`
11. `IMPLEMENTATION_READINESS.md`

## Binding constraints

- электронный каталог, не магазин;
- основной смысловой приоритет — Halo Complex™;
- аудитория — зрелая и старшая;
- языки — русский и румынский;
- Mineral Light: белый/голубой доминируют, золото и зелёный редки;
- Lord: полная page-level navy/gold theme;
- каталог плотный и рабочий;
- компоненты мягкие и округлые;
- motion сдержанный, прерываемый и производительный;
- только официальные или утверждённые материалы;
- cart, checkout, payment, price-driven UI, auth и AI-модели запрещены.

## Реализованные поверхности

- route-separated главная, каталог и карточки 10 актуальных продуктов;
- type filters, search, A—Z / Z—A / popularity / recently-updated sorting;
- отдельный `releasedAt` contract для будущей сортировки «Сначала новые» без
  подмены датой изменения sitemap;
- локальная подборка без commerce-сценариев;
- полный Lord theme switch;
- About, company, founders, history и science;
- Halo Complex™ formula page;
- объединённый Blog/News hub и отдельные article routes;
- динамическое покрытие официальных service/information routes;
- route-specific SEO manifest, canonical, OG/Twitter, Product/Article/
  Breadcrumb JSON-LD и prerendered HTML для индексируемых routes;
- self-referential `ru-MD`/`x-default` для текущей русской версии, стратегия
  `/ro/...` для будущего полного перевода и HTTP 308 `/main` → `/`;
- responsive navigation, keyboard focus, touch targets и reduced motion.

## Production blockers

Актуальный список находится в `IMPLEMENTATION_READINESS.md` и
`OPEN_QUESTIONS.md`. Любой неизвестный параметр остаётся TODO.

## Implementation entry points

- `src/App.tsx` — 17-строчный composition root;
- `src/app/routes.tsx` — route table с реальными dynamic imports;
- `src/app/AppShell.tsx` — общий header/footer и route metadata effects;
- `src/app/ApplicationErrorBoundary.tsx` — controlled render recovery выше Router;
- `src/app/monitoring.ts` — bounded session diagnostics, `drnona:error` и
  adapter для утверждённого внешнего monitoring transport;
- `src/pages/` — отдельный module для каждого маршрута;
- `src/features/catalog/filterProducts.ts` — чистая filter/sort логика;
- `src/features/contact/consultation.ts` — email/copy/contact handoff transport;
- `src/features/selection/SelectionContext.tsx` — persistence и selection state;
- `src/locales/ru.ts` и `src/locales/LocaleProvider.tsx` — ресурс и locale runtime;
- `src/styles.css` — только упорядоченный импорт тематических файлов из
  `src/styles/`; responsive cascade подключается последним;
- `src/router.tsx` — небольшой client-side router без уязвимой внешней
  зависимости;
- `src/data.ts` — типизированный доступ к official content;
- `scripts/sync-official-content.mjs` — повторяемая синхронизация источника.
- `scripts/generate-seo-manifest.mjs` — единый metadata contract;
- `scripts/prerender-routes.mjs` — статический route HTML, sitemap и robots;
- `scripts/check-seo-output.mjs` — build-time SEO/JSON-LD quality gate.
- `scripts/check-seo-http.mjs` — поднимает production preview на свободном
  локальном порту, проверяет HTTP 200 всех sitemap URL и HTTP 308 для `/main`.
- `src/pages/CatalogPage.tsx` — настоящий lazy route module каталога;
- `src/data.ts` — ленивые product/official data loaders на стабильных Promise;
- `scripts/generate-runtime-content.mjs` — компактная home/claims runtime
  проекция без полного source dataset;
- `scripts/check-performance-budget.mjs` — gzip/Brotli budget и контроль
  initial preload graph.
- `scripts/measure-runtime-performance.mjs` — production-preview V8
  parse/script/task measurements в headless Chromium.
- `scripts/check-frontend-architecture.mjs` — anti-monolith, page-module и
  dynamic-import gate.
- `vite.config.ts` — ранний malformed-path guard для dev/preview и постоянный
  `/main` redirect.
