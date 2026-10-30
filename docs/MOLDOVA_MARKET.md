# Which market data may the site show?

The public contact and certificate surfaces must describe Moldova accurately. Foreign data may provide context but cannot imply local approval.

Last verified: 2026-10-15 against `src/data/market.json` and the owner's contact-removal instruction.

## Primary contact

The current public contact configuration is:

- Country: Moldova
- Phone: `+373 69 281 916`

The owner withdrew the second phone as invalid and requested removal of all public branch and physical-address references. The branch page, footer link and address card are retired. Internal source provenance remains in the market configuration; it does not override the owner's newer decision. See [CONTACT_REMOVALS_2026-10-15.md](CONTACT_REMOVALS_2026-10-15.md).

The Moldova legal entity, local email and public Telegram identity are `PENDING APPROVAL`. The international `shopinfo@drnona.com` address remains labeled as international support, not a Moldova entity.

## Contact form

The form sends validated applications to an approved administrative Telegram chat. The chat identifier is a server secret and does not become public contact data. Production still requires approved consent, retention, legal recipient, origin and abuse protection under `P0-CONTACT`.

## Certificate policy

A Moldova certificate needs:

- Title and issuer
- Country and applicable products
- Validity start and end
- Document URL and source URL

The current dataset contains no approved Moldova certificate. Foreign certificate collections stay hidden from the Moldova evidence surface and link only to the clearly labeled international archive.

## Validation

`npm run market:validate` checks local phone presence, foreign-document separation and certificate field completeness. It does not grant legal approval.
