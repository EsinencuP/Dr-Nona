import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const nodeVersion = readFileSync(".nvmrc", "utf8").trim();
const ciWorkflow = readFileSync(".github/workflows/ci.yml", "utf8");
const readme = readFileSync("README.md", "utf8");
const failures = [];

if (packageJson.packageManager !== "npm@10.9.8") {
  failures.push("packageManager must be npm@10.9.8.");
}
if (packageJson.engines?.node !== ">=22.23.1 <23") {
  failures.push("Node engine must match the supported Node 22 range.");
}
if (packageJson.engines?.npm !== ">=10.9.8 <11") {
  failures.push("npm engine must match the supported npm 10 range.");
}
if (nodeVersion !== "22.23.1") {
  failures.push(".nvmrc must pin Node 22.23.1.");
}
if (process.versions.node !== nodeVersion) {
  failures.push(
    `Current Node ${process.versions.node} does not match .nvmrc ${nodeVersion}.`
  );
}
if (packageJson.dependencies?.cheerio) {
  failures.push("Cheerio is build-only and must not be a production dependency.");
}
if (!packageJson.devDependencies?.cheerio) {
  failures.push("Cheerio must be declared in devDependencies.");
}
const lockRoot = packageLock.packages?.[""] ?? {};
if (lockRoot.dependencies?.cheerio) {
  failures.push("The lockfile exposes Cheerio as a production dependency.");
}
if (!lockRoot.devDependencies?.cheerio) {
  failures.push("The lockfile must classify Cheerio as a development dependency.");
}
if (packageLock.packages?.["node_modules/cheerio"]?.dev !== true) {
  failures.push("The installed Cheerio lockfile branch must be development-only.");
}
if (!ciWorkflow.includes("node-version-file: .nvmrc")) {
  failures.push("CI must read Node from .nvmrc.");
}
if (!ciWorkflow.includes("npm install --global npm@10.9.8")) {
  failures.push("CI must install the pinned npm version.");
}
if (/\bnpm\.cmd\b/.test(readme)) {
  failures.push("README commands must use portable npm syntax.");
}

if (failures.length) {
  throw new Error(`Toolchain contract failed:\n${failures.join("\n")}`);
}

console.log(
  `Toolchain contract: Node ${nodeVersion}, npm 10.9.8, Cheerio development-only, portable README commands.`
);

