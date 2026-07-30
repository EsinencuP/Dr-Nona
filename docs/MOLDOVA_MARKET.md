# Moldova market contact and certificate policy

Status: Active public-market contract  
Last checked: 2026-07-30

## Primary Moldova contact

The official Dr. Nona branch listing names:

- Country: Moldova
- City: Chișinău / Кишинёв
- Address: ул. Мирон Костин 7, каб. 511
- Phone: +373 69 281 916
- Phone: +373 69 049 793
- Source: https://drnona.com/en/warehouses

The source does not name a Moldova legal entity, local email or Telegram
account. The UI must not invent them. `shopinfo@drnona.com` remains explicitly
labelled as international support and is not presented as a local Moldova
address.

## Certificate publication rule

The current official certificate archive does not provide a verifiable Moldova
set with complete issuer, market, product scope and validity metadata.
Therefore:

- Russian, Israeli and Ukrainian documents are not shown on the Moldova page;
- the public Moldova certificate registry currently contains zero documents;
- the international archive is linked separately with an explicit warning that
  it is not proof of Moldova registration or certification;
- a Moldova certificate can be published only when all of these fields exist:
  title, issuer, country, products, valid-from, valid-until, document URL and
  source URL;
- every published national certificate must name Moldova as its country.

The executable source is `src/data/market.json`. Run
`npm.cmd run market:validate` before publication.

## Remaining approvals

- confirm the Moldova legal entity or distributor name;
- approve a local consultation email or Telegram channel if one exists;
- approve a server-side consultation recipient, consent and retention flow;
- provide Moldova-applicable certificates with complete metadata.
