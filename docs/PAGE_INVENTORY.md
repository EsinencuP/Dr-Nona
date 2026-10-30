# Which public pages does the application expose?

The application combines explicit React routes with prerendered official-content routes. The generated SEO manifest is the complete machine-readable inventory.

Last verified: 2026-10-15. The current manifest contains 191 routes, of which 187 are indexable. This includes localized RU/RO catalogue and product-detail routes for all 50 published products, plus localized company, history, founders, science, Halo Complex and certificates pages.

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
- `/certificates`
- `/faq`
- `/privacypolicy`
- `/termsofuse`
- `/accessibility-statement`
- `/bad-request`

Published products use `/product/:slug`. The Blog / News section and individual publication routes were retired by the owner on 2026-10-15. Additional approved source pages resolve through `DynamicOfficialPage` and receive their own prerendered HTML.

## Redirects and error states

`/main` returns HTTP 308 to `/` and does not enter the sitemap. Invalid product slugs, unknown paths and malformed encoding produce controlled noindex output. `/selection` is also noindex because it represents local user state. Legacy editorial/blog/news URLs and the retired branch-listing page show the localized not-found page with noindex metadata and are excluded from the sitemap. The retired branch route is documented in [CONTACT_REMOVALS_2026-10-15.md](CONTACT_REMOVALS_2026-10-15.md).

## Excluded flows

The inventory excludes account, registration, login, cart, checkout, payment, search-result and administration flows. Official-source presence does not override the catalogue-only scope.

## Locale strategy

Russian pages keep their unprefixed canonical paths and also expose explicit `/ru/...` alternatives where a complete bilingual pair exists. Romanian equivalents use `/ro/...`. Reciprocal `ru-MD`, `ro-MD` and `x-default` hreflang is active for home, catalogue, all product details, selection, contacts, certificates, `/about` and its four chapters, `/ourformula`, with no public blog/news routes.

Other imported information pages remain original-language content on one unprefixed canonical URL. When opened from the Romanian shell, navigation and controls stay Romanian while source copy is explicitly marked `lang="ru"`; these routes publish only `ru-MD` and `x-default`. The shared route contract in `src/locale-routing.mjs` prevents runtime links or the SEO generator from inventing `/ro` aliases for content without a complete Romanian version.

## Verification

`npm run seo:generate` regenerates the manifest. `npm run build` prerenders it, creates sitemap and robots output, then verifies every sitemap URL over HTTP.
