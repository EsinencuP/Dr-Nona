# Dr. Nona cross-repository graph

This is a developer navigation tool, not a production application dependency. It joins the e-catalog repository with the sibling `Dr-Nona-CRM` repository. The CRM repository remains the source of truth for the API, CRM UI, Prisma schema, migrations and database operations; nothing is copied into the catalog.

The default build includes:

- `Dr Nona`: React/Vite e-catalog, same-origin API proxy, shared application contract and product data;
- `Dr-Nona-CRM`: Next.js CRM, API handlers, application service and Prisma client;
- `Dr-Nona-CRM/database`: Prisma schema and checked-in SQL migration, represented inside the CRM graph.

Run from the catalog repository:

```powershell
.	oolsgraphifyuild-cross-repo-graph.ps1
```

The merged graph is written to the ignored `graphify-out/graph.json`. Scratch extraction files are written below ignored `artifacts/graphify-build/`. Query the graph with:

```powershell
graphify query "How does a catalogue consultation reach CRM and the database?" --graph graphify-out/graph.json --budget 1200
graphify path "catalog::src_features_contact_application_client_submitapplication" "crm::database_schema_prisma" --graph graphify-out/graph.json
graphify explain "crm::server_applications_application_db_saveapplicationtodb" --graph graphify-out/graph.json
```

The code extraction is deliberately `--code-only`: it is deterministic, local and does not send catalog or CRM content to an external model. JSON snapshots and `schema.prisma` are represented by declared nodes/links in `cross-repo-links.json` because the no-LLM AST pass does not parse every data format. These declared links include evidence and are not inferred runtime behavior. A future semantic extraction may enrich the graph only after its data handling is explicitly approved.

After changes to either repository, rerun the PowerShell builder. The wrapper deliberately uses a full code-only rebuild because an incremental extraction can represent only the changed source tree when the two temporary graph roots are merged. Do not commit generated graph output, `.env` files, database files, screenshots or runtime reports.
