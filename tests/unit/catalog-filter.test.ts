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
      shortDescription: "Морские минералы в составе ежедневного ухода из ассортимента Dr. Nona.",
      category: "Уход",
      popularityRank: 2,
    }),
    productFixture({
      slug: "beta",
      officialName: "Beta Lotion",
      shortDescription: "Средство для ежедневного ухода за кожей тела из ассортимента Dr. Nona.",
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

  test("finds Romanian product names without diacritics and across punctuation", async () => {
    const romanian = (await loadProductData("ro")).products;
    const search = (query: string) => filterCatalogProducts({ products: romanian, query, category: "all", sort: "popular" });
    expect(search("sampon mineral").map(({ slug }) => slug)).toContain("frequent-use-tonic-shampoo");
    expect(search("musetel").map(({ slug }) => slug)).toContain("salts-camomile");
    expect(search("ylang ylang").map(({ slug }) => slug)).toContain("salts-ylangylang");
  });

  test("accepts one bounded title typo only when exact search has no result", () => {
    const exact = productFixture({ slug: "exact", officialName: "Solaris", category: "Кремы", popularityRank: 2, shortDescription: null, longDescription: null, ingredients: null });
    const near = productFixture({ slug: "near", officialName: "Solairs", category: "Кремы", popularityRank: 1, shortDescription: null, longDescription: null, ingredients: null });
    const search = (query: string, products = [near, exact]) =>
      filterCatalogProducts({ products, query, category: "all", sort: "popular" }).map(({ slug }) => slug);
    expect(search("Solaris")).toEqual(["exact"]);
    expect(search("Solares", [exact])).toEqual(["exact"]);
    expect(search("sloraiz", [exact])).toEqual([]);
    expect(search("solaris", [near])).toEqual(["near"]);
  });

  test("does not fuzzy-match descriptions, short terms, or unrelated products", () => {
    const item = productFixture({
      slug: "one",
      officialName: "Solaris Body Lotion",
      category: "Кремы",
      shortDescription: "Минералы Мёртвого моря",
    });
    const search = (query: string) =>
      filterCatalogProducts({ products: [item], query, category: "all", sort: "popular" });
    expect(search("минерали")).toEqual([]);
    expect(search("crem")).toEqual([]);
    expect(search("imunseen")).toEqual([]);
  });
});
