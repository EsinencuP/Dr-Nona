# Frontend architecture

Last updated: 2026-07-30

## Purpose

The frontend follows the product's actual boundaries without introducing a
generic enterprise layer. `src/App.tsx` is a composition root; it does not own
pages, business logic, locale resources or styling rules.

## Boundaries

```text
src/
  app/
    ApplicationErrorBoundary.tsx
    AppShell.tsx
    monitoring.ts
    routes.tsx
    storage.ts
  components/
    ArticleCard.tsx
    ui.tsx
  features/
    about/
    catalog/filterProducts.ts
    contact/consultation.ts
    editorial/
    selection/SelectionContext.tsx
  locales/
    LocaleProvider.tsx
    ru.ts
  pages/
    *Page.tsx
  styles/
    base.css
    components.css
    home.css
    catalog.css
    product.css
    about.css
    formula.css
    content.css
    selection.css
    shell.css
    responsive.css
```

## Contracts

- Every public route resolves to a separate page module.
- The application error boundary wraps the custom Router in `main.tsx`.
- Malformed route encoding is rejected without throwing; direct malformed
  requests are redirected to the controlled, noindex `/bad-request` route.
- Client errors are retained as a bounded 20-record session diagnostic log,
  emitted as `drnona:error` and forwarded to the optional production monitoring
  adapter without storing query strings or form data.
- `app/storage.ts` is the only production access point for `localStorage`.
  Locale and selection values use explicit schemas; security, quota and parsing
  failures fall back to in-memory state and emit metadata-only telemetry.
- `src/app/routes.tsx` uses real `lazy(() => import(...))` boundaries.
- Catalogue filtering and sorting are pure logic in
  `features/catalog/filterProducts.ts`.
- Contact payload generation, email handoff and copying are isolated from
  `ContactPage` presentation in `features/contact/consultation.ts`.
- Locale copy is stored in `locales/ru.ts`; DOM language synchronization lives
  in `LocaleProvider.tsx`.
- `styles.css` is an import manifest only. The thematic files remain
  independently maintainable, while `responsive.css` is loaded last to preserve
  cascade correctness at every route.

## Enforcement

`npm run architecture:validate` checks the composition-root size, required page
modules, dynamic imports, feature boundaries, stylesheet manifest and forbidden
imports through `App.tsx`. The command runs in both `build` and CI.

Vitest independently covers catalogue filter/sort behavior, consultation
payload serialization and rejected or unavailable browser storage. The
application integration suite covers lazy routes, persistent and in-memory
selection, locale state and content hierarchy.
