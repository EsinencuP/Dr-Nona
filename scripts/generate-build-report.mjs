import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { platform } from "node:os";
import {
  CATEGORY_CONTENT_RULES,
  evaluateProductDataset,
} from "./product-content-lib.mjs";

const products = JSON.parse(readFileSync("src/data/products.json", "utf8"));
const content = JSON.parse(readFileSync("src/data/official-pages.json", "utf8"));
const claims = JSON.parse(
  readFileSync("src/data/claims-registry.json", "utf8")
);
const market = JSON.parse(readFileSync("src/data/market.json", "utf8"));
const seo = JSON.parse(readFileSync("src/data/seo-manifest.json", "utf8"));
const release = JSON.parse(readFileSync("docs/release-status.json", "utf8"));
const productContent = evaluateProductDataset(products);
const approvedReleaseDates = products.filter(
  (product) => product.releasedAt !== null
).length;
const indexableSeoRoutes = seo.routes.filter((route) => route.indexable).length;
const productSeoRoutes = seo.routes.filter(
  (route) => route.kind === "product"
).length;
const articleSeoRoutes = seo.routes.filter(
  (route) => route.kind === "blog" || route.kind === "news"
).length;
if (productContent.errors.length) {
  throw new Error(
    `Product content gate failed: ${productContent.errors.join(" ")}`
  );
}
const claimCounts = claims.reduce(
  (result, claim) => {
    result[claim.status] += 1;
    return result;
  },
  { approved: 0, rejected: 0, pending: 0 }
);

const openBlockers = release.blockers.filter((blocker) =>
  ["P0", "P1"].includes(blocker.priority)
);

if (release.status === "release-ready" && openBlockers.length > 0) {
  throw new Error("Release status cannot be ready while P0/P1 blockers remain.");
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

const commit = git("rev-parse", "HEAD");
const branch = git("branch", "--show-current") || "detached";
const statusLines = git("status", "--porcelain", "--untracked-files=all")
  .split(/\r?\n/)
  .filter(Boolean);
const repositoryState = statusLines.length
  ? `dirty (${statusLines.length} changed paths)`
  : "clean";
const generatedAt = new Date().toISOString();
const changedFiles = git("diff", "--name-only", "-z", "HEAD", "--", ".")
  .split("\0")
  .filter(Boolean)
  .sort();
const untrackedFiles = git("ls-files", "--others", "--exclude-standard")
  .split(/\r?\n/)
  .filter(Boolean)
  .sort();
const sourceSnapshot = createHash("sha256")
  .update(commit);

for (const path of changedFiles) {
  sourceSnapshot.update("changed\0");
  sourceSnapshot.update(path);
  sourceSnapshot.update("\0");
  if (existsSync(path)) {
    sourceSnapshot.update(readFileSync(path));
  } else {
    sourceSnapshot.update("deleted");
  }
}

for (const path of untrackedFiles) {
  sourceSnapshot.update(path);
  sourceSnapshot.update(readFileSync(path));
}

const sourceSnapshotSha = sourceSnapshot.digest("hex");
const reportDirectory = "artifacts/reports";
mkdirSync(reportDirectory, { recursive: true });

const blockerRows = openBlockers
  .map(
    (blocker) =>
      `| ${blocker.id} | ${blocker.priority} | ${blocker.summary} |`
  )
  .join("\n");

const report = `# What did the current build verify?

This generated report records the dataset, environment and repository identity used by the latest successful production build.

## Build identity

| Field | Value |
|---|---|
| Generated at, UTC | ${generatedAt} |
| Status date | ${release.asOf} |
| Base commit | \`${commit}\` |
| Branch | \`${branch}\` |
| Source repository state | ${repositoryState} |
| Source snapshot SHA-256 | \`${sourceSnapshotSha}\` |
| Environment | ${release.environment} |
| Node.js | \`${process.version}\` |
| Platform | \`${platform()} ${process.arch}\` |
| Build gate | PASS |
| Release verdict | ${release.label} |

## Dataset counts

| Dataset | Source | Count |
|---|---|---:|
| Products | \`src/data/products.json\` | ${products.length} |
| Published products | \`publicationStatus: published\` | ${productContent.published} |
| Draft products | \`publicationStatus: draft\` | ${productContent.drafts} |
| Approved product release dates | \`releasedAt\` | ${approvedReleaseDates} |
| Official content | \`src/data/official-pages.json\` | ${content.length} |
| Claims registry | \`src/data/claims-registry.json\` | ${claims.length} |
| Approved claims | registry status | ${claimCounts.approved} |
| Pending claims | registry status | ${claimCounts.pending} |
| Rejected claims | registry status | ${claimCounts.rejected} |
| Moldova contact phones | \`src/data/market.json\` | ${market.contact.phones.length} |
| Approved Moldova certificates | \`src/data/market.json\` | ${market.moldovaCertificates.length} |
| Prerendered routes | \`src/data/seo-manifest.json\` | ${seo.routes.length} |
| Indexable SEO routes | manifest \`indexable: true\` | ${indexableSeoRoutes} |
| Product JSON-LD routes | manifest \`kind: product\` | ${productSeoRoutes} |
| Article JSON-LD routes | manifest \`kind: blog/news\` | ${articleSeoRoutes} |

## Open release blockers

| ID | Priority | Blocker |
|---|---|---|
${blockerRows}

A successful build verifies compilation and bundling. It does not mark the production release ready while these blockers remain.

## Reproduce this report

Run \`npm run build\`. The command compiles the application, creates the Vite bundle and rewrites this file from repository data.
`;

writeFileSync(`${reportDirectory}/BUILD_REPORT.md`, report, "utf8");

const productRows = productContent.assessments
  .map((assessment) => {
    const missing = assessment.missingFields.length
      ? assessment.missingFields.map((field) => `\`${field}\``).join(", ")
      : "—";
    const nullable = assessment.nullFields.length
      ? assessment.nullFields.map((field) => `\`${field}\``).join(", ")
      : "—";
    const releasedAt =
      products.find((product) => product.slug === assessment.slug)
        ?.releasedAt ?? "—";
    return `| \`${assessment.slug}\` | ${assessment.category} | ${assessment.publicationStatus} | ${assessment.editorialStatus} | ${releasedAt} | ${missing} | ${nullable} |`;
  })
  .join("\n");
const rulesRows = Object.entries(CATEGORY_CONTENT_RULES)
  .map(
    ([category, rule]) =>
      `| ${category} | ${rule.required.map((field) => `\`${field}\``).join(", ")} | ${
        rule.nullable.length
          ? rule.nullable.map((field) => `\`${field}\``).join(", ")
          : "—"
      } |`
  )
  .join("\n");
const productContentReport = `# Product content completeness report

Generated automatically by \`npm run build\`.

## Identity

| Field | Value |
|---|---|
| Generated at, UTC | ${generatedAt} |
| Base commit | \`${commit}\` |
| Source snapshot SHA-256 | \`${sourceSnapshotSha}\` |
| Total records | ${productContent.total} |
| Published | ${productContent.published} |
| Draft | ${productContent.drafts} |
| Published records with missing required content | 0 |

## Category rules

| Category | Required fields | Nullable fields |
|---|---|---|
${rulesRows}

\`null\` is reserved for a field that the approved category rule explicitly
marks as not applicable. An empty string always means missing editorial data.

## Product status

| Product | Category | Publication | Editorial | Approved release date | Missing required fields | Null fields |
|---|---|---|---|---|---|---|
${productRows}

Draft records remain in the source dataset for editorial work but are excluded
from catalogue, search, product routes, related products and selections.
`;

writeFileSync(
  `${reportDirectory}/PRODUCT_CONTENT_REPORT.md`,
  productContentReport,
  "utf8"
);

const qaReportPath = "docs/QA_REPORT.md";
const qaReport = readFileSync(qaReportPath, "utf8");
const identityStart = "<!-- build-identity:start -->";
const identityEnd = "<!-- build-identity:end -->";
const identity = `${identityStart}
- **Report generated, UTC**: ${generatedAt}
- **Status date**: ${release.asOf}
- **Base commit**: \`${commit}\`
- **Repository state**: ${repositoryState}
- **Source snapshot SHA-256**: \`${sourceSnapshotSha}\`
- **Environment**: ${release.environment}
- **Products**: ${products.length}
- **Published products**: ${productContent.published}
- **Draft products**: ${productContent.drafts}
- **Official content records**: ${content.length}
- **Claims registry records**: ${claims.length}
- **Claims approval**: ${claimCounts.approved} approved, ${claimCounts.pending} pending, ${claimCounts.rejected} rejected
- **Moldova contact phones**: ${market.contact.phones.length}
- **Approved Moldova certificates**: ${market.moldovaCertificates.length}
- **Prerendered routes**: ${seo.routes.length}
- **Indexable SEO routes**: ${indexableSeoRoutes}
- **Structured data routes**: ${productSeoRoutes} Product, ${articleSeoRoutes} Article
${identityEnd}`;

if (!qaReport.includes(identityStart) || !qaReport.includes(identityEnd)) {
  throw new Error("QA_REPORT.md is missing its generated build-identity markers.");
}

writeFileSync(
  `${reportDirectory}/QA_BUILD_IDENTITY.md`,
  `# QA build identity\n\n${identity}\n`,
  "utf8"
);

const activeStatusDocs = [
  "README.md",
  "docs/PROJECT_STATUS.md",
  "docs/QA_REPORT.md",
  "docs/RELEASE_STATUS.md",
];
const forbiddenClaims = [
  /implementation complete/i,
  /Status:\s*Discovery/i,
  /PASS for the deployable frontend build/i,
  /\b55\s+(products|продуктов)\b/i,
  /\b55\/55\b/,
];

for (const path of activeStatusDocs) {
  const source = readFileSync(path, "utf8");
  const forbidden = forbiddenClaims.find((pattern) => pattern.test(source));
  if (forbidden) {
    throw new Error(`${path} contains a stale release claim: ${forbidden}`);
  }
}

const countDocs = [
  "docs/PROJECT_STATUS.md",
  "docs/QA_REPORT.md",
  "docs/RELEASE_STATUS.md",
];

for (const path of countDocs) {
  const source = readFileSync(path, "utf8");
  if (!source.includes(String(products.length))) {
    throw new Error(`${path} does not name the current product count.`);
  }
  if (!source.includes(String(content.length))) {
    throw new Error(`${path} does not name the current content count.`);
  }
}

const blockerDocs = [
  "docs/RELEASE_STATUS.md",
  "docs/ROADMAP.md",
];

for (const blocker of openBlockers) {
  for (const path of blockerDocs) {
    const source = readFileSync(path, "utf8");
    if (!source.includes(blocker.id)) {
      throw new Error(`${path} does not list open blocker ${blocker.id}.`);
    }
  }
}

console.log(
  `Build report: ${products.length} product records (${productContent.published} published, ${productContent.drafts} drafts), ${content.length} content records, ${claims.length} claims, ${openBlockers.length} blockers. Release docs: consistent.`
);
