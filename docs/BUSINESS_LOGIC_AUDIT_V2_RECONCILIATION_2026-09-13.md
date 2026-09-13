# Business logic audit V2 — Task 1 reconciliation

**Status:** PASS  
**Scope:** Task 1 only  
**Catalog commit audited:** `3e77119c8732d9ab2752c0e5b8100cb869b1e2df`  
**CRM commit audited:** `9e5daa09060b2f531c4b93b85bfd856cfde43d88`  
**Machine-readable evidence:** [business-logic-audit-v2-reconciliation.json](business-logic-audit-v2-reconciliation.json)

## Purpose

This document reconciles the external `business_logic_audit_v2.md` with the current catalogue, CRM, Graphify map, repository release status, automated validation, and deployed CRM behavior. It records the audit as an input rather than treating its statements as confirmed defects.

Task 1 changes no production UI, application behavior, database schema, production data, provider configuration, or release blocker. Tasks 2 and 3 have not started.

## Result

All 26 V2 findings have one current status and direct evidence:

| Status | Count | Meaning in this reconciliation |
|---|---:|---|
| `CONFIRMED` | 8 | The core gap exists in the audited commits. |
| `PARTIAL` | 10 | A meaningful implementation exists, but the proposed target is incomplete or the audit premise is overstated. |
| `RESOLVED` | 2 | Current code and runtime evidence close the stated defect. |
| `FALSE_POSITIVE` | 0 | No item is discarded completely; stale items retain either resolved or partial follow-up value. |
| `DECISION_REQUIRED` | 6 | The item is a new feature or architecture choice that cannot start from audit text alone. |
| **Total** | **26** | Complete V2 coverage. |

## Corrected system boundary

The current production path is:

```text
RU/RO catalogue form
  -> same-origin catalogue POST /api/applications
  -> bounded proxy to CRM_APPLICATIONS_API_URL
  -> CRM validation and application service
  -> PostgreSQL transaction
  -> Telegram delivery
  -> CRM dashboard, orders, clients, catalogue and results
```

The catalogue no longer owns the Telegram delivery or CRM persistence implementation. Its endpoint is a thin bounded proxy. CRM persistence precedes Telegram delivery, so a Telegram outage does not erase the CRM application. The missing parts are monitoring, automatic retry/outbox behavior, and persistent idempotency.

## Full finding matrix

| ID | Current status | Severity | Current conclusion | Planned task |
|---|---|---|---|---:|
| I-1 | `RESOLVED` | closed | Basic Auth protects CRM routes and server mutations; anonymous production checks return 401. | 4 |
| I-2 | `CONFIRMED` | P1 | Idempotency key is syntax-checked but not persisted or replayed. | 5 |
| I-3 | `CONFIRMED` | P0-CONTACT | Rate counters live in one process and are not distributed across serverless instances. | 6 |
| I-4 | `RESOLVED` | closed | Quantity travels through `items`, CRM persistence, Telegram, and CRM views. | 9 |
| I-5 | `PARTIAL` | P2 | UI uses `globalThis`; application persistence still owns a second module Prisma client. | 10 |
| I-6 | `CONFIRMED` | P1 | Order type/status remain unrestricted strings in PostgreSQL. | 11 |
| I-7 | `CONFIRMED` | P1 | Repeat-phone UPSERT overwrites canonical client fields without revision history. | 12 |
| I-8 | `CONFIRMED` | P2 | Dates reject the past but have no approved upper horizon. | 13 |
| II-1 | `PARTIAL` | P2 | Telegram message ID maps to the DB, but status text replacement still gates the mutation. | 14 |
| II-2 | `PARTIAL` | P2 | Order quantities work; saved selection itself remains a slug list. | 9 |
| II-3 | `CONFIRMED` | P1-RANKING | Public popularity uses a static rank with no approved demand source. | 19 |
| II-4 | `CONFIRMED` | P3 | Search is substring-based; fuzzy behavior remains an optional evidence-led improvement. | 21 |
| II-5 | `PARTIAL` | P2 | URL UTM capture already exists; attribution semantics and normalization remain informal. | 16 |
| II-6 | `PARTIAL` | P1 | DB-first persistence exists; alerts, outbox, and retry do not. | 8 and 15 |
| II-7 | `PARTIAL` | P2 | Substantial results analytics exists; transition-time metrics lack status history. | 22 |
| II-8 | `CONFIRMED` | P2 | Webhook secret is checked, but expected Telegram chat ID is not. | 7 |
| III-1 | `DECISION_REQUIRED` | feature | Preferred appointment inputs exist; slot availability and reservation do not. | 24 |
| III-2 | `DECISION_REQUIRED` | feature | SMS/WhatsApp/Viber would be a new approved provider and consent surface. | 25 |
| III-3 | `PARTIAL` | P2 | Dashboard is already substantial; SLA aging is absent. | 17 |
| III-4 | `PARTIAL` | P2 | Client history and totals exist; notes, tags, preferences, and profile audit do not. | 26 |
| III-5 | `PARTIAL` | P3 | Masterclass requests already work in RU/RO and CRM; no published schedule exists. | 27 |
| III-6 | `PARTIAL` | P2 | Shared regional dropdown works; verified regional service personalization does not. | 28 |
| III-7 | `DECISION_REQUIRED` | feature | No controlled export exists; it would add a personal-data egress surface. | 23 |
| III-8 | `DECISION_REQUIRED` | feature | Telegram supports status replies, not CRM query commands. | 18 |
| III-9 | `DECISION_REQUIRED` | P1-RANKING | CRM knows sales aggregates, but no approved publication loop exists. | 20 |
| III-10 | `DECISION_REQUIRED` | P2 | Some contract duplication remains; a shared npm package is one option, not a proven requirement. | 29 |

## Most important corrections to audit V2

1. **CRM authentication exists.** `src/proxy.ts` protects routes and `src/server/crm-auth.ts` protects server actions. Anonymous `/dashboard` and `/orders` returned HTTP 401 on 2026-09-13.
2. **The catalogue is a proxy, not a second Telegram application service.** `api/applications.ts` forwards the bounded request to CRM.
3. **Telegram failure does not erase an application.** CRM writes the database record first and skips Telegram when persistence fails.
4. **Quantity support is implemented.** The public form has 1–99 controls and sends `items[{slug, quantity}]` through the shared schema into `OrderItem`.
5. **Locale and region drift described in V2 is stale.** Both schemas accept `ru-MD` and `ro-MD`; the public form uses the shared Moldova region list.
6. **Masterclass support is already present.** RU/RO form fields, validation, CRM persistence, Telegram formatting, and CRM display exist.
7. **CRM tests exist.** The current CRM repository has 14 test files; the prior verified run passed 181 tests.
8. **Product image coverage is complete at the data-contract level.** All 50 published RU product records contain image paths. Publication rights remain a separate open blocker.
9. **Romanian technical parity is implemented.** The bilingual gate reports 50 RU products, 50 RO products, 64 routes per locale, 35 shared UI keys per locale, and zero technical errors. Human review remains disclosed for 19 products.
10. **The Prisma problem is narrower than claimed.** UI queries use the accepted `globalThis` pattern and pooled runtime URL; only duplicate ownership in the application service needs Task 10 review.

## Confirmed engineering work

The highest-value confirmed engineering tasks from V2 are:

1. Task 5 — persistent concurrency-safe idempotency.
2. Task 6 — distributed rate limiting after provider approval.
3. Task 7 — Telegram chat ID verification.
4. Task 11 — database enums with a rehearsed migration.
5. Task 12 — owner-approved client profile and history policy.
6. Task 13 — owner-approved appointment horizon.

These findings do not automatically resolve repository release blockers. `P0-CONTACT` mixes engineering, privacy, origin, and platform abuse-protection decisions. `P0-LEGAL` and the remaining media, content, ranking, CI-protection, and SEO-origin blockers require their named evidence or owner.

## Current release classification

| Class | Items |
|---|---|
| External or owner-controlled | `P0-LEGAL`, `P1-MEDIA-RIGHTS`, `P1-CONTENT`, `P1-RANKING`, `P1-CI-PROTECTION`, `P1-SEO-ORIGIN` |
| Mixed product and engineering | `P0-CONTACT` |
| Confirmed engineering gaps | `I-2`, `I-3`, `I-6`, `I-7`, `I-8`, `II-8` |
| Optional development | `II-4`, all Level III proposals unless separately approved |

Current GitHub API checks return no configured `main` branch protection for either repository. This confirms the engineering/platform portion of `P1-CI-PROTECTION`; it does not authorize changing repository settings inside Task 1.

## Evidence executed

- Graphify query located the business-logic workflow, CRM schema, analytics, request UI, and relevant tests.
- Production anonymous access: `/dashboard` = 401; `/orders` = 401.
- Catalogue bilingual validation: 50 RU products, 50 RO products, 64 RU routes, 64 RO routes, 35/35 shared UI keys, zero technical errors.
- Catalogue product inventory: 50 published records and 50 image paths.
- GitHub branch protection lookup: absent for `main` in both repositories.
- Source comparison: catalogue and CRM application schemas are semantically aligned; current differences are import/formatting style.
- CRM test inventory: 14 test files; the verified suite passes 181 tests.

## Task 1 disposition

**PASS.** Every V2 item has current evidence, one reconciliation status, a current severity, an owner, repository scope, and a mapped execution task. No implementation was performed. Task 2 and Task 3 remain unstarted.

The next permitted unit is **Task 2 — Freeze cross-repository contracts and ownership**.
