import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const release = readJson("docs/release-status.json");
const products = readJson("src/data/products.json");
const content = readJson("src/data/official-pages.json");
const claims = readJson("src/data/claims-registry.json");
const seo = readJson("src/data/seo-manifest.json");
const packageJson = readJson("package.json");
const errors = [];
const currentCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();

const productCounts = products.reduce(
  (counts, product) => {
    counts[product.publicationStatus] += 1;
    return counts;
  },
  { published: 0, draft: 0 }
);
const claimCounts = claims.reduce(
  (counts, claim) => {
    counts[claim.status] += 1;
    return counts;
  },
  { approved: 0, pending: 0, rejected: 0 }
);
const actualCounts = {
  sourceProducts: products.length,
  publishedProducts: productCounts.published,
  draftProducts: productCounts.draft,
  officialContentRecords: content.length,
  claims: { total: claims.length, ...claimCounts },
};

function renderReleaseStatus(status) {
  const blockerRows = status.blockers
    .map(
      (blocker) =>
        `| \`${blocker.id}\` | ${blocker.priority} | ${blocker.owner} | ${blocker.summary} |`
    )
    .join("\n");
  const criteria = status.blockers
    .map(
      (blocker) => `### \`${blocker.id}\`\n\n${blocker.acceptanceCriteria
        .map((item) => `- ${item}`)
        .join("\n")}`
    )
    .join("\n\n");
  return `# Is the Dr. Nona Moldova site ready for production?\n\nNo. Technical quality gates pass locally, but production approval remains blocked by the items below.\n\nLast verified: ${status.asOf} against base commit \`${status.commit}\` and the current cleanup worktree.\n\nThis file is generated from \`docs/release-status.json\`. Run \`npm run release:status:generate\` after changing the machine-readable status.\n\n## Status identity\n\n| Field | Value |\n|---|---|\n| Verdict | \`${status.status}\` |\n| Label | ${status.label} |\n| Branch | \`${status.branch}\` |\n| Base commit | \`${status.commit}\` |\n| Environment | ${status.environment} |\n\n## Current dataset\n\n| Dataset | Count |\n|---|---:|\n| Source products | ${status.counts.sourceProducts} |\n| Published products | ${status.counts.publishedProducts} |\n| Draft products | ${status.counts.draftProducts} |\n| Official content records | ${status.counts.officialContentRecords} |\n| Claims | ${status.counts.claims.total} |\n| Approved claims | ${status.counts.claims.approved} |\n| Pending claims | ${status.counts.claims.pending} |\n| Rejected claims | ${status.counts.claims.rejected} |\n\n## Open release blockers\n\n| ID | Priority | Owner | Summary |\n|---|---|---|---|\n${blockerRows}\n\n## Acceptance criteria\n\n${criteria}\n\n## Release rule\n\nA successful build confirms compilation, generated output and automated checks. It does not approve legal content, business data, production operations or deployment.\n\nChange the verdict to \`release-ready\` only when every P0 and P1 blocker is closed and \`npm run release:check\` exits successfully.\n`;
}

const allowedOwners = new Set([
  "external",
  "content",
  "legal",
  "engineering",
  "product",
]);
const blockerIds = new Set();
for (const blocker of release.blockers ?? []) {
  if (!/^P[01]-[A-Z0-9-]+$/.test(blocker.id)) {
    errors.push(`Invalid blocker ID: ${blocker.id}`);
  }
  if (blockerIds.has(blocker.id)) errors.push(`Duplicate blocker ID: ${blocker.id}`);
  blockerIds.add(blocker.id);
  if (!allowedOwners.has(blocker.owner)) errors.push(`Invalid blocker owner: ${blocker.id}`);
  if (blocker.status !== "open") errors.push(`Non-open blocker remains listed: ${blocker.id}`);
  if (!Array.isArray(blocker.acceptanceCriteria) || blocker.acceptanceCriteria.length === 0) {
    errors.push(`Missing acceptance criteria: ${blocker.id}`);
  }
}
if (release.status === "release-ready" && release.blockers.length) {
  errors.push("release-ready cannot contain open blockers");
}
if (release.commit !== currentCommit) {
  errors.push(`release status commit ${release.commit} does not match HEAD ${currentCommit}`);
}
if (JSON.stringify(release.counts) !== JSON.stringify(actualCounts)) {
  errors.push("release-status.json counts do not match source data");
}

const expectedReleaseMarkdown = renderReleaseStatus(release);
if (process.argv.includes("--write-release")) {
  writeFileSync("docs/RELEASE_STATUS.md", expectedReleaseMarkdown, "utf8");
}
if (readFileSync("docs/RELEASE_STATUS.md", "utf8") !== expectedReleaseMarkdown) {
  errors.push("RELEASE_STATUS.md is not synchronized with release-status.json");
}

const requiredDocs = [
  "AGENTS.md",
  "docs/PROJECT_STATUS.md",
  "docs/RELEASE_STATUS.md",
  "docs/ROADMAP.md",
  "docs/FRONTEND_ARCHITECTURE.md",
  "docs/DESIGN_SYSTEM.md",
  "docs/CI.md",
  "docs/CLAIMS_REVIEW.md",
  "docs/MOLDOVA_MARKET.md",
];
for (const path of requiredDocs) {
  if (!existsSync(path)) errors.push(`Missing canonical document: ${path}`);
  if (!readFileSync("README.md", "utf8").includes(path)) {
    errors.push(`README.md does not link to ${path}`);
  }
}

function walkMarkdown(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return walkMarkdown(path);
    return entry.name.endsWith(".md") ? [path] : [];
  });
}

const markdownFiles = [resolve("README.md"), resolve("AGENTS.md"), ...walkMarkdown("docs")].filter(existsSync);
const scripts = new Set(Object.keys(packageJson.scripts));
for (const absolutePath of markdownFiles) {
  const source = readFileSync(absolutePath, "utf8");
  const relativePath = absolutePath.slice(resolve(".").length + 1).replaceAll("\\", "/");
  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split("#", 1)[0].trim();
    if (!target || /^(?:https?:|mailto:|tel:|#)/i.test(target)) continue;
    const resolvedTarget = resolve(dirname(absolutePath), decodeURIComponent(target));
    if (!existsSync(resolvedTarget)) errors.push(`${relativePath}: broken link ${target}`);
  }
  for (const match of source.matchAll(/\bnpm(?:\.cmd)?\s+run\s+([a-zA-Z0-9:_-]+)/g)) {
    if (!scripts.has(match[1])) errors.push(`${relativePath}: unknown npm script ${match[1]}`);
  }
}

const stalePattern = new RegExp(
  [
    "design" + "-qa\\.md",
    "qa" + "-package",
    "audit/" + "2026-07-26",
    "archive/" + "qa",
    "drnona_product_" + "creative",
    "drnona_products_" + "catalog",
    "docs/" + "ref",
    "WEB_" + "PROMPT",
    "IMPLEMENTATION_" + "READINESS",
    "IMPLEMENTATION_" + "HANDOFF",
    "OPEN_" + "QUESTIONS",
    "REFERENCE_" + "ANALYSIS",
    "REF_IMAGE_" + "ANALYSIS",
  ].join("|")
);
const staleScanRoots = ["README.md", "AGENTS.md", "docs", "src", "scripts", "tests", "package.json"];
for (const root of staleScanRoots) {
  if (!existsSync(root)) continue;
  const files = statSync(root).isDirectory()
    ? readdirSync(root, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => resolve(entry.parentPath, entry.name))
    : [resolve(root)];
  for (const path of files) {
    if (
      path.endsWith("check-documentation.mjs") ||
      path.endsWith("repository-hygiene-lib.mjs") ||
      path.endsWith("repository-hygiene.test.ts")
    ) continue;
    if (!/\.(?:css|html|js|json|md|mjs|mts|ts|tsx|yml|yaml)$/.test(path)) continue;
    if (stalePattern.test(readFileSync(path, "utf8"))) {
      errors.push(`Stale documentation path remains in ${path.slice(resolve(".").length + 1)}`);
    }
  }
}

const projectStatus = readFileSync("docs/PROJECT_STATUS.md", "utf8");
for (const count of [
  actualCounts.sourceProducts,
  actualCounts.publishedProducts,
  actualCounts.draftProducts,
  actualCounts.officialContentRecords,
  actualCounts.claims.total,
  actualCounts.claims.approved,
  actualCounts.claims.pending,
  actualCounts.claims.rejected,
]) {
  if (!projectStatus.includes(String(count))) {
    errors.push(`PROJECT_STATUS.md does not include current count ${count}`);
  }
}
if (!projectStatus.includes("Russian only")) {
  errors.push("PROJECT_STATUS.md does not state the current Russian-only UI contract");
}

const pageInventory = readFileSync("docs/PAGE_INVENTORY.md", "utf8");
const knownRoutes = new Set(seo.routes.map((route) => route.path));
for (const match of pageInventory.matchAll(/`(\/[^`]+)`/g)) {
  const route = match[1];
  if (route.includes(":") || route.includes("...")) continue;
  if (route === "/main" || route === "/unknown-route") continue;
  if (!knownRoutes.has(route)) errors.push(`PAGE_INVENTORY.md names unknown route ${route}`);
}

if (errors.length) {
  throw new Error(`Documentation validation failed:\n${errors.join("\n")}`);
}

console.log(
  `Documentation: PASS (${markdownFiles.length} Markdown files; ${release.blockers.length} synchronized blockers; ${products.length} products; ${claims.length} claims).`
);
