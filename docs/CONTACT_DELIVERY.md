# How does the contact form deliver an application?

The website sends validated order and consultation applications to one approved Telegram chat. Email is not an automated delivery provider.

Last verified: 2026-07-31 against `api/applications.ts`, `server/applications/` and `src/features/contact/`.

## Request flow

1. `ApplicationForm` validates the user-facing fields.
2. The client sends JSON to `POST /api/applications` with an idempotency attempt key.
3. The server validates the environment, origin, body, consent, product slugs and attempt-key format.
4. The service creates a server request ID and formats a plain-text Telegram message.
5. The provider sends the message with an 8s timeout.
6. HTTP 201 produces the success state; provider failure produces HTTP 502 and preserves form data.

The Vite development middleware uses the same handler at `http://127.0.0.1:4173`. Vercel hosts the production function.

## Application types

An order includes contact data plus validated product names and SKUs. A consultation includes online/offline mode, preferred date, preferred time and `Europe/Chisinau` timezone.

The selected date and time are preferences, not a confirmed appointment. The form does not create payment or checkout state.

## Environment variables

Copy `.env.example` to `.env.local` and provide:

```dotenv
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

`CONTACT_ALLOWED_ORIGINS` is optional and is only needed for an additional
trusted browser origin. Requests from the site's own origin are accepted
automatically. On Vercel this covers generated Preview URLs, the Production URL
and custom domains without weakening the exact-origin check. Vercel system URLs
are also normalized into the allowlist when available.

Never expose or commit the token or chat ID.

### Vercel configuration

In **Project → Settings → Environment Variables**, add these server-only values:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

Apply them to both **Preview** and **Production** if the form must work in both
environments. Mark the bot token as sensitive. Environment changes only affect
new deployments, so redeploy after adding or rotating a value. Do not prefix
either key with `VITE_`: they must remain unavailable to browser code.

The Vite frontend posts to the same deployment at `/api/applications`, and the
root `api/applications.ts` file is deployed as a Node.js Vercel Function. No
external API base URL or SPA proxy is required.

## Response contract

- HTTP 201: Telegram accepted the application; response contains request ID and `telegram: sent`
- HTTP 400: schema, product or attempt-key validation failed
- HTTP 403: request origin is not approved
- HTTP 405: method is not POST
- HTTP 429: configured production rate limit rejected the request
- HTTP 502: Telegram delivery failed
- HTTP 503: required server configuration is missing

Success appears only after HTTP 201. Network, validation and provider failures keep the entered data available for correction or retry.

## Current protection

The endpoint has exact-origin validation, schema validation, payload limits, product allowlisting, a honeypot and server-only secrets. Turnstile is absent. Production WAF or rate limiting, durable deduplication, consent copy and retention policy remain open under `P0-CONTACT`.

## Operations

Use the server request ID when correlating browser status and Telegram messages. Rotate a leaked bot token in BotFather, update the deployment secret and verify a new test application.

During a Telegram outage, keep the failure state visible and direct visitors to the published Moldova phones. Do not display a success state or silently switch to an unapproved provider.

## Verification

Run `npm run test`, `npm run test:e2e` and a controlled deployed-form smoke test. Automated tests mock Telegram; a real message proves only the tested environment and recipient.
