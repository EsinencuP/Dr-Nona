# Business Logic Block 5 — Tasks 24–26

Date: 2026-09-17

| Task | Result | Current status |
|---|---|---|
| 24 — consultation slot management | CRM slot manager, signed/rate-limited public availability API, RU/RO catalogue selector, transactional single-capacity reservation, release and audit paths | `IMPLEMENTED_UNVERIFIED` |
| 25 — customer status notifications | Fail-closed SMS.MD v3 outbox, idempotency, quiet-hours gate, RU/RO template gate, opt-out audit, cost/failure visibility | `PARTIAL — APPROVAL_REQUIRED` |
| 26 — enriched CRM client profile | Repeat-client facts, preferred products/contact evidence, completed-value quality, internal immutable notes and opt-out audit | `IMPLEMENTED_UNVERIFIED` |

## Why Task 25 is not PASS

The repository contains no approved legal basis, RU/RO message templates, quiet hours, SMS.MD contract, sender ID or API token. Those values cannot be invented. Delivery reports also remain blocked until the provider supplies a webhook authentication contract that can be verified server-side. The implementation therefore makes no SMS request unless every activation variable is present.

## Impact

- Consultation requests can use real manager-published capacity instead of an unconfirmed free-form preference.
- Competing submissions cannot both claim the same slot when the migration is deployed.
- Managers receive more useful, source-backed client context without medical or behavioral inference.
- SMS status notifications are ready for controlled activation, while legal and provider gaps cannot silently enable customer messaging.

## Ownership and rollback

- Catalogue: selection UI and same-origin availability proxy.
- CRM: slot management, public read API, reservation transaction, notification outbox, client insights and notes.
- Database: `20260917010000_customer_workflows` migration and rollback.
- Full operational details: `../Dr-Nona-CRM/docs/CUSTOMER_WORKFLOWS_BLOCK_5.md` in the sibling CRM repository.

## Verification note

At the owner's direct request, tests, builds and migration deployment were not run in this stage. Tasks 24 and 26 are implemented but cannot be marked `PASS` until those gates run. Task 25 additionally needs the human/provider approvals listed above.
