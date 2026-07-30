import { readFileSync } from "node:fs";
import {
  buildClaimCandidates,
  validateClaimRegistry,
} from "./claims-lib.mjs";

const release = JSON.parse(
  readFileSync("docs/release-status.json", "utf8")
);
const claims = JSON.parse(
  readFileSync("src/data/claims-registry.json", "utf8")
);
const claimErrors = validateClaimRegistry(claims, buildClaimCandidates());
const unapprovedClaims = claims.filter(
  (claim) => claim.status !== "approved"
);
const blockers = release.blockers.filter((blocker) =>
  ["P0", "P1"].includes(blocker.priority)
);

if (
  release.status !== "release-ready" ||
  blockers.length > 0 ||
  claimErrors.length > 0 ||
  unapprovedClaims.length > 0
) {
  console.error(`Release gate: BLOCKED (${blockers.length} open P0/P1 items).`);
  for (const blocker of blockers) {
    console.error(`${blocker.id} [${blocker.priority}]: ${blocker.summary}`);
  }
  if (claimErrors.length) {
    console.error(`Claims registry has ${claimErrors.length} validation errors.`);
  }
  if (unapprovedClaims.length) {
    console.error(
      `Claims approval: ${unapprovedClaims.length} records are pending or rejected.`
    );
  }
  process.exit(1);
}

console.log("Release gate: READY.");
