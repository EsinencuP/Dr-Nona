# Privacy page and browser preferences

The owner requested a privacy page and an accept/refuse notice, and confirmed on 2026-10-21 that local operator details **require clarification**. This authorizes the implementation and draft copy, but supplies no missing legal identity or retention facts. Production remains blocked under `P0-CONTACT` and `P0-LEGAL`; this work does not close either blocker.

## Confirmed behavior

- `/privacypolicy`, `/ru/privacypolicy` and `/ro/privacypolicy` use the dedicated bilingual `PrivacyPage`. The former imported international policy is no longer the routed document. The full draft and browser storage inventory are also rendered into built HTML for JavaScript-disabled readers.
- Policy routes remain accessible through the footer and form but are `noindex,follow` while operator details are pending.
- No HTTP cookie, third-party analytics provider or marketing pixel is added. The notice accurately describes the existing localStorage/sessionStorage features.
- Locale and the visitor-requested selection remain functional preferences. The consent decision is stored locally under `drnona-privacy-choice-v1`, including version, choice and timestamps, for 180 days. This is a product configuration, not a claimed statutory retention period. It is not a server-side consent evidence ledger.
- Campaign attribution and session product history require an explicit accepted browser-data choice. Pending, rejected, expired and malformed decisions do not authorize capture, reads or transmission. Refusal/revocation clears the optional session keys; read-time checks also prevent transmission when clearing is blocked.
- Form consent is separate. Checking the form's personal-data consent does not enable optional attribution. A visitor can reject browser tracking and still submit an ordinary request.
- Footer preferences reopen the notice, focus the refusal button and restore focus to the initiating control after a choice. Accept/refuse buttons have equal styling and target sizes. The mobile contact action hides while the notice is visible. A measured spacer keeps footer content reachable.
- The current code adds no CRM schema, transport, provider or backend retention changes. Existing form delivery remains the same-origin proxy to the separate CRM service.

## Required before publication

The policy itself marks these facts as requiring clarification: Moldova operator name, IDNO, legal address, privacy contact email, processing grounds, request/log/notification/backup retention, recipient legal identities, hosting/CRM/database/notification providers, processing countries and international-transfer conditions. Do not substitute Dr. Nona International's details for an unconfirmed local controller.

A qualified Moldova reviewer must verify the completed policy and the actual production services. A banner alone cannot establish legal compliance. Changing optional purposes, providers or policy scope requires updating the inventory and consent version before activation.

Sources consulted: [CNPDCP overview of Law 195/2024, effective 23 August 2026](https://datepersonale.md/wp-content/uploads/2026/03/Legea-nr.1952024.pdf), [CNPDCP FAQ](https://datepersonale.md/about/faq/). These support transparency and data-subject rights, not a claim that this draft has regulatory approval.

## Verification

Run the repository, architecture, TypeScript, lint, unit and build checks. Browser coverage includes clean first visits, no pre-consent storage, equal choices, refusal persistence, acceptance, revocation and focus restoration, locale links, a successful mocked request after refusal without attribution, mobile composition and the full policy without JavaScript in a production preview. Existing navigation suites use an explicit returning-visitor refusal fixture; the privacy suite starts with empty storage and the attribution test explicitly grants permission.
