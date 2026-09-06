# Graphify agent workflow

This repository uses the Graphify knowledge graph as the first navigation layer for codebase work. The map is a routing aid: it narrows the files and relationships an agent should inspect before reading source. It does not replace source review, tests, release gates or human approval.

## Canonical map

The merged map is `graphify-out/graph.json`. It covers the e-catalog, the same-origin API proxy, the sibling `Dr-Nona-CRM` repository, its `database/` Prisma schema and migrations, and the declared `docs/DR_NONA_PROMPT_WORKFLOW.md` node. The generated graph is disposable and ignored by Git; rebuild it locally when it is absent or stale.

The reproducible rebuild is:

```powershell
npm run graphify:cross-repo
```

The builder uses deterministic code extraction, then adds only the declared cross-repository contracts from `tools/graphify/cross-repo-links.json`. It does not read live database data, credentials or CRM runtime state.

## Query-first protocol

For any non-trivial codebase question or change:

1. Run a bounded query against the merged map:

   ```powershell
   graphify query "<question>" --graph graphify-out/graph.json --budget 800
   ```

2. Use `graphify path` to trace a flow and `graphify affected` to identify callers, dependants and likely tests before editing:

   ```powershell
   graphify path "<source node>" "<target node>" --graph graphify-out/graph.json
   graphify affected "<node or symbol>" --graph graphify-out/graph.json --depth 2
   ```

3. Open only the source paths returned by the graph, plus the directly referenced type, configuration and test files needed to verify the behavior.

4. If the graph has no node, a source path is missing, or the result conflicts with the checkout, use a narrow `rg` fallback, mark the graph as stale, and rebuild it after the investigation. A broad repository scan is reserved for an explicit repository-wide audit or graph-maintenance task.

5. After editing any catalog, API, CRM, database or architecture-tooling file, run `npm run graphify:cross-repo`. `graphify update .` may be used for a temporary catalog-only refresh, but it is not a valid final refresh for cross-repository work.

This sequence keeps the expensive context step scoped: graph traversal chooses the neighborhood, source reads verify the exact implementation, and tests validate the result.

## Change checklist

Before an edit, capture:

- the owning route, module or handler;
- the data boundary (catalog JSON, API proxy, CRM handler, Prisma schema or migration);
- callers and dependants from `affected`;
- the nearest relevant tests and validation command.

After an edit, capture:

- the files actually changed;
- the graph refresh result and node/edge counts;
- targeted tests plus the repository checks required by `AGENTS.md`;
- any graph limitation or declared cross-repository link that still needs human review.

## Exceptions

Do not query the graph for a one-line formatting request, a direct path already supplied by the user, or a task explicitly about repairing the graph itself. For those tasks, state the exception briefly and keep the file scope explicit.

## Why this is always-on in Codex

The project-level `AGENTS.md` rule is the durable Codex integration. The generated `.codex/hooks.json` is intentionally ignored because it contains a machine-specific executable path, and Codex Desktop does not rely on a pre-tool hook for this behavior. The workflow therefore lives in repository instructions and is applied at the start of each relevant task.
