# Which public pages does the application expose?

The application combines explicit React routes with prerendered official-content routes. The generated SEO manifest is the complete machine-readable inventory.

Last verified: 2026-08-25. The current manifest contains 187 routes, of which 185 are indexable.

## Primary routes

- `/`
- `/products`
- `/selection`
- `/contactus`
- `/ourformula`
- `/about`
- `/about/company`
- `/about/our-history`
- `/about/founders`
- `/about/science`
- `/editorial`
- `/blog`
- `/news`
- `/certificates`
- `/warehouses`
- `/faq`
- `/privacypolicy`
- `/termsofuse`
- `/accessibility-statement`
- `/bad-request`

Published products use `/product/:slug`. Blog and News records use their official content paths. Additional approved source pages resolve through `DynamicOfficialPage` and receive their own prerendered HTML.

## Redirects and error states

`/main` returns HTTP 308 to `/` and does not enter the sitemap. Invalid product slugs, unknown paths and malformed encoding produce controlled noindex output. `/selection` is also noindex because it represents local user state.

## Excluded flows

The inventory excludes account, registration, login, cart, checkout, payment, search-result and administration flows. Official-source presence does not override the catalogue-only scope.

## Locale strategy

Russian pages use unprefixed canonical paths and `ru-MD`. Future Romanian pages require complete `/ro/...` equivalents with reciprocal hreflang. No partial Romanian route is published.

## Verification

`npm run seo:generate` regenerates the manifest. `npm run build` prerenders it, creates sitemap and robots output, then verifies every sitemap URL over HTTP.
