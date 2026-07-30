import { readFileSync } from "node:fs";
import {
  buildClaimCandidates,
  validateClaimRegistry,
} from "./claims-lib.mjs";

const registry = JSON.parse(
  readFileSync("src/data/claims-registry.json", "utf8")
);
const candidates = buildClaimCandidates();
const errors = validateClaimRegistry(registry, candidates);

if (errors.length) {
  console.error(`Claims registry: FAIL (${errors.length} errors).`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const counts = registry.reduce(
  (result, claim) => {
    result[claim.status] += 1;
    return result;
  },
  { approved: 0, rejected: 0, pending: 0 }
);

console.log(
  `Claims registry: PASS (${registry.length} records; ${counts.approved} approved, ${counts.rejected} rejected, ${counts.pending} pending).`
);
