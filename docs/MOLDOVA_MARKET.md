# Which market data may the site show?

The public contact and certificate surfaces must describe Moldova accurately. Foreign data may provide context but cannot imply local approval.

Last verified: 2026-07-31 against `src/data/market.json`.

## Primary contact

The current public source is the official branch listing:

- Country: Moldova
- City: Chișinău
- Address: str. Miron Costin 7, office 511
- Phones: `+373 69 281 916` and `+373 69 049 793`
- Source: [official warehouse listing](https://drnona.com/en/warehouses)

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
