export const romanianFields: readonly ["officialName", "shortDescription", "longDescription", "ingredients", "howToUse", "category", "imageAlt"];
type TranslationRecord = Partial<Record<typeof romanianFields[number] | "sourceUrl" | "officialSourceUrl", string | null>>;
type TranslationReview = {
  authorization?: { id?: string };
  products?: unknown;
  evidence?: Record<string, { sourceHash: string; translationHash: string }>;
};
export function translationFingerprint(record: TranslationRecord): string;
export function hasCurrentTranslationApproval(source: TranslationRecord & { slug: string }, translation: TranslationRecord, review: TranslationReview): boolean;
