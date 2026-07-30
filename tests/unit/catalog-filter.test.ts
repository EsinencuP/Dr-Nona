import { describe, expect, test } from "vitest";
import { loadProductData, type Product } from "../../src/data";
import { filterCatalogProducts } from "../../src/features/catalog/filterProducts";

const { products } = await loadProductData();

function productFixture(overrides: Partial<Product>): Product {
  return { ...products[0], ...overrides };
}

describe("catalog filtering", () => {
  const fixtures = [
    productFixture({
      slug: "alpha",
      officialName: "Alpha Cream",
      shortDescription: "Морские минералы",
      category: "Уход",
      popularityRank: 2,
    }),
    productFixture({
      slug: "beta",
      officialName: "Beta Lotion",
      shortDescription: "Ежедневный уход",
      category: "Тело",
      popularityRank: 1,
    }),
  ];

  test("searches product names and approved short descriptions", () => {
    expect(
      filterCatalogProducts({
        products: fixtures,
        query: "минералы",
        category: "all",
        sort: "popular",
      }).map(({ slug }) => slug)
    ).toEqual(["alpha"]);
  });

  test("combines category filtering with the selected comparator", () => {
    expect(
      filterCatalogProducts({
        products: fixtures,
        query: "",
        category: "Тело",
        sort: "az",
      }).map(({ slug }) => slug)
    ).toEqual(["beta"]);
  });

  test("does not mutate the source product array while sorting", () => {
    const originalOrder = fixtures.map(({ slug }) => slug);
    filterCatalogProducts({
      products: fixtures,
      query: "",
      category: "all",
      sort: "za",
    });
    expect(fixtures.map(({ slug }) => slug)).toEqual(originalOrder);
  });
});
