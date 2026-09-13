# Business logic audit V2 — Task 3 baseline, rollback and verification

**Status:** PASS  
**Scope:** Task 3 only  
**Captured:** 2026-09-13 22:40 EEST  
**Production mutation:** none  
**Machine-readable baseline:** [business-logic-baseline-2026-09-13.json](business-logic-baseline-2026-09-13.json)

## Reproducible baseline

| Surface | Git / deployment | Current evidence |
|---|---|---|
| Catalogue | `main` at `659359c987bbb7f8ccb42934b5bce025ce7d58ee`; Vercel `dpl_FFF8F9xyoeA2Z99j44UjohAgU4GR` | Worktree was clean at capture. Production deployment is `READY`. Current GitHub run `34775413716` failed only at full Playwright after earlier validation, typecheck, lint, unit, build, CSP, performance and request-boundary steps passed. |
| CRM | `main` at `9e5daa09060b2f531c4b93b85bfd856cfde43d88`; Vercel `dpl_HjYP5L3jnbeSReGqw3r5HYuz2enj` | Worktree was clean at capture. Production deployment is `READY`. GitHub run `34727832117` passed. The verified CRM suite contains 181 tests. |
| PostgreSQL | two Prisma migrations | `prisma migrate status` reports the schema is up to date. The applied migration set is `20260902182949_init_crm_schema` and `20260912000000_results_fixed_prices`. |

Both GitHub repositories currently lack a verified `main` branch protection rule. This remains the documented `P1-CI-PROTECTION` release blocker; Task 3 does not change repository settings.

### Current catalogue CI failure

The failed catalogue run is recorded rather than relabelled as green:

- two desktop/mobile failures expect the old generic Romanian alt pattern `Imaginea produsului`; the rendered value is a concrete Romanian product alt;
- one `tablet-768` catalogue visual baseline differs;
- 358 E2E tests passed and 3 failed in that run.

These failures require a separately scoped UI/test-baseline decision. They do not invalidate Task 3 acceptance, whose purpose is to capture the state and make later work reversible. They do prevent describing the complete catalogue CI as PASS.

## Sanitized production counts

Authenticated, read-only browser checks against the CRM production alias returned HTTP 200 with no runtime error:

| Route | Sanitized result |
|---|---:|
| `/orders` | 20 total requests/orders |
| `/clients` | 9 clients |
| `/catalog` | 50 products; 50 with configured prices |
| `/results` | 5 completed orders in the default visible range |

The results route still displays its required partial-data warning for historical orders without immutable price snapshots. No customer identity, contact detail, comment, IP address, Telegram payload, credential, token, or connection string was copied into evidence.

## Rollback baseline

### Application deployment

1. Record the current commit and deployment ID before each rollout.
2. Keep the previous `READY` Vercel deployment available.
3. If smoke checks fail, re-promote the previous deployment or revert the owning commit.
4. Recheck both catalogue and CRM contract sides after rollback; never assume they deploy atomically.

### Database schema

1. Before migration, create a Neon branch or a verified logical backup and record only its non-secret identifier in private operational evidence.
2. Run `prisma migrate deploy` with the direct migration URL. Never run `prisma db push` against production.
3. Use expand → migrate/backfill → verify → contract for breaking changes.
4. Prefer a forward repair migration. Restore a snapshot only when destructive rollback is unavoidable and the restore has been rehearsed.
5. Compare sanitized counts and critical aggregates before and after migration.

### Data and demo fixtures

1. Use deterministic fixture IDs or an explicit demo marker.
2. Dry-run cleanup and report only sanitized counts before deletion.
3. Never mass-delete real customer records as part of demo rollback.
4. Verify order totals, price snapshots, client counts and analytics after cleanup.

## Reusable smoke matrix

| ID | Surface | Required result | Current baseline |
|---|---|---|---|
| AUTH-ANON | CRM protected pages/actions | 401 without credentials; incomplete production config fails closed | PASS for protected production pages |
| AUTH-VALID | dashboard, orders, clients, catalog, results | 200 with valid credentials and no runtime error | PASS |
| FORM-RU / FORM-RO | public application | identical contract behavior with `ru-MD` / `ro-MD` | defined; do not submit to production during a baseline-only task |
| FORM-INVALID | invalid body/fields | safe 400; no DB row and no Telegram message | defined |
| PERSIST-FIRST | application service | database transaction completes before delivery | source verified |
| TELEGRAM-SUCCESS | delivery | 201, one request, one Telegram mapping | run in isolated approved smoke environment |
| TELEGRAM-FAIL | provider failure | persisted request plus `502 DELIVERY_FAILED`; no fabricated success | source/test verified |
| WEBHOOK | incoming Telegram update | valid secret and mapping update one order; invalid input cannot mutate | defined for Tasks 7 and 14 |
| IDEMPOTENCY | retry/concurrency | one order and one delivery per accepted key | known gap, Task 5 |
| RATE | abuse limit | consistent across instances with `Retry-After` | known gap, Task 6 |
| ANALYTICS | results/dashboard | aggregates match DB; missing prices remain disclosed | PASS for current read-only runtime |

Production success/failure submissions are deliberately absent from this task because Task 3 forbids production mutation. Later tasks must use isolated fixtures or explicit live-smoke authorization and must clean up only deterministic demo records.

## External decisions and approvals

| Decision | Owner | Required before |
|---|---|---|
| Distributed KV/Redis or WAF provider, cost and failure policy | product + engineering | Task 6 |
| Monitoring provider, alert threshold and recipient | product + operations | Task 8 |
| SMS/WhatsApp/Viber provider and customer consent | product + legal | Task 25 |
| New external API, shared package or publication service | owner + engineering | any integration work |
| Moldova consent text, legal recipient and retention policy | legal + product | `P0-CONTACT` closure |
| Claims, certificates, media rights and publication scope | legal + content | production release |
| Analytics/cookie/monitoring privacy policy | product + legal | provider integration |
| Production origin and required GitHub branch checks | engineering + owner | release approval |

The current release registry still contains seven open blockers: `P0-CONTACT`, `P0-LEGAL`, `P1-MEDIA-RIGHTS`, `P1-CONTENT`, `P1-RANKING`, `P1-CI-PROTECTION`, and `P1-SEO-ORIGIN`. Task 3 does not resolve them.

## Evidence storage rules

- Store commit SHAs, CI run/job IDs, deployment IDs, timestamps, status codes, migration names and sanitized counts.
- Never store credentials, tokens, connection strings, authorization headers, customer names, phones, emails, comments, IP addresses or raw Telegram payloads.
- Keep screenshots, traces, Playwright reports and runtime logs out of Git unless they are deliberately sanitized and required as durable evidence.
- Store production backup identifiers and restore instructions in the approved private operational system, not in this public repository.
- Record failures honestly. `PASS` here means the rollback and verification baseline is complete; it does not mean the project, release gates, or current catalogue CI are green.

## Task 3 disposition

**PASS.** Clean pre-task SHAs, CI state, production deployment IDs, migration state, sanitized record counts, rollback paths, smoke coverage, approval dependencies and evidence rules are captured without production mutation or secret/PII exposure.

Block 0 is complete. The next permitted unit is **Task 4 — Verify and harden CRM route authentication**.
