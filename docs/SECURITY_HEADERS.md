# How are browser security headers controlled?

`vercel.json` is the version-controlled deployment source. Shared scripts apply and verify the same policy in build, preview and runtime checks.

Last verified: 2026-08-30 against `vercel.json` and `scripts/security-headers-lib.mjs`.

## Required headers

- Enforced `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Restricted `Permissions-Policy`
- One-year `Strict-Transport-Security` with subdomains
- `Cross-Origin-Opener-Policy: same-origin`

The production configuration and local preview use the same enforced Content Security Policy (CSP). The runtime gate renders representative routes in Chromium and fails on any policy violation.

The Vite development server adds `unsafe-inline` to `script-src` only for its injected React Refresh bootstrap. This exception is selected by the `dev` npm lifecycle and is absent from preview, build output and `vercel.json`.

## CSP allowlist

The policy allows self-hosted scripts, forms, fonts, media and connections. The only approved external runtime origin is Cloudinary for official editorial images. `script-src` contains neither `unsafe-inline` nor `unsafe-eval`.

Cloudflare Turnstile is intentionally not configured. The contact endpoint has a bounded five-attempt fixed-window guard per anonymized client address. A Vercel WAF rule remains recommended for platform-wide enforcement across all function instances.

## Caching

- Hashed `/assets/` files use one-year immutable caching
- Version-controlled `/brand/` and `/products/` media use one-day caching with stale revalidation
- `robots.txt` and `sitemap.xml` use one-hour caching with stale revalidation

## Validation

- `npm run security:validate` checks the configuration and minimal origin allowlist
- `npm run security:http-validate` checks headers on representative responses and the `/main` redirect
- `npm run security:runtime` verifies the production-enforced CSP in Chromium and fails on violations

Production header delivery and WAF behavior remain unverified until deployment.
