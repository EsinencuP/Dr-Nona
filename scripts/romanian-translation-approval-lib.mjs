import { createHash } from "node:crypto";

export const romanianFields = ["officialName", "shortDescription", "longDescription", "ingredients", "howToUse", "category", "imageAlt"];
const approvedDecisionIds = new Set([
  "USER-DIRECT-DECISION-1-2026-09-10",
  "USER-DIRECT-DECISION-2-2026-10-05",
]);

// Bind publication permission to the exact source and translation, not to a slug forever.
export function translationFingerprint(record) {
  return createHash("sha256").update(JSON.stringify([...romanianFields, "sourceUrl", "officialSourceUrl"].map(field => [field, record[field] ?? null]))).digest("hex");
}

export function hasCurrentTranslationApproval(source, translation, review) {
  const evidence = review?.evidence?.[source.slug];
  return approvedDecisionIds.has(review?.authorization?.id) &&
    evidence?.sourceHash === translationFingerprint(source) &&
    evidence?.translationHash === translationFingerprint(translation);
}
