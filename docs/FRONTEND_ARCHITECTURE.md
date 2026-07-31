# How is the frontend organized?

The application uses route modules and feature boundaries so each page can load and test independently. `src/App.tsx` remains a small composition root.

Last verified: 2026-07-31 against base commit `fede3938ce5173206ee4a6983ece7fb2c29f2318` and the current worktree.

## Runtime boundaries

| Path | Responsibility |
|---|---|
| `src/app/` | App shell, lazy route table, monitoring and error boundary |
| `src/components/` | Shared UI components without page ownership |
| `src/features/catalog/` | Pure filter and sort behavior |
| `src/features/selection/` | Selection persistence and context |
| `src/features/contact/` | Form UI, client validation and API client |
| `src/features/about/` | Company content surfaces |
| `src/features/editorial/` | Editorial page composition |
| `src/pages/` | One lazy module per route surface |
| `src/locales/` | Russian resource and locale provider |
| `src/styles/` | Thematic styles with responsive rules last |
| `src/data/` | Source datasets and generated runtime projections |

## Routing

`src/app/routes.tsx` declares stable page patterns and loads each page with a real dynamic import. `src/router.tsx` provides the small History API router and safe parameter decoding. `ApplicationErrorBoundary` wraps routing so malformed input cannot produce an unrecoverable blank screen.

Known official content routes use `DynamicOfficialPage`. The SEO manifest and prerender script still produce route-specific HTML for those records.

## Data loading

Product and official content datasets stay outside unrelated initial route graphs. The home page uses generated editorial projections. The catalogue loads product data only when its route needs it. Contact loads neither the catalogue nor the official content dataset unless selection context requests products.

Generated `runtime-content.json` and `seo-manifest.json` are ignored build artifacts. Source product, claims, market and official content datasets remain tracked.

## Contact transport

The browser posts to `POST /api/applications`. Shared Zod validation runs on the client for feedback and on the server for trust. `api/applications.ts` validates the origin and product slugs, then the server-only Telegram provider sends the formatted payload.

The Vite development middleware exposes the same handler locally. Production uses the Vercel Function. Secrets stay in server environment variables and never enter the client bundle.

## Style cascade

`src/styles.css` imports thematic files in a fixed order. `base.css` owns tokens and shared primitives. Page and feature files own their selectors. `responsive.css` loads last and contains cross-page viewport and reduced-motion rules.

## Enforcement

- `npm run architecture:validate` checks the composition root, page modules, dynamic imports and style boundaries
- `npm run performance:validate` checks the initial compressed payload and preload graph
- `npm run typecheck` checks browser, test, Node and API TypeScript projects
- `npm run test` checks pure feature and integration behavior
- `npm run test:e2e` checks routes and requests in Chromium desktop/mobile

Do not add a generic enterprise layer. Create a boundary only when a page, feature, server concern or build concern has independent behavior.
