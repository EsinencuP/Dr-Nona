# Dr. Nona business logic audit V2 — task workflow

**Created:** 2026-09-13  
**Source:** `C:\Users\User.DESKTOP\.gemini\antigravity\brain\7737fd0e-b347-42b1-a5fd-897f24963d07\business_logic_audit_v2.md`  
**Repositories:** `EsinencuP/Dr-Nona` and `EsinencuP/Dr-Nona-CRM`  
**State:** planning only; no task in this document is started by creating this file.

## How to use this workflow

The user starts exactly one unit of work by saying `таск N`, where `N` is the global task number below. Work must remain inside that task until it is `PASS`, `PARTIAL`, or `BLOCKED` with evidence. A later task must not be started implicitly.

For every task:

1. Read the applicable `AGENTS.md` and query `graphify-out/graph.json` before opening broad source scope.
2. Reverify the audit statement against current source, tests, documentation, deployed behavior, and database state when relevant. The audit is input, not proof.
3. Record the owning repository, files, interfaces, persistence boundary, risks, and affected tests before editing.
4. Make only changes required by the selected task. Do not bundle adjacent backlog items.
5. Preserve the catalogue boundary: no cart, checkout, payment, authentication, account, prices, medical claims, or unapproved publication content.
6. Preserve real CRM records. Use migrations, backups, deterministic test data, and rollback instructions for persistence work.
7. Run the relevant local checks. For CRM production work, also verify CI, deployment, authenticated runtime behavior, and database effects.
8. Run `npm run graphify:cross-repo` after catalogue, API, CRM, database, or architecture changes.
9. Commit only verified changes to the repository that owns them. Never commit secrets, build output, runtime reports, or temporary artifacts.
10. Finish with: status, evidence, files changed, tests, deployment state, remaining risk, and the next permitted task number.

Starting-state labels:

- `OPEN`: the audit concern is currently plausible and needs implementation work.
- `PARTIAL`: a working foundation exists, but the stated target is incomplete.
- `VERIFY_FIRST`: current evidence contradicts or weakens the audit claim; close without code if verification passes.
- `DECISION_REQUIRED`: implementation depends on an explicit business, legal, provider, privacy, or cost decision.

---

# Block 0 — Establish the trustworthy baseline

This block has three tasks. It prevents stale audit statements from becoming unnecessary migrations or new infrastructure.

## Task 1 — Reconcile audit V2 with the current system

**Starting state:** `OPEN`  
**Source coverage:** all I, II, and III findings  
**Repositories:** catalogue + CRM

### Subtasks

1. Build a machine-readable matrix for every audit item: claim, current evidence, status, severity, owner, repository, and source paths.
2. Verify deployed CRM authentication, catalogue-to-CRM request flow, persistence-before-Telegram behavior, RU/RO request parity, image coverage, tests, and current release blockers.
3. Mark every finding `CONFIRMED`, `PARTIAL`, `RESOLVED`, `FALSE_POSITIVE`, or `DECISION_REQUIRED`.
4. Separate product release blockers from engineering defects and optional product development.
5. Publish a corrected audit addendum without rewriting historical evidence.

### Acceptance

- Every V2 item has current evidence and one unambiguous status.
- No implementation is performed in this task.
- The corrected matrix becomes the source for Tasks 2–33.

## Task 2 — Freeze cross-repository contracts and ownership

**Starting state:** `PARTIAL`  
**Source coverage:** I-4, II-2, III-10  
**Dependencies:** Task 1

### Subtasks

1. Diagram the production flow from catalogue form to proxy, CRM handler, Prisma, Telegram, webhook, and CRM views.
2. Inventory request fields, response codes, enum-like values, locale values, product identifiers, and quantity semantics in both repositories.
3. Assign ownership for schema, constants, product projections, API proxy, persistence, Telegram delivery, and analytics.
4. Identify format-only differences separately from semantic drift.
5. Define versioning and compatibility rules for future contract changes.

### Acceptance

- A contract table names the canonical owner for every shared concept.
- Breaking-change and backward-compatibility rules are explicit.
- No shared package or source refactor is started here.

## Task 3 — Establish migration, rollback, and verification baselines

**Starting state:** `OPEN`  
**Source coverage:** all database, security, and deployment items  
**Dependencies:** Tasks 1–2

### Subtasks

1. Capture clean Git SHAs, CI state, production deployment IDs, database migration state, and sanitized record counts.
2. Define database backup and rollback procedures for schema and data changes.
3. Define a reusable smoke matrix for authenticated CRM routes, public application submission, Telegram delivery, and failure behavior.
4. List external approvals needed for KV/Redis, monitoring, SMS/Viber, new APIs, legal copy, analytics, and publication.
5. Define evidence storage rules that exclude credentials and personal customer data.

### Acceptance

- Every later task has a known rollback path and validation checklist.
- Production evidence is reproducible without exposing secrets or PII.
- No production mutation is performed.

---

# Block 1 — Secure and stabilize application intake

This block has five tasks and covers the highest-risk request path.

## Task 4 — Verify and harden CRM route authentication

**Starting state:** `VERIFY_FIRST` because Basic Auth and route protection already exist  
**Source coverage:** I-1  
**Dependencies:** Task 3

### Subtasks

1. Verify anonymous access to every CRM page, server action, API route, static exception, and error route.
2. Review credential comparison, missing/partial configuration behavior, caching, and response headers.
3. Test authenticated and unauthenticated navigation on desktop and mobile.
4. Decide whether current Basic Auth is acceptable for the present team size.
5. Design an RBAC/session migration only if the owner rejects the current protection.

### Acceptance

- Protected data and mutations cannot be accessed anonymously.
- Misconfigured production credentials fail closed.
- Existing protection is documented as accepted or a separately approved replacement is specified.

## Task 5 — Implement persistent request idempotency

**Starting state:** `OPEN`  
**Source coverage:** I-2  
**Dependencies:** Tasks 2–3

### Subtasks

1. Define key scope, TTL, request fingerprint, replay response, pending state, and conflict behavior.
2. Store the key transactionally in PostgreSQL rather than an in-process map.
3. Prevent concurrent identical submissions from creating multiple orders or Telegram messages.
4. Make retries return the original safe result without repeating delivery.
5. Add concurrency, retry, expiry, failure, and malformed-key tests.

### Acceptance

- One idempotency key creates at most one CRM order and one Telegram delivery.
- Same key with different payload is rejected deterministically.
- Failed attempts have an explicit, tested retry policy.

## Task 6 — Add distributed application rate limiting

**Starting state:** `DECISION_REQUIRED` for provider and production dependency  
**Source coverage:** I-3  
**Dependencies:** Tasks 3 and 5

### Subtasks

1. Measure the existing in-process guard and document its serverless limits.
2. Choose an approved store and cost model: Vercel KV, Upstash Redis, or platform WAF controls.
3. Define trusted client-address extraction for the catalogue proxy and CRM deployment.
4. Implement atomic counters, expiry, fail-open/fail-closed behavior, and bounded key cardinality.
5. Test multiple instances, spoofed forwarding headers, store outages, and `Retry-After` responses.

### Acceptance

- Limits apply consistently across serverless instances.
- Untrusted forwarding headers cannot trivially rotate the client identity.
- Provider, privacy, operations, and cost approval are recorded.

## Task 7 — Restrict Telegram webhook updates to the configured chat

**Starting state:** `OPEN`  
**Source coverage:** II-8  
**Dependencies:** Task 3

### Subtasks

1. Add the expected chat identifier to validated server configuration without creating a new secret copy.
2. Compare every webhook message and callback chat against the configured identifier.
3. Ignore mismatched chats without leaking configuration details.
4. Preserve secret-token validation and timing-safe handling where applicable.
5. Add valid chat, invalid chat, missing config, and malformed update tests.

### Acceptance

- A valid webhook secret from the wrong chat cannot mutate an order or Telegram message.
- Production fails closed when required webhook configuration is incomplete.

## Task 8 — Add delivery failure observability

**Starting state:** `DECISION_REQUIRED` for monitoring provider and notification destination  
**Source coverage:** II-6 short path  
**Dependencies:** Task 3

### Subtasks

1. Define measurable failure events for database writes, Telegram delivery, webhook processing, and repeated retries.
2. Remove sensitive payloads, tokens, phones, and full outbound URLs from telemetry.
3. Configure an approved alert threshold and recipient for sustained `/api/applications` failures.
4. Add a health/runbook view that distinguishes persistence failure from Telegram failure.
5. Test alert triggering and recovery without sending customer-facing test messages.

### Acceptance

- Operators receive an actionable alert for sustained delivery failures.
- Logs contain request IDs and failure classes without PII or credentials.

---

# Block 2 — Protect data contracts and persistence

This block has five tasks focused on data correctness and safe migrations.

## Task 9 — Complete the quantity-aware order contract

**Starting state:** `VERIFY_FIRST` because `items[{slug, quantity}]` and quantity controls already exist  
**Source coverage:** I-4 and II-2  
**Dependencies:** Task 2

### Subtasks

1. Verify selection storage, form controls, RU/RO labels, client validation, shared schema, CRM persistence, Telegram formatting, and CRM rendering.
2. Test all 50 products, quantities 1 and 99, duplicate slugs, stale selections, and corrupted local storage.
3. Decide the compatibility lifetime of legacy `productSlugs`.
4. Remove silent quantity loss paths while preserving safe old clients if required.
5. Add cross-repository contract fixtures and regression tests.

### Acceptance

- The selected quantity is identical in UI, request, DB, Telegram, and CRM.
- Duplicate or conflicting representations are rejected rather than silently changed.

## Task 10 — Unify Prisma client ownership and pooling

**Starting state:** `PARTIAL` because CRM UI uses `globalThis`, while the application service owns another module singleton  
**Source coverage:** I-5  
**Dependencies:** Task 3

### Subtasks

1. Inventory every `PrismaClient` construction and generated client import.
2. Establish one runtime owner for pooled application queries and one direct URL for migrations.
3. Remove duplicate client factories without crossing server/client module boundaries.
4. Verify local hot reload, Vercel reuse, connection limits, disconnect behavior, and test injection.
5. Add a guard that prevents accidental unpooled runtime configuration.

### Acceptance

- Production request code has one documented Prisma ownership pattern.
- Runtime uses the pooled URL and migrations use the direct URL.
- Existing database tests and deployment migrations pass.

## Task 11 — Migrate order type and status to database enums

**Starting state:** `OPEN`  
**Source coverage:** I-6  
**Dependencies:** Tasks 3 and 10

### Subtasks

1. Audit production values and stop if any unknown type or status exists.
2. Define Prisma enums and a reversible PostgreSQL migration.
3. Update TypeScript mappings, query filters, fixtures, and Telegram transitions.
4. Rehearse migration and rollback against a production-shaped database copy.
5. Deploy migration before code that requires enum-only behavior.

### Acceptance

- PostgreSQL rejects unsupported order types and statuses.
- All existing rows migrate without coercion or loss.
- Rollback and forward deployment ordering are documented and tested.

## Task 12 — Prevent silent client-profile corruption

**Starting state:** `DECISION_REQUIRED` for canonical customer-data rules  
**Source coverage:** I-7 and III-4 foundation  
**Dependencies:** Tasks 3 and 11

### Subtasks

1. Define whether new form submissions may update name, phone presentation, email, region, and preferred contact time.
2. Preserve the raw details submitted with each order even when the canonical client profile differs.
3. Add explicit manager editing and an audit trail if canonical fields can change.
4. Define merge and conflict handling for shared or changed phone numbers.
5. Test repeat clients, typos, blank optional fields, region changes, and rollback.

### Acceptance

- A repeat application cannot silently destroy previously trusted profile data.
- Managers can see the submitted values and the canonical values separately.
- Every canonical profile edit has actor and timestamp evidence.

## Task 13 — Set the allowed appointment horizon

**Starting state:** `DECISION_REQUIRED` for the business horizon  
**Source coverage:** I-8  
**Dependencies:** Task 2

### Subtasks

1. Decide separate minimum and maximum windows for consultations and masterclasses.
2. Define Chișinău timezone, daylight-saving, same-day, and boundary behavior.
3. Implement the rule in the shared server schema and mirror it in RU/RO form constraints.
4. Provide localized validation messages without promising slot availability.
5. Test past, exact-boundary, DST, invalid-calendar, and far-future dates.

### Acceptance

- UI and server enforce the same approved horizon.
- The form still describes the selected time as a request until scheduling is implemented.

---

# Block 3 — Strengthen Telegram and operational workflows

This block has five tasks that improve delivery, status handling, attribution, and daily operations.

## Task 14 — Decouple Telegram status updates from message wording

**Starting state:** `PARTIAL` because the DB already links `telegramMessageId`, but text replacement remains fragile  
**Source coverage:** II-1  
**Dependencies:** Tasks 7 and 11

### Subtasks

1. Define a stable machine-readable order reference that does not expose sensitive data.
2. Resolve webhook updates by Telegram message mapping and order ID rather than localized status text.
3. Keep human-readable status text as presentation only.
4. Define behavior for edited, deleted, duplicated, and stale Telegram messages.
5. Test every lifecycle transition and illegal transition.

### Acceptance

- Editing presentation text cannot break the DB status transition.
- A webhook cannot update an unrelated order.
- Telegram and CRM converge on the same final state.

## Task 15 — Add a durable Telegram delivery outbox

**Starting state:** `DECISION_REQUIRED` for queue infrastructure  
**Source coverage:** II-6 deep path  
**Dependencies:** Tasks 5, 6, and 8

### Subtasks

1. Model delivery attempts separately from the persisted application.
2. Write the application and outbox entry in one transaction.
3. Implement bounded retries with backoff and terminal failure state.
4. Prevent retries from creating duplicate Telegram messages.
5. Add operator retry/cancel controls and failure tests.

### Acceptance

- A Telegram outage never removes or duplicates the CRM application.
- Recovery retries are observable, bounded, and idempotent.
- User-facing success wording accurately reflects accepted versus delivered state.

## Task 16 — Formalize UTM and entry attribution

**Starting state:** `PARTIAL` because the catalogue already captures URL UTM values in session storage  
**Source coverage:** II-5  
**Dependencies:** Tasks 2 and 5

### Subtasks

1. Document first-touch, last-touch, session, entry-point, and direct-traffic semantics.
2. Define normalization, length limits, allowlists, and raw-value retention.
3. Treat client-provided attribution as untrusted analytics data, not authorization data.
4. Validate structured session history and retain only approved product identifiers.
5. Test RU/RO routes, missing consent, malformed storage, spoofed values, and cross-session behavior.

### Acceptance

- Attribution has documented semantics and cannot affect security decisions.
- CRM distinguishes normalized analytics dimensions from optional raw input.
- No silent Russian fallback or mixed-locale route is introduced.

## Task 17 — Add actionable CRM SLA indicators

**Starting state:** `PARTIAL` because dashboard and recent-order widgets already exist  
**Source coverage:** III-3 operational subset  
**Dependencies:** Tasks 11–12

### Subtasks

1. Define an approved SLA from `NEW` to first manager action.
2. Add today/week counts and overdue unprocessed applications.
3. Separate live operational counts from delayed analytical aggregates.
4. Add accessible empty, loading, partial-data, and failure states.
5. Test timezone boundaries and aging as time advances.

### Acceptance

- Managers can identify overdue applications without opening every order.
- Metrics disclose their timestamp and calculation window.
- No WebSocket is added unless measured need proves it necessary.

## Task 18 — Extend Telegram bot management commands

**Starting state:** `DECISION_REQUIRED` as a new operational feature  
**Source coverage:** III-8  
**Dependencies:** Tasks 4, 7, 11, 14, and 17

### Subtasks

1. Approve the exact command set and roles allowed to use it.
2. Authenticate chat and sender identity for every command.
3. Reuse CRM services rather than exposing a second business-logic implementation.
4. Limit returned personal data and redact sensitive fields in group chats.
5. Add command rate limits, audit logging, tests, and operator documentation.

### Acceptance

- Unauthorized chats and users receive no CRM data and cause no mutation.
- Commands and browser CRM produce the same results.
- Every mutation has an audit record.

---

# Block 4 — Improve catalogue intelligence and CRM analytics

This block has five tasks for discovery, ranking, reporting, and exports.

## Task 19 — Make the current popularity sort truthful

**Starting state:** `DECISION_REQUIRED` because the ranking source is a documented release blocker  
**Source coverage:** II-3 stage 1 and P1-RANKING  
**Dependencies:** Task 1

### Subtasks

1. Audit every current `popularityRank` value and its visible label.
2. Choose an approved interim meaning: official catalogue order, editorial order, or remove/rename the option.
3. Update UI explanation, data validation, SEO implications, and tests.
4. Verify identical behavior in RU and RO.
5. Keep CRM sales data out until Task 20 is approved.

### Acceptance

- The visible sort label accurately describes its source.
- Ranking is deterministic and does not imply unsupported customer demand.
- `P1-RANKING` is updated only after owner approval and evidence.

## Task 20 — Build the CRM-to-catalogue popularity feedback loop

**Starting state:** `DECISION_REQUIRED` for data policy and automated publication  
**Source coverage:** II-3 stage 2 and III-9  
**Dependencies:** Tasks 11, 16, and 19

### Subtasks

1. Define eligible orders, time window, cancellations, ties, low-volume handling, and privacy threshold.
2. Produce an aggregate-only export with no customer data.
3. Validate every slug against the published catalogue and quarantine unknown products.
4. Define scheduled generation, review, expiry, fallback, and rollback.
5. Test empty data, partial price data, late status changes, and stale exports.

### Acceptance

- Catalogue popularity is traceable to an approved aggregate formula.
- No runtime catalogue request reaches the CRM database.
- Failed or stale sync falls back to a truthful deterministic order.

## Task 21 — Improve catalogue search tolerance

**Starting state:** `OPEN` as an optional UX optimization  
**Source coverage:** II-4  
**Dependencies:** Task 1

### Subtasks

1. Collect real RU/RO query failures before selecting an algorithm.
2. Normalize case, Romanian diacritics, Cyrillic variants, punctuation, and whitespace.
3. Add bounded typo tolerance without matching unrelated health products.
4. Preserve fast response on 320px devices and all 50 products.
5. Add relevance, accessibility, empty-state, and performance tests.

### Acceptance

- Approved typo and diacritic examples resolve correctly in RU and RO.
- Exact and category matches remain predictable.
- Search adds no heavy dependency without measured need.

## Task 22 — Extend CRM results calculations

**Starting state:** `PARTIAL` because `/results` already calculates sales, costs, margin, regions, promotion, and logistics  
**Source coverage:** II-7  
**Dependencies:** Tasks 11–12

### Subtasks

1. Freeze exact formulas and inclusion rules for conversion, processing time, weekday demand, and regional conversion.
2. Determine whether `updatedAt` is sufficient or whether status-history timestamps are required.
3. Exclude incomplete historical price snapshots without inventing financial values.
4. Add calculation tests for current/previous periods, zero denominators, timezone boundaries, and partial data.
5. Add accessible UI only for metrics supported by reliable data.

### Acceptance

- Every displayed metric links to a documented formula and data sufficiency rule.
- Historical unknowns remain unknown rather than estimated.
- Unit, integration, responsive, and production smoke checks pass.

## Task 23 — Add controlled CRM exports

**Starting state:** `DECISION_REQUIRED` for export scope, privacy, and retention  
**Source coverage:** III-7  
**Dependencies:** Tasks 4, 11, 12, and 22

### Subtasks

1. Approve roles, columns, date ranges, locale, and personal-data handling for each export.
2. Implement streamed CSV for clients and orders with spreadsheet-injection protection.
3. Define whether a PDF report is necessary before adding a rendering dependency.
4. Add audit records for export creation and failure.
5. Test authorization, escaping, large datasets, timezones, and deletion of temporary files.

### Acceptance

- Only authorized users can export approved fields.
- CSV values cannot execute formulas when opened in spreadsheet software.
- No export file or customer data is committed or retained unexpectedly.

---

# Block 5 — Develop approved customer workflows

This block has five tasks. Each one is a new feature and starts only when the user explicitly selects it.

## Task 24 — Add consultation slot management

**Starting state:** `DECISION_REQUIRED`  
**Source coverage:** III-1  
**Dependencies:** Tasks 4, 11, and 13

### Subtasks

1. Approve working hours, duration, capacity, buffers, holidays, timezone, and cancellation rules.
2. Design slot, reservation, expiry, and manager-override models.
3. Add a read-only public availability API with privacy and abuse controls.
4. Prevent double booking transactionally and define temporary reservation behavior.
5. Build CRM management and RU/RO catalogue selection with full accessibility tests.

### Acceptance

- Concurrent clients cannot reserve the same exclusive slot.
- Availability and confirmation wording are accurate.
- Manager override and rollback paths are documented.

## Task 25 — Add customer status notifications

**Starting state:** `DECISION_REQUIRED` for provider, consent, cost, templates, and legal review  
**Source coverage:** III-2  
**Dependencies:** Tasks 11, 14, and 15

### Subtasks

1. Choose approved channels and Moldova-capable providers.
2. Define opt-in, transactional basis, quiet hours, delivery receipts, and opt-out behavior.
3. Obtain approval for RU/RO message templates without adding health claims.
4. Implement idempotent sends tied to valid status transitions.
5. Test provider failure, retry, duplicate webhook, invalid phone, and consent revocation.

### Acceptance

- No message is sent without an approved legal basis and template.
- Duplicate status events do not duplicate customer messages.
- Costs and provider failures are observable.

## Task 26 — Enrich the CRM client profile

**Starting state:** `PARTIAL` because `/clients` already shows contacts and order history  
**Source coverage:** III-4  
**Dependencies:** Task 12

### Subtasks

1. Audit the existing desktop/mobile client detail panel.
2. Define repeat-client, preferred-product, and preferred-contact calculations.
3. Add manager notes with authorship, timestamps, and access controls if approved.
4. Distinguish calculated labels from manually assigned labels.
5. Test merged clients, deleted orders, incomplete prices, and empty histories.

### Acceptance

- The profile adds decision-useful context without exposing unsupported inferences.
- Notes and edits have an audit trail.
- Existing client and order integrity is preserved.

## Task 27 — Develop the masterclass workflow

**Starting state:** `VERIFY_FIRST` because the current public form already includes a masterclass request type  
**Source coverage:** III-5  
**Dependencies:** Tasks 1, 11, and 13

### Subtasks

1. Verify current form, shared constants, CRM storage, Telegram output, and manager workflow.
2. Decide whether a separate page and schedule are needed or the existing request form is sufficient.
3. Approve event source, capacity, online/offline rules, and publication owner.
4. Implement only the approved gap, avoiding implied confirmed booking.
5. Test RU/RO routes, past events, full events, cancellation, and empty schedule.

### Acceptance

- Existing functionality is not rebuilt unnecessarily.
- Any published schedule has a clear owner and freshness policy.
- Registration status wording matches actual reservation guarantees.

## Task 28 — Add regional customer experience

**Starting state:** `PARTIAL` because the catalogue already uses the Moldova region dropdown  
**Source coverage:** III-6  
**Dependencies:** Tasks 2, 12, and 16

### Subtasks

1. Verify the shared region list and RU/RO labels.
2. Obtain approved distributor, office, manager, delivery-time, and service-area data.
3. Define fallback behavior for regions without approved local information.
4. Add regional assignment or presentation only from verified data.
5. Test every region, diacritics, mobile controls, analytics, and stale-data handling.

### Acceptance

- No office, distributor, delivery promise, or contact is invented.
- Region identity is consistent from form through CRM and reporting.
- Existing applications remain compatible.

---

# Block 6 — Consolidate architecture and close the programme

This block has five tasks. Task 33 is the final task for the complete workflow.

## Task 29 — Choose the shared-code architecture

**Starting state:** `DECISION_REQUIRED`  
**Source coverage:** III-10  
**Dependencies:** Tasks 1–2 and 9

### Subtasks

1. Measure actual semantic duplication after excluding code now owned only by CRM.
2. Compare a private package, workspace/monorepo, generated contract artifact, and automated copy validation.
3. Evaluate release coupling, repository access, versioning, CI, local development, and rollback.
4. Select the smallest architecture that prevents meaningful contract drift.
5. Write an adoption and migration plan without moving code in this task.

### Acceptance

- The chosen approach has an owner, versioning model, failure mode, and migration sequence.
- Package infrastructure is not introduced solely because the audit suggested it.

## Task 30 — Implement automated contract and catalogue synchronization gates

**Starting state:** `OPEN`  
**Source coverage:** II-2, III-9, and III-10 integration risk  
**Dependencies:** Tasks 2 and 29

### Subtasks

1. Validate request/response schemas and shared constants across repositories in CI.
2. Validate published product slugs, SKU mappings, categories, and image references consumed by CRM.
3. Fail on semantic drift while ignoring formatter-only differences.
4. Define coordinated release order for backward-compatible and breaking changes.
5. Add Graphify cross-repo refresh and stale-map detection to the workflow.

### Acceptance

- CI detects incompatible catalogue/CRM contracts before merge.
- A one-repository change can remain deployable during an approved compatibility window.
- The graph and documentation point to current owners and tests.

## Task 31 — Reconcile security, privacy, content, and release blockers

**Starting state:** `OPEN`, with external blockers expected  
**Source coverage:** P0-CONTACT, P0-LEGAL, P1-MEDIA-RIGHTS, P1-CONTENT, P1-RANKING, P1-CI-PROTECTION, P1-SEO-ORIGIN  
**Dependencies:** completed engineering tasks relevant to each blocker

### Subtasks

1. Re-read `docs/release-status.json` and verify every blocker against current evidence.
2. Separate technical completion from owner, legal, rights, provider, and platform approvals.
3. Update blocker status only when the named acceptance evidence exists.
4. Verify GitHub branch protection and production-origin/search-engine evidence live.
5. Preserve pending claims and unknown content in quarantine.

### Acceptance

- Release status contains only current blockers and links to evidence.
- No external approval is inferred from passing tests or implementation completion.
- No pending claim or unverified asset is promoted.

## Task 32 — Run the full cross-repository regression and migration rehearsal

**Starting state:** `OPEN`  
**Source coverage:** all implemented Tasks 4–31  
**Dependencies:** all selected implementation tasks completed

### Subtasks

1. Run repository, architecture, type, lint, unit, integration, build, content, claims, security, performance, responsive, and E2E checks as applicable.
2. Rehearse every database migration and rollback against a production-shaped copy.
3. Test catalogue submission through the same-origin proxy into CRM, Telegram success/failure, idempotent retry, and webhook status changes.
4. Verify RU/RO, all request types, quantities, regions, dates, partial prices, exports, and approved new features.
5. Rebuild Graphify and verify both repositories are clean and synchronized.

### Acceptance

- All applicable technical gates pass without weakening tests.
- Expected external blockers remain explicit.
- No real customer record or external recipient is used for destructive testing.

## Task 33 — Final business-logic release audit

**Starting state:** `OPEN`; this is the final workflow task  
**Source coverage:** complete audit V2 programme  
**Dependencies:** Tasks 1–32, except explicitly rejected optional features

### Subtasks

1. Compare the final system against every corrected finding from Task 1.
2. Mark every task `PASS`, `REJECTED_BY_OWNER`, `NOT_APPLICABLE`, or `BLOCKED` with evidence.
3. Reverify production routes, CI, deployment, database migrations, monitoring, and rollback readiness.
4. Publish final technical, operational, privacy, legal, content, and business status separately.
5. State whether the frontend, CRM, and complete project are release-ready using only repository release rules.

### Acceptance

- No task remains silently partial or open.
- Remaining blockers are sorted by severity, impact, owner, and exact resolution requirement.
- `Project is production-ready` is used only if `npm run release:check` and the authoritative release status both permit it.

---

# Global task index

| Task | Block | Title | Starting state | Main dependency |
|---:|---:|---|---|---|
| 1 | 0 | Reconcile audit V2 with the current system | OPEN | — |
| 2 | 0 | Freeze cross-repository contracts and ownership | PARTIAL | 1 |
| 3 | 0 | Establish migration, rollback, and verification baselines | OPEN | 1–2 |
| 4 | 1 | Verify and harden CRM route authentication | VERIFY_FIRST | 3 |
| 5 | 1 | Implement persistent request idempotency | OPEN | 2–3 |
| 6 | 1 | Add distributed application rate limiting | DECISION_REQUIRED | 3, 5 |
| 7 | 1 | Restrict Telegram webhook updates to the configured chat | OPEN | 3 |
| 8 | 1 | Add delivery failure observability | DECISION_REQUIRED | 3 |
| 9 | 2 | Complete the quantity-aware order contract | VERIFY_FIRST | 2 |
| 10 | 2 | Unify Prisma client ownership and pooling | PARTIAL | 3 |
| 11 | 2 | Migrate order type and status to database enums | OPEN | 3, 10 |
| 12 | 2 | Prevent silent client-profile corruption | DECISION_REQUIRED | 3, 11 |
| 13 | 2 | Set the allowed appointment horizon | DECISION_REQUIRED | 2 |
| 14 | 3 | Decouple Telegram status updates from message wording | PARTIAL | 7, 11 |
| 15 | 3 | Add a durable Telegram delivery outbox | DECISION_REQUIRED | 5, 6, 8 |
| 16 | 3 | Formalize UTM and entry attribution | PARTIAL | 2, 5 |
| 17 | 3 | Add actionable CRM SLA indicators | PARTIAL | 11–12 |
| 18 | 3 | Extend Telegram bot management commands | DECISION_REQUIRED | 4, 7, 11, 14, 17 |
| 19 | 4 | Make the current popularity sort truthful | DECISION_REQUIRED | 1 |
| 20 | 4 | Build the CRM-to-catalogue popularity feedback loop | DECISION_REQUIRED | 11, 16, 19 |
| 21 | 4 | Improve catalogue search tolerance | OPEN | 1 |
| 22 | 4 | Extend CRM results calculations | PARTIAL | 11–12 |
| 23 | 4 | Add controlled CRM exports | DECISION_REQUIRED | 4, 11, 12, 22 |
| 24 | 5 | Add consultation slot management | DECISION_REQUIRED | 4, 11, 13 |
| 25 | 5 | Add customer status notifications | DECISION_REQUIRED | 11, 14, 15 |
| 26 | 5 | Enrich the CRM client profile | PARTIAL | 12 |
| 27 | 5 | Develop the masterclass workflow | VERIFY_FIRST | 1, 11, 13 |
| 28 | 5 | Add regional customer experience | PARTIAL | 2, 12, 16 |
| 29 | 6 | Choose the shared-code architecture | DECISION_REQUIRED | 1–2, 9 |
| 30 | 6 | Implement automated contract and catalogue synchronization gates | OPEN | 2, 29 |
| 31 | 6 | Reconcile security, privacy, content, and release blockers | OPEN | relevant completed tasks |
| 32 | 6 | Run the full cross-repository regression and migration rehearsal | OPEN | selected Tasks 4–31 |
| 33 | 6 | Final business-logic release audit | OPEN | 1–32 |

## Explicitly out of scope until its task is selected

- No source implementation, database migration, production deployment, provider installation, monitoring integration, public copy change, or release-status resolution is authorized by this planning document alone.
- Selecting a task authorizes work within its written scope. Provider costs, legal approvals, medical claims, media rights, customer messaging, analytics providers, and new public features still require the explicit decisions identified inside that task.
- Tasks marked `VERIFY_FIRST` must be closed without code when the current implementation already meets acceptance.
