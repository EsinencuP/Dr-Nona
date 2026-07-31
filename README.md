# Dr. Nona Moldova

This repository contains the Russian-language Moldova catalogue for Dr. Nona. It presents products, Halo Complex™, company information and a consultation handoff without commerce features.

## Current status

The frontend passes the documented local technical gates. Production remains blocked by legal, content, localization, operations and deployment decisions. Read [the current project status](docs/PROJECT_STATUS.md) and [the release verdict](docs/RELEASE_STATUS.md) before planning work.

## Tech stack

- React 19 and TypeScript
- Vite with route-level lazy modules and static prerendering
- Vitest and React Testing Library
- Playwright with Chromium desktop/mobile and axe
- Vercel Function for Telegram contact delivery

## Local setup

Use Node.js 22.23.1 and npm 10.9.8:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:4173`. Add Telegram secrets only to `.env.local`; Git ignores that file.

## Available commands

| Command | Purpose |
|---|---|
| `npm run dev` | Generate runtime data and start Vite |
| `npm run build` | Validate and build all prerendered routes |
| `npm run typecheck` | Run TypeScript project checks |
| `npm run lint` | Run ESLint with zero warnings |
| `npm run test` | Run unit and component tests |
| `npm run test:e2e` | Run desktop/mobile browser tests |
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
| `api/` and `server/` | Telegram application endpoint and server-only logic |
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

## Release rule

`npm run build` proves technical build health. Only `docs/release-status.json` and a successful `npm run release:check` can support a release-ready decision.

## Contribution and agent rule

Read [AGENTS.md](AGENTS.md) before changing the repository. Do not commit generated output or close business and legal blockers through documentation edits.
