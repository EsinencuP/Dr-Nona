import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, relative, resolve, sep } from "node:path";

const packageDirectory = resolve(
  process.argv.find((argument) => argument.startsWith("--package="))?.slice(10) ??
    "docs/qa-package/2026-07-27"
);
const checkOnly = process.argv.includes("--check");
const manifestPath = resolve(packageDirectory, "ARTIFACT_MANIFEST.json");
const imagePattern = /\.(avif|gif|jpe?g|png|webp)$/i;

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      return walk(absolutePath);
    }
    return imagePattern.test(entry.name) ? [absolutePath] : [];
  });
}

function classify(path) {
  const normalized = path.replaceAll(sep, "/").toLowerCase();
  const name = normalized.split("/").at(-1);

  if (normalized.includes("/project_references/raw/")) return "raw-reference";
  if (normalized.includes("/project_references/")) return "approved-reference";
  if (normalized.includes("/legacy-root-captures/")) return "historical-capture";
  if (normalized.includes("/source-masters/")) return "source-master";
  if (name.includes("comparison")) return "comparison";
  if (name.includes("before")) return "before";
  if (name.includes("after") || name.includes("final")) return "accepted";
  return "supporting-evidence";
}

const packageDate = basename(packageDirectory);
const report = `docs/qa-package/${packageDate}/IMPLEMENTATION_REPORT.md`;
const artifacts = walk(packageDirectory)
  .sort((left, right) => left.localeCompare(right, "en"))
  .map((absolutePath) => {
    const bytes = readFileSync(absolutePath);
    return {
      path: relative(packageDirectory, absolutePath).replaceAll(sep, "/"),
      role: classify(absolutePath),
      status: "historical-evidence",
      report,
      sourceCommit: "not-recorded-historical-working-tree",
      bytes: statSync(absolutePath).size,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  });

const manifest = `${JSON.stringify(
  {
    schemaVersion: 1,
    packageDate,
    provenance:
      "Historical local QA evidence. The original commit was not recorded; this package is not release evidence.",
    report,
    artifacts,
  },
  null,
  2
)}\n`;

if (checkOnly) {
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing QA artifact manifest: ${manifestPath}`);
  }
  if (readFileSync(manifestPath, "utf8") !== manifest) {
    throw new Error(
      "QA artifact manifest is stale. Run `npm run qa:artifacts` and review the diff."
    );
  }
  console.log(`QA artifact manifest: ${artifacts.length} files verified.`);
} else {
  writeFileSync(manifestPath, manifest, "utf8");
  console.log(`QA artifact manifest: ${artifacts.length} files recorded.`);
}
