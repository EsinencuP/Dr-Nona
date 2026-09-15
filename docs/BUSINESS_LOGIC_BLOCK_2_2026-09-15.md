# Business logic audit V2 — Block 2

Date: 2026-09-15  
Scope: Tasks 9–13  
Status: **PASS**

## Result

The catalogue and CRM now share an explicit quantity-aware request contract, CRM request code uses one pooled Prisma owner, PostgreSQL enforces order type and status enums, each order preserves the submitted customer snapshot separately from the canonical client profile, and RU/RO appointment requests use the same Chișinău-time horizon on the client and server.

| Task | Status | Implemented evidence | Verification evidence |
| --- | --- | --- | --- |
| 9. Quantity-aware order contract | PASS | `productSlugs` and `items[{slug, quantity}]` must describe the same unique set; integer quantity is limited to 1–99 and conflicting representations are rejected. Legacy `productSlugs`-only requests remain compatible for one release window with quantity 1 and a structured `application.contract.legacy_order_items` log. Shared fixtures exist in both repositories. | Catalogue tests covered every one of the 50 published products at quantities 1 and 99, duplicate slugs, stale selection and corrupted storage. CRM tests covered request validation, exact persistence, Telegram formatting and rendering data. |
| 10. Prisma ownership and pooling | PASS | `src/lib/prisma.ts` owns the request-time Prisma client through `globalThis`; application persistence receives that owner and no longer creates a second runtime client. A production guard rejects an unpooled Neon `DATABASE_URL`; migrations continue to use `DATABASE_URL_UNPOOLED`. | Singleton identity, local PostgreSQL allowance, pooled Neon acceptance and unpooled production rejection passed. CRM CI exercised PostgreSQL migration, integration tests and production build. |
| 11. Database enums | PASS | Prisma and PostgreSQL now define `OrderType` (`order`, `consultation`, `masterclass`) and `OrderStatus` (`NEW`, `PROCESSING`, `DELIVERY`, `DONE`, `CANCELLED`). Forward and rollback SQL are stored with migration `20260915020000_order_type_status_enums`. | Production-shaped Neon rehearsal completed forward → rollback → forward with all 20 rows preserved. Production accepted all existing rows, exposes both columns as user-defined enums and rejects unsupported values. |
| 12. Client-profile integrity | PASS | New applications link by normalized phone without overwriting trusted canonical fields. Every order stores immutable submitted name, phone, email and region. Managers have an explicit profile editor; each canonical edit writes actor, before/after values and timestamp to `ClientProfileAudit`. Phone collisions are rejected instead of auto-merging clients. | Repeat-client typo, blank optional field, region change, old-order snapshot, audited edit and phone-conflict tests passed. Migration `20260915030000_client_submission_snapshot` was rehearsed with rollback and backfilled all 20 production orders without missing required snapshots. Production UI exposes the order snapshot and canonical profile separately. |
| 13. Appointment horizon | PASS | Both repositories use `Europe/Chisinau`. Consultation requests allow the current local minute through 90 calendar days; masterclass requests allow the next local day through day 180. The shared schema is authoritative and the RU/RO form mirrors native date limits and localized errors without promising availability. | Unit tests covered past, exact boundaries, invalid dates, far-future dates and both DST transitions. Production RU and RO date inputs exposed identical limits: consultation `2026-09-15`–`2026-12-14`, masterclass `2026-09-16`–`2027-03-14`. |

## Business rules recorded in implementation

- The compatibility period for old clients that send only `productSlugs` is one release window. The CRM records each fallback; removal requires a later contract-version decision.
- New application data is an immutable per-order snapshot. It does not silently become canonical client data.
- A manager may update canonical name, phone, email and region only through the explicit CRM action. The actor and timestamp are mandatory audit evidence.
- Identical normalized phone numbers identify the same client. A canonical phone collision is a conflict and does not trigger an automatic merge.
- Appointment values are requests. A manager still confirms actual availability and time.

## Migration and rollback evidence

- Production branch: `br-soft-feather-ay49kkt7`.
- Pre-migration backup branch: `br-red-bread-aywhu26u` (`block2-pre-migration-2026-09-15`), created before production changes.
- Production-shaped rehearsal branch: `br-little-tooth-aynt6j83` (`block2-enum-rehearsal-2026-09-15`), created from the backup branch.
- Applied migrations: `20260915020000_order_type_status_enums`, then `20260915030000_client_submission_snapshot`.
- Both migrations include repository rollback SQL. Forward, rollback and reapply were rehearsed before production application.
- Sanitized production state after migration: 20 orders, 9 clients, 0 profile audits, 0 orders missing a required submitted snapshot. Order statuses remain `NEW=2`, `PROCESSING=2`, `DELIVERY=2`, `DONE=11`, `CANCELLED=3`; all current orders have type `order`.
- Rollback of the snapshot migration removes the audit table and snapshot columns after reverting code that requires them. Rollback of the enum migration casts known enum values back to text after reverting enum-dependent code.

## Verification

### Local and database

- Catalogue: typecheck, lint, 194 Vitest tests, production build and seven serial contact E2E tests passed. The build also passed documentation, architecture, typography, content, claims, security, route and performance gates.
- CRM: typecheck, lint, Biome, 225 Vitest tests, five live PostgreSQL integration tests and production build passed.
- PostgreSQL rejects unsupported enum values. Forward/rollback rehearsals preserved all rows and backfilled all submitted snapshots.
- Graphify was rebuilt across catalogue, API proxy, CRM and database after implementation.

### CI, deployment and runtime

- Catalogue implementation commit: `a2f7b07`; GitHub Actions run `35013492476` passed the complete quality gate.
- CRM implementation commits: `2ba65b1` and formatting-only `aedce91`; GitHub Actions run `35014027149` passed PostgreSQL integration and production build.
- Catalogue deployment `dpl_C7ncbUZuD4omEPWV4RYqP13iABSF` and CRM deployment `dpl_512fgF1oRdpPFJaWnCT4SHj4e3Bq` reached `Ready` and own the canonical aliases.
- Production catalogue `/contactus` and `/ro/contactus` returned `200`; browser verification confirmed symmetric date constraints.
- Production CRM protected routes returned `401` without credentials and `200` with valid credentials. The order detail showed the immutable submitted snapshot; the client detail showed the canonical editor and audit state.
- Runtime smoke did not submit a form, edit a client or otherwise mutate production data.

Block 2 is complete. The next executable workflow item is Task 14 in Block 3. Repository production approval remains governed by `docs/release-status.json`; Block 2 does not change unrelated external release blockers.
