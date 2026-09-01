# Which public pages does the application expose?

The application combines explicit React routes with prerendered official-content routes. The generated SEO manifest is the complete machine-readable inventory.

Last verified: 2026-09-01. The current manifest contains 315 routes, of which 311 are indexable. This includes localized RU/RO catalogue and product-detail routes for all 50 published products, plus localized company, history, founders, science, Halo Complex, editorial hubs and certificates pages.

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

Russian pages keep their unprefixed canonical paths and also expose explicit `/ru/...` alternatives where a complete bilingual pair exists. Romanian equivalents use `/ro/...`. Reciprocal `ru-MD`, `ro-MD` and `x-default` hreflang is active for home, catalogue, all product details, selection, contacts, certificates, `/about` and its four chapters, `/ourformula`, plus the localized editorial/blog/news hubs.

Individual blog/news articles and other imported official pages remain original-language content on one unprefixed canonical URL. When opened from the Romanian shell, navigation and controls stay Romanian while source copy is explicitly marked `lang="ru"`; these routes publish only `ru-MD` and `x-default`. The shared route contract in `src/locale-routing.mjs` prevents runtime links or the SEO generator from inventing `/ro` aliases for content without a complete Romanian version.

## Verification

`npm run seo:generate` regenerates the manifest. `npm run build` prerenders it, creates sitemap and robots output, then verifies every sitemap URL over HTTP.
