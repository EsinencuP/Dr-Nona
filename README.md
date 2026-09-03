# Dr. Nona Moldova

This repository contains the Russian-language Moldova catalogue for Dr. Nona. It presents products, Halo Complex™, company information and a consultation handoff without commerce features.

## Current status

The frontend passes the documented local technical gates. Production remains blocked by legal, content, localization, operations and deployment decisions. Read [the current project status](docs/PROJECT_STATUS.md) and [the release verdict](docs/RELEASE_STATUS.md) before planning work.

## Tech stack

- React 19 and TypeScript
- Vite with route-level lazy modules and static prerendering
- Vitest and React Testing Library
- Playwright with Chromium desktop/mobile and axe
- Vercel Function proxy to the separate CRM application backend

## Local setup

Use Node.js 22.23.1 and npm 10.9.8:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:4173`. Run the separate CRM at `http://127.0.0.1:3001` so the local application proxy can forward form submissions.

## Vercel deployment

The contact endpoint in `api/applications.ts` is a same-origin Vercel proxy.
Set `CRM_APPLICATIONS_API_URL` to the deployed Dr-Nona-CRM
`/api/applications` route and set `VITE_CRM_URL` to the internal CRM dashboard.
Telegram and database credentials belong only to the
[Dr-Nona-CRM repository](https://github.com/EsinencuP/Dr-Nona-CRM). See
[contact delivery](docs/CONTACT_DELIVERY.md) for the complete deployment
contract.

## Available commands

| Command | Purpose |
|---|---|
| `npm run dev` | Generate runtime data and start Vite |
| `npm run build` | Validate and build all prerendered routes |
| `npm run typecheck` | Run TypeScript project checks |
| `npm run lint` | Run ESLint with zero warnings |
| `npm run test` | Run unit and component tests |
| `npm run test:e2e` | Run desktop/mobile browser tests |
| `npm run sync:catalog:md` | Validate the 50-product Moldova source catalogue without writing |
| `npm run sync:catalog:md:write` | Rebuild product data from the reviewed Moldova catalogue |
| `npm run images:import:catalog -- <folder>` | Import the reviewed product-card PNG set and bind one shared image to every product surface |
| `npm run repository:validate` | Check repository and documentation hygiene |
| `npm run documentation:validate` | Check canonical docs and release consistency |
| `npm run release:check` | Fail while release blockers remain |
| `npm run ci` | Run the full local quality pipeline |

## Project structure

| Path | Responsibility |
|---|---|
| `src/app/` | Application shell, routing and error boundary |
| `src/components/` | Shared presentation components |
| `src/features/` | Catalogue, selection, contact and content features |
| `src/pages/` | Lazy route modules |
| `src/data/` | Product, market, claims and official content sources |
| `api/` | Same-origin application proxy to Dr-Nona-CRM |
| `server/dev/` | Local Vite adapter for the same proxy |
| `scripts/` | Build, content, security, SEO and repository gates |
| `tests/` | Unit, component, accessibility and E2E coverage |
| `public/` | Runtime brand and product assets |

## Documentation map

- [Agent rules](AGENTS.md)
- [Current project status](docs/PROJECT_STATUS.md)
- [Release status](docs/RELEASE_STATUS.md)
- [Roadmap](docs/ROADMAP.md)
- [Project brief](docs/PROJECT_BRIEF.md)
- [Frontend architecture](docs/FRONTEND_ARCHITECTURE.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Content model](docs/CONTENT_MODEL.md)
- [Content synchronization](docs/CONTENT_SYNC.md)
- [Page inventory](docs/PAGE_INVENTORY.md)
- [Continuous integration](docs/CI.md)
- [Claims review](docs/CLAIMS_REVIEW.md)
- [Moldova market policy](docs/MOLDOVA_MARKET.md)
- [Responsive QA](docs/RESPONSIVE_QA.md)
- [Security headers](docs/SECURITY_HEADERS.md)
- [Contact delivery](docs/CONTACT_DELIVERY.md)
- [Current QA report](docs/QA_REPORT.md)
- [Active decisions](docs/DECISIONS.md)
- [Repository dependency map](.graphly/project-graph.json)

## Release rule

`npm run build` proves technical build health. Only `docs/release-status.json` and a successful `npm run release:check` can support a release-ready decision.

## Contribution and agent rule

Read [AGENTS.md](AGENTS.md) before changing the repository. Do not commit generated output or close business and legal blockers through documentation edits.
