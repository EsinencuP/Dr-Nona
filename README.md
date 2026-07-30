# Dr. Nona Website

Статус проекта: **frontend QA candidate / production release blocked**.

Актуальный статус, блокеры и проверяемая версия описаны в
`docs/RELEASE_STATUS.md`. Успешная сборка не означает готовность к production.

Текущий источник содержит 10 товарных записей: 7 опубликованы, 3 остаются
редакционными черновиками из-за незаполненных обязательных полей. Также
подключено 137 записей официального контента. Реализован multi-page
React/TypeScript сайт электронного каталога:
главная, каталог, продукт, Lord, About, история, Halo Complex™, Blog/News,
подборка и официальные информационные маршруты. Проект не является
интернет-магазином и не содержит корзину, checkout, оплату или авторизацию.

## Поддерживаемая среда

- Node.js `22.23.1` — единый источник версии: `.nvmrc`.
- npm `10.9.8` — зафиксирован в `package.json#packageManager`.
- CI: GitHub Actions `ubuntu-latest` с теми же Node и npm.
- Локальная разработка поддерживается на Windows, macOS и Linux.

Другие major-версии Node/npm не входят в проверяемую матрицу. Перед началом
работы проверьте `node --version` и `npm --version`.

## Локальный запуск

```sh
npm ci
npm run dev
```

`npm ci` воспроизводит точное состояние `package-lock.json`; `npm install` не
используется как стандартная команда подготовки репозитория.

## Production build

Сборка production-артефакта:

```sh
npm ci
npm run build
```

Build-only инструменты, включая Cheerio, находятся в `devDependencies`.
Результат в `dist/` является статическим артефактом и не требует установки
Node-зависимостей в runtime-среде.

Команда также создаёт ignored-отчёты в `artifacts/reports/` с commit SHA,
состоянием рабочего дерева, environment и фактическими счётчиками данных.
GitHub Actions прикладывает их к конкретному commit как CI artifact. Перед сборкой
автоматически проверяются полнота опубликованных товарных карточек и реестр
медицинских и health claims. После bundling генерируются route-specific HTML,
canonical, OG/Twitter, JSON-LD, `sitemap.xml`, `robots.txt` и
`docs/SEO_REPORT.md`. Legacy `/main` отвечает HTTP 308 на `/`; build
дополнительно запрашивает каждый URL из sitemap через production preview.
Большие content datasets загружаются по маршруту; отчёт raw/gzip/Brotli и
initial preload graph создаётся в `docs/PERFORMANCE_REPORT.md`.

Для production SEO-сборки необходимо передать утверждённый origin.

macOS/Linux:

```sh
RELEASE_MODE=production SITE_URL=https://approved-domain.example npm run build
```

Windows PowerShell:

```powershell
$env:RELEASE_MODE="production"
$env:SITE_URL="https://approved-domain.example"
npm run build
```

Без `SITE_URL` production-режим останавливается, чтобы canonical не указывал на
localhost.

Перед production release выполните отдельный блокирующий gate:

```sh
npm run release:check
```

Команда возвращает ненулевой exit code, пока в `docs/release-status.json`
остаются P0 или P1.

## Проверки

```sh
npm run architecture:validate
npm run toolchain:validate
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
npm run market:validate
npm run content:validate
npm run claims:validate
npm run security:validate
npm run security:http-validate
npm run security:runtime
npm run runtime:generate
npm run seo:generate
npm run seo:validate
npm run seo:http-validate
npm run performance:validate
npm run performance:runtime
```

`npm run ci` выполняет весь набор последовательно. GitHub Actions запускает
тот же quality gate для pull requests и `main`; детали находятся в
`docs/CI.md`.

Контент официального источника синхронизируется только через staging:

```sh
npm run sync:content
npm run sync:content:validate -- --candidate "artifacts/content-sync/CANDIDATE"
npm run sync:content:promote -- --candidate "artifacts/content-sync/CANDIDATE" --approve "FINGERPRINT" --reviewed-by "REVIEWER"
```

Первая команда никогда не перезаписывает `src/data`; promotion требует
повторной schema/completeness validation и явного approval точного fingerprint.

## Документация

- `docs/MASTER_DESIGN_FOUNDATION.md` — главный источник истины.
- `docs/RELEASE_STATUS.md` — единственный актуальный release status и список
  P0/P1-блокеров.
- `artifacts/reports/BUILD_REPORT.md` — локально созданное и ignored evidence
  сборки; в CI публикуется как artifact конкретного commit.
- `docs/CI.md` — состав automated gates и требуемая GitHub branch protection.
- `docs/CLAIMS_REVIEW.md` — реестр, статусы, publication gate и handoff
  юридическому reviewer для Молдовы.
- `docs/SECURITY_HEADERS.md` — CSP rollout, deployment headers, external
  origins, cache policy и automated gates.
- `docs/RESPONSIVE_QA.md` — обязательная viewport-матрица, responsive
  assertions, visual baselines и правила их обновления.
- `docs/CONTENT_SYNC.md` — staged import, schema/completeness gates, review,
  fingerprint approval и rollback.
- `artifacts/reports/PRODUCT_CONTENT_REPORT.md` — ignored-отчёт полноты
  товарного контента и редакционных статусов.
- `docs/MOLDOVA_MARKET.md` — подтверждённый Moldova-контакт, правила
  сертификатов и оставшиеся рыночные approvals.
- `docs/SEO_REPORT.md` — автоматически проверенные route metadata,
  prerendering и structured-data counts.
- `docs/PERFORMANCE_REPORT.md` — initial payload budget и split chunks.
- `docs/RUNTIME_PERFORMANCE_REPORT.md` — production V8 parse/script/task
  measurements.
- `docs/FRONTEND_ARCHITECTURE.md` — feature boundaries, route modules и
  автоматический anti-monolith contract.
- `docs/PROJECT_BRIEF.md` — продуктовый бриф и границы проекта.
- `docs/DESIGN.md` — дизайн-направление, правила и незакрытые токены.
- `docs/DESIGN_CONTRACT.md` — evidence, Keep / Change / Do not copy и quality gate.
- `docs/DESIGN_SKILL_STACK.md` — активная методология и роли дизайн-скиллов.
- `docs/COLOR_SYSTEM.md` — рабочая Mineral Light palette и тема Lord.
- `docs/CONTENT_MODEL.md` — модель контента и структура данных каталога.
- `docs/PAGE_INVENTORY.md` — карта page parity официальной платформы.
- `docs/REFERENCE_ANALYSIS.md` — анализ официального сайта.
- `docs/REF_IMAGE_ANALYSIS.md` — анализ локальных визуальных референсов.
- `docs/DECISIONS.md` — журнал утверждённых решений.
- `docs/OPEN_QUESTIONS.md` — вопросы, которые требуют ответа.
- `docs/IMPLEMENTATION_READINESS.md` — ворота готовности перед началом кода.
- `docs/IMPLEMENTATION_HANDOFF.md` — архитектура и ограничения реализации.
- `docs/QA_REPORT.md` — актуальный QA-индекс, привязанный к build evidence.
- `docs/audit/2026-07-26/AUDIT_REPORT.md` — итоговый аудит требований,
  source parity, responsive, accessibility, motion и production blockers.
- `docs/WEB_PROMPT.md` — черновик будущего handoff-промпта; не запускать до
  закрытия блокирующих решений.

## Правило приоритета

При конфликте документов действует следующий порядок:

1. Последнее явно утверждённое решение пользователя.
2. `docs/RELEASE_STATUS.md` для release status и блокеров.
3. `docs/MASTER_DESIGN_FOUNDATION.md`.
4. Официальный источник Dr. Nona после редакционной проверки.
5. Остальные исследовательские документы.

Любая неоднозначность оформляется как `TODO`, а не превращается в
неподтверждённый продуктовый факт.
