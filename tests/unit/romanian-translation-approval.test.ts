import { afterEach, describe, expect, it, vi } from "vitest";
import sources from "../../src/data/products.json";
import translations from "../../src/data/products-ro.json";
import publicTranslations from "../../src/data/products-ro-public.json";
import review from "../../src/data/products-ro-review.json";
import { ro } from "../../src/locales/ro";
import { hasCurrentTranslationApproval, romanianFields } from "../../scripts/romanian-translation-approval-lib.mjs";
import { getProductCopy } from "../../src/claims";
import { loadProductData } from "../../src/data";

afterEach(() => {
  vi.doUnmock("../../src/data/runtime-content.json");
  vi.resetModules();
});

describe("owner-authorized Romanian localization", () => {
  it("covers every source product and all seven translated fields without Cyrillic", () => {
    expect(Object.keys(translations).sort()).toEqual(sources.map(p => p.slug).sort());
    for (const source of sources) {
      const copy = translations[source.slug as keyof typeof translations];
      expect(hasCurrentTranslationApproval(source, copy, review), source.slug).toBe(true);
      for (const field of romanianFields) {
        expect(copy[field as keyof typeof copy], `${source.slug}.${field}`).toEqual(expect.any(String));
        expect(copy[field as keyof typeof copy].trim().length).toBeGreaterThan(0);
      }
      expect(JSON.stringify(copy)).not.toMatch(/[А-Яа-яЁё]/u);
    }
  });

  it("invalidates approval when source, translation, display name or source URL changes", () => {
    const source = sources[0], copy = translations[source.slug as keyof typeof translations];
    expect(hasCurrentTranslationApproval({ ...source, howToUse: "Changed source" }, copy, review)).toBe(false);
    expect(hasCurrentTranslationApproval(source, { ...copy, ingredients: "Changed translation" }, review)).toBe(false);
    expect(hasCurrentTranslationApproval(source, { ...copy, officialName: "Different product" }, review)).toBe(false);
    expect(hasCurrentTranslationApproval(source, { ...copy, sourceUrl: "https://example.com" }, review)).toBe(false);
    expect(hasCurrentTranslationApproval(source, copy, { products: review.products })).toBe(false);
  });

  it("keeps missing and ambiguous source data explicit instead of fabricating instructions", () => {
    expect(translations["parfum-faya"].ingredients).toBe(ro.ingredientsUnavailable);
    expect(translations["parfum-faya"].howToUse).toBe(ro.useUnavailable);
    expect(translations.goldseen.ingredients).toBe(ro.ingredientsUnavailable);
    expect(review.evidence.goldseen.sourceIssues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "ingredients", status: "NEEDS_EDITORIAL_REVIEW" }),
    ]));
    expect(translations["dnd-chewing-gum-tablets"].howToUse).toContain("maximum 4");
    expect(translations["beauty-mask-for-face"].howToUse).toContain("50 de secunde");
  });

  it("makes all four fields available through the actual public copy accessor for all 50 products", async () => {
    const { products } = await loadProductData("ro");
    for (const product of products) {
      const copy = publicTranslations[product.slug as keyof typeof publicTranslations];
      for (const field of ["shortDescription", "longDescription", "ingredients", "howToUse"] as const) {
        expect(getProductCopy(product, field), `${product.slug}.${field}`).toBe(copy[field]);
        expect(getProductCopy(product, field).trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("still suppresses a pending Romanian legal claim even with owner-authorized translation", async () => {
    const { products } = await loadProductData("ro");
    const product = products.find(product => product.slug === "solaris-body-lotion")!;
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
