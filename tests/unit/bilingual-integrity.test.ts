import { afterEach, describe, expect, it, vi } from "vitest";
import { ru } from "../../src/locales/ru";
import { ro } from "../../src/locales/ro";
import { inlineLocaleResources, keysetDifference, productFieldStatus } from "../../scripts/bilingual-parity-lib.mjs";

afterEach(() => { vi.doUnmock("../../src/data/products-ro-public.json"); vi.resetModules(); });

describe("bilingual integrity", () => {
  it("requires exactly the same RU/RO UI keyset, including inline dictionaries", () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(ro).sort());
    const resources = inlineLocaleResources();
    expect(resources.length).toBeGreaterThan(0);
    for (const resource of resources) expect(keysetDifference(resource.ru, resource.ro), `${resource.file}:${resource.line}`).toEqual({ missingRo: [], missingRu: [] });
  });

  it("detects missing nested buttons and orphan translated keys", () => {
    expect(keysetDifference({ buttons: { save: "Save", reset: "Reset" } }, { buttons: { save: "Salvează", extra: "Extra" } })).toEqual({ missingRo: ["buttons.reset"], missingRu: ["buttons.extra"] });
  });

  it("does not certify missing composition or machine-assessed prose", () => {
    expect(productFieldStatus(null, null, "ingredients")).toBe("NEEDS_EDITORIAL_REVIEW");
    expect(productFieldStatus("Source composition", null, "ingredients")).toBe("MISSING_RO");
    expect(productFieldStatus("Source description", "Descriere sursă", "longDescription")).toBe("NEEDS_EDITORIAL_REVIEW");
  });

  it.each([{}, { "solaris-body-lotion": { category: "Creme" } }])("refuses incomplete RO datasets instead of merging Russian descriptive copy", async (data) => {
    vi.resetModules();
    vi.doMock("../../src/data/products-ro-public.json", () => ({ default: data }));
    const { loadProductData } = await import("../../src/data");
    await expect(loadProductData("ro")).rejects.toThrow("Incomplete Romanian product record");
  });
});
