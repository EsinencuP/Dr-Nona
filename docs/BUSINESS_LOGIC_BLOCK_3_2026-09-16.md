# Business logic Block 3 — Tasks 14–18

**Date:** 2026-09-16  
**Repositories:** Dr Nona catalogue + Dr-Nona-CRM  
**Status:** local implementation and validation PASS; CI/deployment evidence is recorded after both repository gates finish.

| Task | Result | Main evidence |
|---:|---|---|
| 14 | PASS | Telegram status mutations resolve the unique message mapping, use the shared audited state machine, and do not depend on a localized status line. |
| 15 | PASS | The order, idempotency record, and bounded Telegram outbox are atomic; uncertain outcomes require review; operator retry/cancel exists; accepted wording is truthful. |
| 16 | PASS | Versioned first/last/direct attribution, normalized vs raw dimensions, locale-safe entry path, consent boundary, and approved product history are validated end to end. |
| 17 | PASS | The CRM dashboard exposes a 60-minute live `NEW` SLA, local today/week counts, overdue references, empty/loading/error behavior, and Europe/Chisinau DST tests. |
| 18 | PASS | The approved manager-only command set is chat- and sender-authenticated, rate-limited, deduplicated, redacted, audited, and reuses the status service. |

## Cross-repository contract changes

- Application requests may include `attribution.version = 1`; legacy bounded UTM fields remain compatible.
- Catalogue responses accept `201` and `202` as persisted application success. `telegram: pending|failed` describes internal delivery and no longer converts a saved application into a false submission failure.
- RU and RO success text now states that the application was accepted and saved. It does not claim that Telegram received it.
- Product view history is session-only, capped at 20, and filtered against the published catalogue before submission and again by the CRM schema.

## Operational decisions

- Status lifecycle: `NEW → PROCESSING → DELIVERY → DONE`, with `CANCELLED` allowed from non-terminal states and `PROCESSING → DONE` allowed for non-delivery requests.
- Telegram retry: three bounded attempts; explicit `429/5xx` can retry; timeout/network ambiguity requires human review to prevent duplicates.
- SLA: 60 elapsed minutes, 24/7, `Europe/Chisinau`, internal only. Working-hours SLA remains a future product decision.
- Telegram role: one allowlisted `manager` role. Commands are `/status` as a reply, `/order <uuid>`, `/overdue`, and `/help`. Returned data excludes customer PII.

## Database evidence

- Additive migration: CRM `database/migrations/20260916010000_operational_workflows`.
- Rehearsal: expiring Neon branch `block3-operational-rehearsal-2026-09-16`, based on `development`.
- Rehearsal sequence: forward migration, migration-local `rollback.sql`, migration-ledger cleanup, and forward reapply all completed successfully; `prisma migrate status` then reported the branch up to date.
- Development migration: applied successfully after rehearsal.
- Production rollback point: expiring Neon branch `block3-pre-migration-2026-09-16` (`br-square-mode-aya0xt3k`), created from `main` before deployment and scheduled to expire on 2026-09-23.
- Rollback does not backfill production data or fabricate historical `firstActionAt` values.

## Local validation evidence

- Catalogue: repository/build gates PASS; 26 unit files and 201 unit tests PASS; full Chromium desktop/mobile E2E PASS with 364 passed and 18 intentionally skipped.
- CRM: Biome check, TypeScript validation, and production build PASS; 22 test files and 236 tests PASS, including PostgreSQL integration coverage.
- Contact route: 14/14 focused desktop/mobile application tests PASS; restricted-storage and attribution audit coverage PASS.
- Performance guard: the contact route remains a bounded lazy chunk (39.25 kB raw / 11.37 kB gzip in the verified build) after structured attribution validation.
- Graphify: `npm run graphify:cross-repo` rebuilt the merged catalogue/API/CRM/database map after the final source changes (2,532 nodes, 4,903 links).

Block 3 does not change the catalogue release blockers in `release-status.json`. The next workflow item is Task 19 in Block 4, and it still requires the explicit ranking decision named in that task.
