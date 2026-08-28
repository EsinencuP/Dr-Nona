import { describe, expect, test } from "vitest";
import { loadProductData } from "../../src/data";
// @ts-expect-error The build validator is an intentionally framework-neutral ESM module.
import { evaluateProductDataset } from "../../scripts/product-content-lib.mjs";

const { allProducts } = await loadProductData();

describe("product content publication gate", () => {
  test("uses one shared image contract and only explicit missing-media placeholders", () => {
    const normalizedImages = allProducts.filter((product) =>
      product.image.startsWith("/products/catalog-normalized/")
    );
    const placeholders = allProducts
      .filter((product) => product.image === "/brand/product-placeholder.svg")
      .map((product) => product.slug);

    expect(normalizedImages).toHaveLength(42);
    expect(placeholders).toEqual([
      "dead-sea-water-compresses",
      "lord-deodorant",
      "lipstick-new",
      "salts-lavander",
      "after-shave-lord",
      "perfume-kiwi",
      "perfume-lady",
      "parfum-faya",
    ]);
    expect(allProducts.every((product) => !("cardImage" in product))).toBe(true);
  });

  test("accepts all 50 current products, including explicitly unavailable fields", () => {
    const report = evaluateProductDataset(allProducts);

    expect(report.errors).toEqual([]);
    expect(report.published).toBe(50);
    expect(report.drafts).toBe(0);
    expect(
      report.assessments.find(
        (product: { slug: string }) => product.slug === "parfum-faya"
      )
    ).toMatchObject({ complete: true, nullFields: ["ingredients", "howToUse"] });
  });

  test("requires the primary catalogue description", () => {
    const brokenDataset = allProducts.map((product) =>
      product.slug === "parfum-faya"
        ? { ...product, longDescription: null }
        : product
    );

    const report = evaluateProductDataset(brokenDataset);

    expect(report.errors).toContain(
      "parfum-faya: published product has 1 content issue(s)."
    );
  });

  test("rejects an empty required description on a published product", () => {
    const brokenDataset = allProducts.map((product) =>
      product.slug === "lord-deodorant"
        ? {
            ...product,
            longDescription: "",
          }
        : product
    );

    const report = evaluateProductDataset(brokenDataset);

    expect(report.errors).toContain(
      "lord-deodorant: published product has 1 content issue(s)."
    );
  });

  test("accepts null for a field unavailable in the source catalogue", () => {
    const brokenDataset = allProducts.map((product) =>
      product.slug === "lord-deodorant"
        ? {
            ...product,
            ingredients: null,
          }
        : product
    );

    const report = evaluateProductDataset(brokenDataset);

    expect(report.errors).toEqual([]);
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
