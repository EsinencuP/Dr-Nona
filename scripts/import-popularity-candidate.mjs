import { readFileSync, writeFileSync } from "node:fs";
import { preparePopularitySnapshot, validatePopularitySnapshot } from "./popularity-snapshot-lib.mjs";

const candidatePath = process.argv[2];
const write = process.argv.includes("--write");
if (!candidatePath || candidatePath.startsWith("--")) {
  throw new Error("Usage: node scripts/import-popularity-candidate.mjs <candidate.json> [--write]");
}
const products = JSON.parse(readFileSync("src/data/products.json", "utf8"));
const candidate = JSON.parse(readFileSync(candidatePath, "utf8"));
const snapshot = preparePopularitySnapshot(candidate, products);
if (!snapshot) {
  console.log("Popularity candidate has insufficient real orders; retain the truthful catalogue-order fallback.");
  process.exit(0);
}
validatePopularitySnapshot(snapshot, products);
const current = JSON.parse(readFileSync("src/data/popularity-snapshot.json", "utf8"));
validatePopularitySnapshot(current, products);
if (
  current.mode === "ranked" &&
  JSON.stringify(current.orderedSlugs) === JSON.stringify(snapshot.orderedSlugs) &&
  Date.parse(current.expiresAt) - Date.now() > 2 * 24 * 60 * 60 * 1000
) {
  console.log("Popularity order is unchanged and the reviewed snapshot is still fresh; no update needed.");
  process.exit(0);
}
if (write) {
  writeFileSync("src/data/popularity-snapshot.json", `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
}
console.log(`Popularity candidate: ${snapshot.orderedSlugs.length} published products; digest ${snapshot.sourceDigest}; ${write ? "prepared for review" : "dry run"}.`);
