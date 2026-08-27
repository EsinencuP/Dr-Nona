# What product does this repository deliver?

Dr. Nona Moldova is an informational electronic catalogue for a mature Moldova audience. It explains Halo Complex™, presents approved products and helps a visitor send a contextual consultation or order request.

Last verified: 2026-07-31. This document describes the stable product contract; current counts and blockers live in `PROJECT_STATUS.md` and `RELEASE_STATUS.md`.

## Product goal

Help a visitor understand the brand and scientific positioning, inspect approved product information, create a non-commerce selection and contact a Moldova manager without losing product context.

## Audience and experience

The primary audience is mature and older adults. The interface prioritizes readable type, predictable navigation, visible states, compact information density and generous touch targets.

The desired character is premium, calm, marine and trustworthy. It must not depend on tiny typography, excessive whitespace, artificial luxury effects or generic AI-generated composition.

## Information priority

Use this order when deciding page hierarchy:

1. Halo Complex™ and the scientific context
2. Approved products
3. Company history and founders
4. Consultation and community context
5. The Dead Sea, minerals and nature

The home hero introduces the brand without an aggressive catalogue CTA. The first substantive home section explains Halo Complex™ before product promotion.

## Public surfaces

- Home, catalogue, product detail and selection
- Company overview, history, founders and science
- Halo Complex™ formula page
- Editorial hub, Blog, News and approved article routes
- Contact, branches, certificates, FAQ, privacy, terms and accessibility pages
- Controlled not-found and malformed-request states

The official site supplies the factual page and content baseline. Moldova pages may redesign structure and interaction, but they must not invent facts or publish unapproved imported claims.

## Catalogue contract

The catalogue supports search, five-category filtering and sorting by popularity fallback, source freshness, A to Z and Z to A. Until approved product photography is supplied, every product surface uses the neutral Dr. Nona placeholder.

Only `published` and `ready` records appear publicly. A product detail hides fields that are explicitly not applicable and excludes records with missing required content.

## Selection and contact contract

Selection is not a cart. It stores product slugs locally and presents name, SKU and public URL to the visitor before submission.

The form supports an order request and an online/offline consultation preference. The server validates the payload and sends it to the approved Telegram chat. A successful UI state appears only after successful provider delivery. Payment and consultation-time confirmation remain outside the form.

## Language and market

The current interface is Russian only. A Romanian version may ship only as complete `/ro/...` routes with localized UI, content, metadata, alt text, errors and accessibility labels.

Moldova branch contacts are primary. Foreign certificates do not represent Moldova approval. Legal entity, consent wording, retention and claim approvals remain external release decisions.

## Out of scope

- Cart, checkout, payment and prices
- Authentication, accounts and personal dashboards
- Customer database, administration interface and CRM
- Automatic email delivery
- Reviews, ratings or testimonials without approved sources
- Partial localization
- Unapproved medical, scientific or anti-aging claims

## Success criteria

- A visitor reaches core information and CTA without unnecessary scrolling
- Search, filters, routes, selection and form states work with keyboard and touch
- No published product contains required-field gaps
- No Telegram success appears before provider confirmation
- Russian pages remain linguistically and semantically consistent
- Technical gates pass without weakening the release blockers
