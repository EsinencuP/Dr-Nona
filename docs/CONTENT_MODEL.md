# What data may the catalogue publish?

The content model separates imported facts, editorial approval and runtime publication. Source presence alone never grants publication.

Last verified: 2026-08-28 against `src/data/` and the current validation scripts.

## Product

Each product contains identity, content, media, source, ordering and editorial fields:

- `slug`, `officialName`, `sku` and `category`
- `shortDescription`, `longDescription`, `ingredients` and `howToUse`
- one `image` field shared by catalogue cards, home merchandising, selection, related products, SEO and product detail
- `catalogScale` for object-aware sizing of the shared image in compact cards
- `sourceUrl` for the primary Moldova catalogue and optional `officialSourceUrl` for international enrichment
- `sourceLastmod`, `releasedAt` and `officialOrder`
- `popularityRank` and `relatedSlugs`
- `publicationStatus` and `editorialStatus`

All current categories require `shortDescription` and `longDescription`. `ingredients` and `howToUse` may be `null` only when neither source publishes a usable value. Empty strings remain invalid for required copy.

The owner-supplied archive currently provides verified matches for 42 products. Eight products retain the neutral placeholder because the archive contains no matching item; another product's image must never be substituted as a guess.

A product is public only when `publicationStatus` is `published`, `editorialStatus` is `ready` and the category completeness assessment has no issue.

## Product dates and ranking

`releasedAt` is an approved launch or catalogue-add date. `sourceLastmod` records only source-page freshness. The current UI offers “Недавно обновлённые” because no release dates are approved.

`popularityRank` is a provisional ordering field. `P1-RANKING` remains open until the business approves its source or the permanent fallback.

## Selection

Selection stores product slugs in safe browser storage. The consultation handoff resolves each slug to official name, SKU and public URL. It is not a cart and contains no quantity, price or payment data.

## Application

An application is either `order` or `consultation`. Both include first name, last name, normalized phone, city, consent flag, source, locale and server request ID.

Orders include validated product slugs resolved to name and SKU. Consultations include online/offline mode, preferred date, preferred time and `Europe/Chisinau` timezone. Provider delivery metadata never enters product data.

## Official content record

Each official page record contains path, title, description, headings, paragraphs, images, source URL, source last-modified date and optional fetch error. Runtime publication excludes records that cannot produce a valid page contract.

## Claim record

Each sentence-level claim stores stable ID, scope, field, text, status, source URL, source hash, reviewer, review date, document reference and optional notes. Only `approved` claims may appear publicly. The current registry contains no approvals.

## Market data

`market.json` stores public Moldova branch data, international support and certificate policy. A Moldova certificate needs title, issuer, country, product scope, validity dates, document URL and source URL.

## SEO record

The generated SEO manifest contains one record per prerendered route. It stores canonical path, language, indexability, title, description, image, route kind and supported structured data. Offers, ratings and reviews are omitted unless approved source data exists.

## Validation

Run `npm run content:validate`, `npm run claims:validate`, `npm run market:validate` and `npm run build` after changing source data.
