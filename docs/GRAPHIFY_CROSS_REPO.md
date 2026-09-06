# Graphify cross-repository navigation

Дата сборки: 2026-09-06.

В проект добавлен project-scoped Graphify для навигации по трём связанным областям:

- `Dr Nona` — e-каталог, product data, routes, UI и same-origin API proxy;
- `Dr-Nona-CRM` — CRM UI, API handlers и application service;
- `Dr-Nona-CRM/database` — Prisma schema и checked-in migration.

CRM и Database остаются отдельным source of truth. В каталог не копируются Prisma schema, migrations, CRM UI или database credentials. В граф добавляются только пути и связи, необходимые для навигации.

## Как обновить граф

Из корня каталога:

```powershell
.\tools\graphify\build-cross-repo-graph.ps1
```

Результаты появляются в игнорируемом каталоге `graphify-out/`:

- `graph.json` — объединённый graph/query source;
- `graph.html` — визуализация узлов и связей;
- `GRAPH_REPORT.md` — обзор communities и hubs.

Временные extraction outputs создаются в `artifacts/graphify-build/`, удаляются после успешной сборки и не должны коммититься. Операционный protocol для агента описан в [`GRAPHIFY_AGENT_WORKFLOW.md`](./GRAPHIFY_AGENT_WORKFLOW.md): query/path/affected выполняются до чтения исходников, а cross-repo изменения завершаются полной пересборкой.

## Текущее покрытие

Последняя structural-only сборка:

| Источник | Узлы | AST-связи |
|---|---:|---:|
| E-catalog | 1 038 | 1 965 |
| CRM + database | 951 | 1 968 |
| Cross-repo merged graph | 2 134 | 3 950 |
| Explicit contract / workflow links | — | 22 |

The declared node `docs/DR_NONA_PROMPT_WORKFLOW.md` is connected to the deep UI audit, visual foundation, responsive matrix and typography/accessibility checks. Querying `Dr Nona improvement prompt workflow` therefore brings the six-prompt contract and its main validation surfaces into the same navigation neighborhood.

The completed [Prompt 2 report](PROMPT_2_DESIGN_SYSTEM_REFINEMENT_2026-09-06.md) has its own declared `PASS` node, connected to the workflow, FormulaPage and four E2E suites. Query `Prompt 2 Design System Refinement` to retrieve its evidence, scope limitations and Prompt 3 handoff. The report includes CSS ownership paths that code-only extraction does not index as stylesheet nodes.

Проверка Graphify multigraph diagnostic: нет dangling endpoints, self-loops, duplicate endpoint edges или collapsed edge groups. Graphify сообщает предупреждения для reference nodes без `source_file`; они не создают dangling edges и сохранены для архитектурной навигации.

## Что соединено явно

`tools/graphify/cross-repo-links.json` фиксирует доказанные по исходникам отношения:

```text
catalog application-client
  → catalog /api/applications proxy
  → CRM applications POST route
  → CRM applications handler
  → application service
  → application-db / Prisma client
  → database/schema.prisma
  → checked-in SQL migration
```

Также зафиксированы зеркальный application contract и связь product snapshots с application payload/ProductCatalog context. Такие связи помечены `DECLARED` и содержат evidence строкой; они не выдаются за автоматически найденные AST relations.

## Ограничения

Сборка использует `--code-only`: она детерминирована, локальна и не отправляет код, CRM или database content во внешний LLM. Поэтому JSON datasets и `schema.prisma`, которые текущий AST extractor не представил как полноценные nodes, добавляются узкими declared nodes с evidence. Полный semantic pass для docs/media не включён и требует отдельного решения по обработке данных и API keys.

Граф не заменяет build, tests, browser QA, visual audit, localization review, legal claims review или production deployment validation. Он сокращает навигационный контекст и помогает быстро найти ownership и data flow.
