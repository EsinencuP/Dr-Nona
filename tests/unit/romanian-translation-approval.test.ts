import { afterEach, describe, expect, it, vi } from "vitest";
import sources from "../../src/data/products.json";
import translations from "../../src/data/products-ro.json";
import publicTranslations from "../../src/data/products-ro-public.json";
import review from "../../src/data/products-ro-review.json";
import { ro } from "../../src/locales/ro";
import { hasCurrentTranslationApproval, romanianFields, translationFingerprint } from "../../scripts/romanian-translation-approval-lib.mjs";
import { getProductCopy } from "../../src/claims";
import { loadProductData } from "../../src/data";

afterEach(() => {
  vi.doUnmock("../../src/data/runtime-content.json");
  vi.resetModules();
});

describe("Romanian product copy review", () => {
  it("covers every source product and all seven translated fields without Cyrillic", () => {
    expect(Object.keys(translations).sort()).toEqual(sources.map(p => p.slug).sort());
    for (const source of sources) {
      const copy = translations[source.slug as keyof typeof translations];
      expect(hasCurrentTranslationApproval(source, copy, review), source.slug).toBe(false);
      for (const field of ["shortDescription", "longDescription", "ingredients", "howToUse"] as const) {
        expect(review.products[source.slug as keyof typeof review.products][field]).toBe("pending");
      }
      for (const field of romanianFields) {
        expect(copy[field as keyof typeof copy], `${source.slug}.${field}`).toEqual(expect.any(String));
        expect(copy[field as keyof typeof copy].trim().length).toBeGreaterThan(0);
      }
      expect(JSON.stringify(copy)).not.toMatch(/[А-Яа-яЁё]/u);
    }
  });

  it("invalidates approval when source, translation, display name or source URL changes", () => {
    const source = sources[0], copy = translations[source.slug as keyof typeof translations];
    const approvedReview = { ...review, evidence: { ...review.evidence, [source.slug]: {
      ...review.evidence[source.slug as keyof typeof review.evidence],
      sourceHash: translationFingerprint(source),
      translationHash: translationFingerprint(copy),
    } } };
    expect(hasCurrentTranslationApproval(source, copy, approvedReview)).toBe(true);
    expect(hasCurrentTranslationApproval({ ...source, howToUse: "Changed source" }, copy, approvedReview)).toBe(false);
    expect(hasCurrentTranslationApproval(source, { ...copy, ingredients: "Changed translation" }, approvedReview)).toBe(false);
    expect(hasCurrentTranslationApproval(source, { ...copy, officialName: "Different product" }, approvedReview)).toBe(false);
    expect(hasCurrentTranslationApproval(source, { ...copy, sourceUrl: "https://example.com" }, approvedReview)).toBe(false);
    expect(hasCurrentTranslationApproval(source, copy, { products: review.products })).toBe(false);
  });

  it("keeps missing and ambiguous source data explicit instead of fabricating instructions", () => {
    expect(translations["parfum-faya"].ingredients).toBe(ro.ingredientsUnavailable);
    expect(translations["parfum-faya"].howToUse).toContain("Modul de utilizare nu este precizat");
    expect(translations.goldseen.ingredients).toContain("coenzima Q10");
    expect(translations["dnd-chewing-gum-tablets"].howToUse).toContain("maximum 4");
    expect(translations["beauty-mask-for-face"].howToUse).toContain("1 minut");
  });

  it("quarantines all revised Romanian descriptions until they are reviewed", async () => {
    const { products } = await loadProductData("ro");
    for (const product of products) {
      const copy = publicTranslations[product.slug as keyof typeof publicTranslations];
      for (const field of ["shortDescription", "longDescription", "ingredients", "howToUse"] as const) {
        expect(copy[field], `${product.slug}.${field}`).toBeNull();
        if (field === "shortDescription") {
          expect(getProductCopy(product, field).trim().length).toBeGreaterThan(0);
        } else {
          expect(getProductCopy(product, field)).toBe("");
        }
      }
    }
  });

  it("suppresses a pending Romanian legal claim independently of editorial review", async () => {
    const { products } = await loadProductData("ro");
    const product = { ...products.find(product => product.slug === "solaris-body-lotion")!,
      longDescription: translations["solaris-body-lotion"].longDescription };
    expect(product.longDescription).not.toBeNull();
    vi.resetModules();
    vi.doMock("../../src/data/runtime-content.json", () => ({ default: { claims: {
      fieldPublishability: { "product\u001fro:solaris-body-lotion\u001flongDescription": false },
      blockedContent: ["product\u001fro:solaris-body-lotion"],
      blockedScopes: ["product"],
    } } }));
    const guarded = await import("../../src/claims");
    expect(guarded.getProductCopy(product, "longDescription")).toBe("");
    expect(guarded.hasBlockedClaims("product", "ro:solaris-body-lotion")).toBe(true);
  });
});
