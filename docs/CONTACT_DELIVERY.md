# How does the e-catalog hand off an application?

The public website keeps a same-origin browser contract while the separate Dr-Nona-CRM deployment owns validation, persistence and Telegram delivery.

Last verified: 2026-09-03 against `src/features/contact/`, `api/applications.ts` and the Dr-Nona-CRM API contract.

## Request flow

1. `ApplicationForm` validates the user-facing fields.
2. The browser sends JSON to the e-catalog's `POST /api/applications` route with an idempotency key.
3. The e-catalog proxy enforces method, content type, body size and a bounded upstream timeout.
4. The proxy forwards only the JSON body and required transport headers to Dr-Nona-CRM.
5. Dr-Nona-CRM performs the authoritative origin, schema, product and rate-limit checks.
6. Dr-Nona-CRM persists the request and sends the Telegram message.
7. The response status and public JSON body are returned unchanged to the browser.

Success appears only after the CRM backend returns HTTP 201. Network, validation and provider failures preserve the entered form data.

## E-catalog environment

Copy `.env.example` to `.env.local` and provide:

```dotenv
CRM_APPLICATIONS_API_URL=http://127.0.0.1:3001/api/applications
VITE_CRM_URL=http://127.0.0.1:3001/dashboard
```

For Vercel, `CRM_APPLICATIONS_API_URL` must be a server-only variable. It must not use the `VITE_` prefix. `VITE_CRM_URL` is intentionally public because it is the destination of the temporary CRM link.

## CRM environment

Telegram credentials, the database URL, CRM credentials and the allowlist of public e-catalog origins are configured only in the Dr-Nona-CRM deployment:

```text
DATABASE_URL
CONTACT_ALLOWED_ORIGINS
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
TELEGRAM_WEBHOOK_SECRET
CRM_BASIC_USER
CRM_BASIC_PASSWORD
```

See the [Dr-Nona-CRM repository](https://github.com/EsinencuP/Dr-Nona-CRM) for the backend and database instructions.

## Response contract

- HTTP 201: application persisted and Telegram accepted it
- HTTP 400: the CRM rejected the payload
- HTTP 403: the public origin is not approved by the CRM
- HTTP 405: method is not POST
- HTTP 413: the e-catalog proxy rejected an oversized body
- HTTP 429: the CRM rate limit rejected the request
- HTTP 502: Telegram delivery or the CRM upstream failed
- HTTP 503: the CRM endpoint or required backend configuration is missing

## Verification

Run `npm run test`, `npm run build` and `npm run test:e2e`. A deployed smoke test must cover the full e-catalog proxy → CRM API → database → Telegram path.
