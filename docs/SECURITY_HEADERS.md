# Security headers and CSP

Status: Version-controlled / CSP report-only deployment phase  
Last updated: 2026-07-30

## Source of truth

`vercel.json` is the deployment contract. Its global rule applies the same
security headers to documents, prerendered routes, redirects and static assets.
`vite.config.ts` reads that file rather than maintaining a second copy.

Configured headers:

- `Content-Security-Policy-Report-Only`;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- restrictive `Permissions-Policy`;
- one-year HSTS with subdomains;
- `Cross-Origin-Opener-Policy: same-origin`.

`frame-ancestors 'none'` is the primary frame restriction. `X-Frame-Options`
remains as a compatibility layer.

## CSP scope

Executable scripts are restricted to `'self'`. `unsafe-eval`, inline scripts,
wildcards and broad `http:`/`https:` scheme sources are rejected by the
automated gate.

Only three external origins are approved:

| Origin | Directive | Reason |
|---|---|---|
| `https://fonts.googleapis.com` | `style-src` | Google Fonts stylesheet |
| `https://fonts.gstatic.com` | `font-src` | Google Fonts files |
| `https://res.cloudinary.com` | `img-src` | official editorial imagery |

`connect-src` remains `'self'`. Inline styles are temporarily allowed because
the existing React presentation uses bounded style properties for reveal delay
and product-object scale. `script-src` does not receive that exception.

## Rollout

Deployment currently emits the policy as
`Content-Security-Policy-Report-Only`. A reporting endpoint has not been
invented because no production monitoring receiver is approved.

The exact same policy is converted to enforcing
`Content-Security-Policy` when `SECURITY_CSP_ENFORCE=1`. CI starts a production
preview in that mode and renders Home, Catalog, Product, Article and Contact in
Chromium. Enforcement can replace report-only in `vercel.json` after an
approved production observation window.

## Automated gates

```powershell
npm.cmd run security:validate
npm.cmd run security:http-validate
npm.cmd run security:runtime
```

- `security:validate` checks the deployment schema, mandatory headers, minimal
  origins, CSP directives and cache policy.
- `security:http-validate` requests document, product, article, contact, 404,
  hashed asset and redirect responses under enforcing CSP and requires
  identical security headers.
- `security:runtime` renders five representative routes under enforcing CSP
  and fails on CSP violations, blocked CSP requests, page errors or an empty
  React root.

The production build runs the static and HTTP gates. GitHub Actions runs the
Chromium enforcement gate after installing the browser.

## Asset caching

- fingerprinted `/assets/*`: one year, immutable;
- mutable `/brand/*` and `/products/*`: one day with stale-while-revalidate;
- `robots.txt` and `sitemap.xml`: one hour with stale-while-revalidate.

## Production verification

Repository and local preview coverage cannot prove the headers of an
undeployed domain. After deployment, repeat the header check against the final
Moldova origin and record the deployment URL and commit SHA. Until then the
actual Vercel response remains `NOT VERIFIED`.
