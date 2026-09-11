import { createHash } from "node:crypto";

export const romanianFields = ["officialName", "shortDescription", "longDescription", "ingredients", "howToUse", "category", "imageAlt"];

// Bind publication permission to the exact source and translation, not to a slug forever.
export function translationFingerprint(record) {
  return createHash("sha256").update(JSON.stringify([...romanianFields, "sourceUrl", "officialSourceUrl"].map(field => [field, record[field] ?? null]))).digest("hex");
}

export function hasCurrentTranslationApproval(source, translation, review) {
  const evidence = review?.evidence?.[source.slug];
  return review?.authorization?.id === "USER-DIRECT-DECISION-1-2026-09-10" &&
    evidence?.sourceHash === translationFingerprint(source) &&
    evidence?.translationHash === translationFingerprint(translation);
}
