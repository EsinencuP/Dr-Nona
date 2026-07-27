# Dr. Nona Moldova - Page Parity Inventory

Status: Discovery baseline  
Reference sitemap checked: 2026-07-26  
Source: https://drnona.com/sitemap.xml

## 1. Scope decision

The Moldova website must account for every meaningful public page and content
type on the official site. The information purpose and factual meaning are
preserved. The interface and visual composition are redesigned.

Page parity does not reopen commerce or account features. Routes whose only
purpose is cart, checkout, payment or authentication remain excluded until the
user explicitly changes the catalog-only model.

## 2. Sitemap baseline

Observed in the official sitemap:

- 980 URLs across all listed locales;
- 196 unique default Russian URLs;
- 56 product detail records;
- 48 blog article records;
- 70 news article records;
- 6 nested About records;
- static public routes listed below.

Counts are a discovery snapshot, not a final Moldova content import.

## 3. Public templates to adapt

### Brand and company

- Home;
- About hub;
- Company;
- History;
- Founders;
- Dr. Nona founder detail;
- Mikhail Shneerson founder detail;
- Science and Technology;
- Halo Complex™.

### Catalog

- All products;
- product category or collection;
- Lord collection context, with full navy/gold page theme;
- product detail;
- search results;
- empty search results;
- saved selection, a Moldova-specific replacement for cart.

### Editorial

- Blog index;
- Blog article;
- News index;
- News article.

Blog and News share one top-level navigation entry. Their record types and
article templates remain distinct until a content migration decision says
otherwise.

### Contact and trust

- Contact us;
- Branches;
- Certificates;
- FAQ;
- Business opportunity.

### Legal and accessibility

- Website Terms of Use;
- Privacy Policy;
- Accessibility Statement.

## 4. Routes excluded by the catalog-only decision

- Login;
- Logout;
- Register;
- Profile;
- Cart;
- Checkout;
- Payment success.

These official routes are inventoried so they are not forgotten, but they are
not implementation targets under the current product model.

## 5. Replacement mapping

| Official intent | Moldova catalog adaptation |
|---|---|
| Add to cart | Add to selection |
| Cart | Selection |
| Checkout | Contact consultant with selection context |
| Currency | Removed unless a non-commerce informational use is approved |
| VP | Removed from public UI |
| Stock status | Removed unless required as factual availability |
| Login/Profile | Removed |
| Product category | Category or collection after taxonomy approval |
| Business opportunity | Preserve informational intent after content review |
| Branches | Moldova-specific verified contacts |

## 6. Content review flags

The following official areas require manual review before parity work:

- FAQ contains irrelevant technical placeholder content;
- Business opportunity contains text that appears inconsistent with Dr. Nona;
- News includes promotions and events that may not apply to Moldova;
- Branch contact data may be stale;
- product copy includes medical and anti-aging claims;
- some Russian catalog entries contain English or missing content;
- product and article counts may change.

## 7. Moldova localization

Confirmed:

- target market is Moldova;
- design is a local adaptation of the official platform;
- source meaning stays aligned with the official pages;
- launch languages are Russian and Romanian.

TODO:

- canonical route language;
- localized URL pattern;
- Romanian source and translation workflow;
- Moldova legal content;
- verified local consultant contacts;
- which global News and Business materials are relevant locally.

## 8. Primary navigation mapping

| Main navigation item | Included templates |
|---|---|
| Catalog | all products, category/collection, Lord context, product detail, search |
| About | about hub, company, history, founders, science-related brand records |
| Halo Complex™ | dedicated Halo Complex scientific content |
| Blog / News | Blog index/article and News index/article through one editorial entry |

Contact, selection and language switching are utility functions; their exact
placement is not yet approved.

## 9. Completeness rule

Before implementation begins:

1. every official public template must have a row in the final route matrix;
2. each template must be marked `adapt`, `localize`, `merge`, `exclude` or
   `legal review`;
3. every exclusion must point to an approved decision;
4. products, news and articles are content records, not individually designed
   page types;
5. no page is silently dropped because its current official design is weak.
