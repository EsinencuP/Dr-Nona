# Repository rules for Dr. Nona Moldova

This file defines how an AI agent may change this repository. Read it before editing code, data, assets or documentation.

## Project purpose

Dr. Nona Moldova is an informational electronic catalogue built with React, TypeScript and Vite. It is not an online store. The repository has no checkout, payment, authentication, account area, database or application backend. A thin same-origin serverless proxy forwards approved contact-form payloads to the separate Dr-Nona-CRM backend.

Production release is blocked. A successful build does not grant release approval.

## Sources of truth

Use sources in this order:

1. The user's latest direct decision
2. `AGENTS.md`
3. `docs/release-status.json`
4. `docs/RELEASE_STATUS.md`
5. `docs/PROJECT_STATUS.md`
6. Specialized documents in `docs/`
7. Current code and tests
8. Git history as historical context only

When sources conflict, record the conflict, follow the higher source and do not invent the missing answer.

## Allowed actions

You may perform these actions without separate approval when they stay inside the assigned task:

- Read and analyze the repository
- Fix confirmed defects
- Remove proven unused files
- Update tests and documentation with code changes
- Repair broken repository links
- Improve internal boundaries without changing behavior
- Run validation, build and test commands
- Remove generated artifacts from Git

## Actions that require explicit approval

Ask before adding or changing:

- Features, routes or product flows
- Product scope or published assortment
- Localization or public copy
- Contacts, legal entity or consent text
- Claims, certificates, ratings or testimonials
- Analytics, cookies or monitoring providers
- External APIs, backend services, customer relationship management or email transport
- Production dependencies, domain or release-ready status

## Absolute prohibitions

Do not add cart, checkout, payment, prices, discounts, authentication or account features. Do not fabricate form success, contacts, testimonials, ratings, certificates, medical claims or scientific claims. Do not publish draft products or pending/rejected claims. Do not replace official product assets with AI reconstructions.

Never commit secrets, `dist/`, runtime reports, coverage, test results or archives. Do not bypass errors with `any`, `ts-ignore`, disabled lint rules, empty error handling or deleted tests. Do not mark a release ready while P0 or P1 blockers remain.

The separate CRM and database source of truth is `https://github.com/EsinencuP/Dr-Nona-CRM`. Do not copy CRM UI, Prisma schema, migrations or Telegram credentials back into this repository.

## Unknown data

Mark unknown information as `TODO`, `NOT VERIFIED` or `PENDING APPROVAL`. Never convert an assumption into a fact.

## Required verification

Run the checks relevant to the change:

```powershell
npm run repository:validate
npm run architecture:validate
npm run typecheck
npm run lint
npm run test
npm run build
```

Run `npm run test:e2e` for UI or routing changes. Run `npm run release:check` for release work. Do not bypass a failed release gate caused by documented external blockers.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- `graphify-out/graph.json` is the canonical merged map for the catalog, API proxy, sibling CRM and CRM database schema. For every non-trivial codebase question, architecture investigation, defect fix or file edit, consult this map before opening source files.
- Start with a bounded `graphify query "<question>" --graph graphify-out/graph.json --budget 800`. Use the returned node paths as the candidate file scope; do not recursively scan the repository first.
- Use `graphify path "<A>" "<B>" --graph graphify-out/graph.json` for relationships, `graphify affected "<node>" --graph graphify-out/graph.json --depth 2` before editing an interface, and `graphify explain "<concept>" --graph graphify-out/graph.json` for one focused concept. Increase the query budget only when the scoped result is insufficient.
- After the graph identifies candidate files, read only those files and the directly referenced tests/types/config needed to verify the change. `rg` or broad `Get-Content` is a fallback for a missing graph node, a stale graph, or a deliberately requested repository-wide audit.
- Before editing, run one query for the requested behavior and one `affected` traversal for the node or symbol that will change. Record the owning route/module, persistence boundary and relevant tests from those results.
- After changing catalog, API, CRM, database or architecture tooling, run `npm run graphify:cross-repo`. Do not use `graphify update .` alone for cross-repo work: it updates only the catalog graph and would discard the CRM/database side of the map.
- If the graph is missing or its source paths no longer exist, rebuild it before investigation. If graph output conflicts with source, source wins; finish the scoped work and rebuild the graph immediately afterwards.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- For local-only catalog edits where a full cross-repo refresh is unnecessary, `graphify update .` is acceptable as a temporary refresh; the next cross-repo task must still run `npm run graphify:cross-repo`.
- For questions spanning the e-catalog, CRM, API or database, the authoritative command is `tools/graphify/build-cross-repo-graph.ps1` (also available as `npm run graphify:cross-repo`); it rebuilds the merged graph and keeps sibling repositories separate.
