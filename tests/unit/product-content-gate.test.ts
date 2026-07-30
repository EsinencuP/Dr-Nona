import { describe, expect, test } from "vitest";
import { loadProductData } from "../../src/data";
// @ts-expect-error The build validator is an intentionally framework-neutral ESM module.
import { evaluateProductDataset } from "../../scripts/product-content-lib.mjs";

const { allProducts } = await loadProductData();

describe("product content publication gate", () => {
  test("accepts the current dataset because only complete records are published", () => {
    const report = evaluateProductDataset(allProducts);

    expect(report.errors).toEqual([]);
    expect(report.published).toBe(7);
    expect(report.drafts).toBe(3);
  });

  test("rejects an incomplete product marked as published", () => {
    const brokenDataset = allProducts.map((product) =>
      product.slug === "parfum-faya"
        ? {
            ...product,
            publicationStatus: "published",
            editorialStatus: "ready",
          }
        : product
    );

    const report = evaluateProductDataset(brokenDataset);

    expect(report.errors).toContain(
      "parfum-faya: published product has 4 content issue(s)."
    );
  });

  test("rejects null unless the category rule explicitly allows it", () => {
    const brokenDataset = allProducts.map((product) =>
      product.slug === "lord-deodorant"
        ? {
            ...product,
            ingredients: null,
          }
        : product
    );

    const report = evaluateProductDataset(brokenDataset);

    expect(report.errors).toContain(
      "lord-deodorant: published product has 1 content issue(s)."
    );
  });

  test("rejects an invalid approved release date", () => {
    const brokenDataset = allProducts.map((product) =>
      product.slug === "lord-deodorant"
        ? {
            ...product,
            releasedAt: "not-a-date",
          }
        : product
    );

    const report = evaluateProductDataset(brokenDataset);

    expect(report.errors).toContain(
      "lord-deodorant: releasedAt must be a valid approved date or null."
    );
  });
});
