import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { findForbiddenTrackedPaths } from "./repository-hygiene-lib.mjs";

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
  "*.tmp",
  "*.bak",
  "*.orig",
  "*.swp",
  "*.zip",
  "*.tar",
  "*.tgz",
  "*.gz",
  "*.7z",
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

const repositoryPaths = execFileSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
  {
  encoding: "utf8",
  }
)
  .split("\0")
  .filter(Boolean)
  .map((path) => path.replaceAll("\\", "/"));
const forbiddenTracked = findForbiddenTrackedPaths(repositoryPaths);

if (forbiddenTracked.length) {
  throw new Error(
    `Forbidden generated or root QA files are tracked:\n${forbiddenTracked.join(
      "\n"
    )}`
  );
}

execFileSync(process.execPath, ["scripts/check-documentation.mjs"], {
  stdio: "inherit",
});

console.log(
  `Repository hygiene: ${repositoryPaths.length} tracked/untracked source paths checked; documentation links and release state verified.`
);
