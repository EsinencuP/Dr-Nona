import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const requiredIgnoreRules = [
  "node_modules/",
  "dist/",
  "coverage/",
  "playwright-report/",
  "test-results/",
  "artifacts/",
  ".env",
  ".env.*",
  "!.env.example",
  "*.log",
  ".DS_Store",
  ".vscode/",
  ".idea/",
];

execFileSync(process.execPath, ["scripts/check-toolchain-contract.mjs"], {
  stdio: "inherit",
});

const ignoreRules = new Set(
  readFileSync(".gitignore", "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
);
const missingIgnoreRules = requiredIgnoreRules.filter(
  (rule) => !ignoreRules.has(rule)
);

if (missingIgnoreRules.length) {
  throw new Error(
    `.gitignore is missing required rules: ${missingIgnoreRules.join(", ")}`
  );
}

const tracked = execFileSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean)
  .map((path) => path.replaceAll("\\", "/"));
const forbiddenTracked = tracked.filter(
  (path) =>
    existsSync(path) &&
    (/^(dist|coverage|playwright-report|test-results|artifacts)\//.test(path) ||
      (/((^|\/)\.env(?:\.|$))/.test(path) && !path.endsWith("/.env.example")) ||
      /(^|\/)[^/]+\.log$/i.test(path) ||
      /^[^/]+\.(?:avif|gif|jpe?g|png|webp)$/i.test(path) ||
      /^public\/generated\/qa-/i.test(path))
);

if (forbiddenTracked.length) {
  throw new Error(
    `Forbidden generated or root QA files are tracked:\n${forbiddenTracked.join(
      "\n"
    )}`
  );
}

const qaRoot = resolve("docs/qa-package");
const packages = existsSync(qaRoot)
  ? readdirSync(qaRoot, { withFileTypes: true }).filter(
      (entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name)
    )
  : [];

for (const qaPackage of packages) {
  execFileSync(
    process.execPath,
    [
      "scripts/generate-qa-artifact-manifest.mjs",
      "--check",
      `--package=docs/qa-package/${qaPackage.name}`,
    ],
    { stdio: "inherit" }
  );
}

console.log(
  `Repository hygiene: ${tracked.length} tracked paths checked; ${packages.length} QA package manifest(s) verified.`
);
