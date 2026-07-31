# Repository rules for Dr. Nona Moldova

This file defines how an AI agent may change this repository. Read it before editing code, data, assets or documentation.

## Project purpose

Dr. Nona Moldova is an informational electronic catalogue built with React, TypeScript and Vite. It is not an online store. The repository has no checkout, payment, authentication, account area, database or general application backend. A single serverless endpoint sends approved contact-form payloads to Telegram.

Production release is blocked. A successful build does not grant release approval.

## Sources of truth

Use sources in this order:

1. The user's latest direct decision
2. `AGENTS.md`
3. `docs/release-status.json`
4. `docs/RELEASE_STATUS.md`
5. `docs/PROJECT_STATUS.md`
6. Specialized documents in `docs/`
7. Current code and tests
8. Git history as historical context only

When sources conflict, record the conflict, follow the higher source and do not invent the missing answer.

## Allowed actions

You may perform these actions without separate approval when they stay inside the assigned task:

- Read and analyze the repository
- Fix confirmed defects
- Remove proven unused files
- Update tests and documentation with code changes
- Repair broken repository links
- Improve internal boundaries without changing behavior
- Run validation, build and test commands
- Remove generated artifacts from Git

## Actions that require explicit approval

Ask before adding or changing:

- Features, routes or product flows
- Product scope or published assortment
- Localization or public copy
- Contacts, legal entity or consent text
- Claims, certificates, ratings or testimonials
- Analytics, cookies or monitoring providers
- External APIs, backend services, customer relationship management or email transport
- Production dependencies, domain or release-ready status

## Absolute prohibitions

Do not add cart, checkout, payment, prices, discounts, authentication or account features. Do not fabricate form success, contacts, testimonials, ratings, certificates, medical claims or scientific claims. Do not publish draft products or pending/rejected claims. Do not replace official product assets with AI reconstructions.

Never commit secrets, `dist/`, runtime reports, coverage, test results or archives. Do not bypass errors with `any`, `ts-ignore`, disabled lint rules, empty error handling or deleted tests. Do not mark a release ready while P0 or P1 blockers remain.

## Unknown data

Mark unknown information as `TODO`, `NOT VERIFIED` or `PENDING APPROVAL`. Never convert an assumption into a fact.

## Required verification

Run the checks relevant to the change:

```powershell
npm run repository:validate
npm run architecture:validate
npm run typecheck
npm run lint
npm run test
npm run build
```

Run `npm run test:e2e` for UI or routing changes. Run `npm run release:check` for release work. Do not bypass a failed release gate caused by documented external blockers.
