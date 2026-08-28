# Which product decisions are active?

This register keeps active decisions that constrain the current code. Superseded prototypes remain only as compact references.

Last verified: 2026-07-31 against base commit `fede3938ce5173206ee4a6983ece7fb2c29f2318` and the current worktree.

## Active decisions

| ID | Date | Status | Decision | Reason | Consequence | Source |
|---|---|---|---|---|---|---|
| `D-001` | 2026-07-26 | Approved | The product is an informational catalogue, not a store. | The consultation journey is the conversion goal. | Cart, checkout, payment, prices and authentication stay out of scope. | Direct user decision |
| `D-031` | 2026-07-26 | Approved | Pages use functional density instead of large decorative empty zones. | The mature audience needs more useful information per viewport. | Layout changes must preserve readability while reducing unnecessary scrolling. | Direct user decision |
| `D-041` | 2026-07-26 | Approved | The interface uses the official name `Halo Complex™`. | The official source superseded the earlier working name. | Navigation, metadata and copy use one spelling. | Official source review |
| `D-048` | 2026-07-29 | Approved | The current interface is Russian only until complete Romanian content is approved. | Partial localization produced mixed-language and accessibility defects. | No RO switch appears; future Romanian pages use `/ro/...`. | QA-002 and user approval |
| `D-049` | 2026-07-29 | Approved | A selection carries product name, SKU and public URL into consultation. | The consultant must receive the user's product context. | Empty selections cannot create an order request; refresh preserves selection. | QA-003 |
| `D-050` | 2026-07-29 | Approved | `release-status.json` is the machine-readable release source and `RELEASE_STATUS.md` is generated from it. | Historical reports produced conflicting verdicts. | A passing build cannot override open P0/P1 blockers. | QA-004 |
| `D-052` | 2026-07-29 | Approved | Regulated claims require explicit Moldova approval. | Imported health language may create legal risk. | Pending and rejected claim fields stay out of public output. | QA-006 |
| `D-053` | 2026-07-29 | Approved | Only complete records with `published` and `ready` statuses enter public product surfaces. | Empty required product descriptions are not acceptable publication states. | All 50 current products pass the category-aware content gate. | QA-008 |
| `D-054` | 2026-07-29 | Approved | Moldova branch address and +373 phones are the primary direct contacts. | Israeli contact data did not match the target market. | Unapproved Moldova email, entity and Telegram identity are not invented. | QA-009 |
| `D-055` | 2026-07-29 | Approved | Foreign certificates are not presented as Moldova evidence. | Country-specific documents can mislead the target audience. | Moldova documents need issuer, product scope, validity and source metadata. | QA-009 |
| `D-056` | 2026-07-29 | Approved | `sourceLastmod` powers “Недавно обновлённые”; only approved `releasedAt` may power “Сначала новые”. | Sitemap changes do not prove product launch dates. | Unknown release dates never create false novelties. | QA-010 |
| `D-057` | 2026-07-29 | Approved | Indexable routes receive canonical metadata, supported JSON-LD and prerendered HTML. | A client-only shell does not provide sufficient route context. | No fabricated offers, reviews or ratings enter structured data. | QA-011 |
| `D-058` | 2026-07-29 | Approved | Russian routes have no locale prefix; future Romanian routes use `/ro/...`. | The strategy avoids duplicate and mixed-language URLs. | `/main` redirects permanently to `/`; current hreflang is Russian/self only. | QA-012 |
| `D-059` | 2026-07-29 | Approved | Route modules and large datasets load only where needed. | Static imports increased initial route cost. | Catalogue and official content remain outside unrelated initial graphs. | QA-013 |
| `D-060` | 2026-07-29 | Approved | Frontend modules follow app, component, feature, page, locale and style boundaries. | The former monolith blocked isolation and route splitting. | Architecture validation prevents monolith regression. | QA-014 |
| `D-061` | 2026-07-29 | Approved | Malformed routes fail safely behind an application error boundary. | Invalid percent encoding could crash rendering. | Damaged URLs show controlled bad-request or not-found output. | QA-015 |
| `D-062` | 2026-07-31 | Approved | Orders and consultations use one server-validated Telegram-only endpoint. | The owner selected Telegram and removed Resend and Turnstile. | Success follows Telegram delivery; production WAF, consent and retention remain blocked. | Direct user decision |
| `D-063` | 2026-07-28 | Approved | The catalogue and product pages use one visual system for all lines. | A separate Lord identity was removed from product surfaces. | Lord may appear as a named collection or dark home banner, not as a route-level theme. | Direct user decision |
| `D-065` | 2026-08-25 | Approved | The 50-product RU inventory, names and descriptions come from `drnona.md`; `drnona.com` supplements matching SKU, ingredients and usage data. | The owner explicitly replaced the previous ten-product catalogue. | Existing product routes are preserved where international slugs match; filtering uses the five Moldova catalogue categories. | Direct user decision |
| `D-066` | 2026-08-28 | Approved | Every product surface uses one shared image asset; the earlier catalogue/detail image split is removed. | The owner supplied a reviewed archive and explicitly retired the two-image concept. | Forty-two matched products use archive PNGs; eight unmatched products keep the neutral placeholder until their exact media is supplied. | Direct user decision |

## Superseded decisions

| ID | Replaced by | Date |
|---|---|---|
| `D-009` product reviews in detail pages | Claims/data policy and current no-review implementation | 2026-07-29 |
| `D-013`, `D-022`, `D-028`, `D-045` route-level Lord theme | `D-063` | 2026-07-28 |
| `D-034` partial RU/RO first version | `D-048`, `D-058` | 2026-07-29 |
| `D-003` international-only product source and `D-064` product-media inventory | `D-065` | 2026-08-25 |
| `D-043` partial Romanian switch | `D-048` | 2026-07-29 |
| `D-044`, `D-047` disabled contact form | `D-062` | 2026-07-31 |
| `D-046` foreign certificate catalogue | `D-055` | 2026-07-29 |
| Product-media clause of `D-065` | `D-066` | 2026-08-28 |
