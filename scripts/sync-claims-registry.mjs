import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { buildClaimCandidates } from "./claims-lib.mjs";

const path = "src/data/claims-registry.json";
const existing = existsSync(path)
  ? JSON.parse(readFileSync(path, "utf8"))
  : [];
const existingByFingerprint = new Map(
  existing.map((claim) => [claim.fingerprint, claim])
);

const registry = buildClaimCandidates().map((item) => {
  const previous = existingByFingerprint.get(item.fingerprint);
  return {
    ...item,
    status: previous?.status ?? "pending",
    reviewer: previous?.reviewer ?? null,
    reviewedAt: previous?.reviewedAt ?? null,
    approvalReference: previous?.approvalReference ?? null,
    notes:
      previous?.notes ??
      "Auto-detected candidate. Legal and regulatory validity for Moldova is not verified.",
  };
});

writeFileSync(path, `${JSON.stringify(registry, null, 2)}\n`, "utf8");

const counts = registry.reduce(
  (result, claim) => {
    result[claim.status] += 1;
    return result;
  },
  { approved: 0, rejected: 0, pending: 0 }
);

console.log(
  `Claims registry synced: ${registry.length} total; ${counts.approved} approved, ${counts.rejected} rejected, ${counts.pending} pending.`
);
