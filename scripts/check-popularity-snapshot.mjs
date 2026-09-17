import { readFileSync } from "node:fs";
import { validatePopularitySnapshot } from "./popularity-snapshot-lib.mjs";

const products = JSON.parse(readFileSync("src/data/products.json", "utf8"));
const snapshot = JSON.parse(readFileSync("src/data/popularity-snapshot.json", "utf8"));
validatePopularitySnapshot(snapshot, products);
console.log(`Popularity snapshot: PASS (${snapshot.mode}; ${snapshot.orderedSlugs.length} ranked products).`);
