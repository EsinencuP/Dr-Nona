# How are browser security headers controlled?

`vercel.json` is the version-controlled deployment source. Shared scripts apply and verify the same policy in build, preview and runtime checks.

Last verified: 2026-07-31 against `vercel.json` and `scripts/security-headers-lib.mjs`.

## Required headers

- `Content-Security-Policy-Report-Only` during the current rollout
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Restricted `Permissions-Policy`
- One-year `Strict-Transport-Security` with subdomains
- `Cross-Origin-Opener-Policy: same-origin`

The runtime gate converts the report-only policy to enforced Content Security Policy (CSP) and renders representative routes in Chromium. A production switch requires explicit approval and a clean runtime result.

## CSP allowlist

The policy allows self-hosted scripts, forms, media and connections. Approved external origins are limited to Google Fonts CSS, Google Fonts files and Cloudinary images. `script-src` contains neither `unsafe-inline` nor `unsafe-eval`.

Cloudflare Turnstile is not configured. The contact endpoint therefore requires production WAF or server-side rate limiting before release.

## Caching

- Hashed `/assets/` files use one-year immutable caching
- Version-controlled `/brand/` and `/products/` media use one-day caching with stale revalidation
- `robots.txt` and `sitemap.xml` use one-hour caching with stale revalidation

## Validation

- `npm run security:validate` checks the configuration and minimal origin allowlist
- `npm run security:http-validate` checks headers on representative responses and the `/main` redirect
- `npm run security:runtime` enforces CSP in Chromium and fails on violations

Production header delivery and WAF behavior remain unverified until deployment.
