# Business logic audit V2 — Block 1

Date: 2026-09-15  
Scope: Tasks 4–8  
Status: **PASS**

## Result

The public application boundary now authenticates the catalogue proxy, enforces one database-backed quota across serverless instances, persists idempotency state, restricts Telegram management commands to the configured chat, and surfaces delivery health to authenticated CRM operators. No customer-facing test message was sent.

| Task | Status | Implemented evidence | Verification evidence |
| --- | --- | --- | --- |
| 4. CRM route authentication | PASS | One constant-time Basic Auth evaluator is shared by the Next proxy and server actions. Missing or partial production credentials fail closed. Only the two guarded inbound API endpoints bypass CRM UI auth. | Unit auth matrix passed. Production `/dashboard`, `/results`, `/orders`, `/clients`, and `/catalog` returned `401` without credentials and `200` with credentials; the dashboard rendered the health card. |
| 5. Persistent idempotency | PASS | `ApplicationSubmission` stores only SHA-256 key/payload hashes, request ID, delivery state and 24-hour expiry. Concurrent requests acquire one order; replay, conflict, in-progress and definite-failure retry are explicit. | PostgreSQL integration covered concurrency, replay, conflicting payloads, retry after `DELIVERY_FAILED`, and expired-key reuse. Migration `20260913010000_application_idempotency` was deployed after a Neon backup branch was ready. |
| 6. Distributed rate limiting | PASS | Catalogue derives an HMAC client key from Vercel's trusted forwarded address, signs timestamp/client key/body hash, and never forwards the address. CRM verifies the signature before an atomic PostgreSQL fixed-window counter. Missing identity/store fail closed. | Shared crypto vector passed in both repositories. Unit tests covered five attempts per minute, reset, two independent instances, invalid signatures and store failure. PostgreSQL integration proved a shared counter. Production unsigned CRM request returned `403`; signed invalid catalogue payload reached CRM validation and returned `400`, proving the cross-repository signature without data mutation. |
| 7. Telegram chat restriction | PASS | Webhook environment now requires `TELEGRAM_CHAT_ID`; a valid command from any other chat is acknowledged and ignored before DB/provider calls. Logs contain only `chat_mismatch`, never the chat ID or manager name. | 45 webhook tests passed. Production wrong-chat probe returned `200`; Vercel recorded only `{ event: 'webhook.ignored', reason: 'chat_mismatch' }`. |
| 8. Delivery observability | PASS | The authenticated dashboard alerts operators after three consecutive failures in 15 minutes or one `DELIVERY_STARTED` record older than two minutes. It distinguishes DB unavailability, Telegram failure and unconfirmed persistence, and links behavior to the CRM runbook. Logs use request IDs, failure classes and bounded provider codes without payloads, credentials, phones or full URLs. | Trigger, stale-delivery, DB-outage, authorization and recovery tests passed without Telegram delivery. Production dashboard returned `200` with the health card. No production error logs were present after smoke verification. |

## Migration and rollback evidence

- Neon backup branch: `br-dry-dream-ayyxszk5` (`block1-pre-migration-2026-09-15`), parent `br-soft-feather-ay49kkt7`; state was `ready` before migration.
- Applied migrations: `20260913010000_application_idempotency`, `20260913020000_distributed_application_rate_limit`.
- Runtime uses pooled `DATABASE_URL`; Prisma migrations use direct `DATABASE_URL_UNPOOLED`.
- The same `CONTACT_PROXY_SHARED_SECRET` is configured as a Vercel secret for production, preview and development in both projects. Its value is not stored in the repositories or this report.
- Rollback preserves the backup branch and must revert catalogue enforcement before CRM signature enforcement if the boundary is rolled back.

## Verification

### Local and database

- CRM: `db:generate`, `typecheck`, `check`, 204 non-database tests, four live PostgreSQL integration tests, and production build passed.
- Catalogue: TypeScript, proxy unit tests and production build passed; the build included documentation, architecture, typography, content, claims, security, SEO and performance gates.
- Sanitized production counts before and after runtime probes were unchanged: 15 orders, 6 clients, 50 products, 0 application-submission records.

### CI and deployment

- CRM commit range: `1665f2c` through `7383865`; GitHub Actions run `34993858363` passed all checks including PostgreSQL integration and production build.
- Catalogue proxy commit: `dab9c20`; GitHub Actions run `34993742486` passed the complete quality-gate job.
- Catalogue deployment `dpl_3yyERdfmKFBevmHC9KVkgAPzCjZ9` and CRM deployment `dpl_GXQptfNQ92QF85dVgQDgAKuGJtiq` reached `Ready`.

## Operational contract

- `DELIVERY_FAILED` is retryable with the original idempotency key.
- `DELIVERY_STARTED` is an unknown outcome and must be reconciled with Telegram before retrying.
- A successful `DELIVERED` record resets the consecutive-failure alert.
- Operational response steps are owned by `Dr-Nona-CRM/docs/APPLICATION_INTAKE_RUNBOOK.md`.

Block 1 is complete. The next executable workflow item is Task 9 in Block 2.
