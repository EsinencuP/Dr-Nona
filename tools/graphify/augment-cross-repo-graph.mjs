import { error, log } from "node:console";
import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

const [, , graphPath, linksPath] = process.argv;
if (!graphPath || !linksPath) {
  error("Usage: node augment-cross-repo-graph.mjs <graph.json> <cross-repo-links.json>");
  process.exit(2);
}

const graph = JSON.parse(await readFile(graphPath, "utf8"));
const declared = JSON.parse(await readFile(linksPath, "utf8"));
const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
for (const node of declared.nodes ?? []) {
  if (!nodes.has(node.id)) {
    graph.nodes.push(node);
    nodes.set(node.id, node);
  }
}

const links = new Set(
  graph.links.map((link) => `${link.source}\u0000${link.target}\u0000${link.relation}`),
);
for (const link of declared.links ?? []) {
  if (!nodes.has(link.source) || !nodes.has(link.target)) {
    throw new Error(`Cross-repo link endpoint is absent: ${link.source} -> ${link.target}`);
  }
  const key = `${link.source}\u0000${link.target}\u0000${link.relation}`;
  if (links.has(key)) continue;
  graph.links.push({
    relation: link.relation,
    confidence: "DECLARED",
    context: "cross-repo contract",
    evidence: link.evidence,
    source_file: "tools/graphify/cross-repo-links.json",
    source_location: "links",
    weight: 1,
    _origin: "declared",
    source: link.source,
    target: link.target,
  });
  links.add(key);
}
graph.graph = {
  ...(graph.graph ?? {}),
  cross_repo: true,
  repository_scope: ["dr-nona-catalog", "dr-nona-crm", "dr-nona-crm/database"],
  declared_link_count: declared.links?.length ?? 0,
};
await writeFile(graphPath, `${JSON.stringify(graph, null, 2)}\n`);
log(`Augmented ${graphPath}: ${graph.nodes.length} nodes, ${graph.links.length} links`);
