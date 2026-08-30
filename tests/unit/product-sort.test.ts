import { describe, expect, test } from "vitest";
import { loadProductData, type Product } from "../../src/data";
import {
  compareCatalogProducts,
  compareByReleasedAt,
  compareBySourceUpdatedAt,
  normalizeCatalogSort,
} from "../../src/product-sort";

const { products } = await loadProductData();

function productFixture(overrides: Partial<Product>): Product {
  return {
    ...products[0],
    ...overrides,
  };
}

describe("catalog date comparators", () => {
  test("sorts approved product release dates newest first", () => {
    const older = productFixture({
      slug: "older",
      releasedAt: "2024-02-01",
      officialOrder: 1,
    });
    const newer = productFixture({
      slug: "newer",
      releasedAt: "2025-06-15",
      officialOrder: 2,
    });

    expect([older, newer].sort(compareByReleasedAt).map(({ slug }) => slug))
      .toEqual(["newer", "older"]);
  });

  test("a source-page edit cannot make a product newly released", () => {
    const first = productFixture({
      slug: "first",
      releasedAt: null,
      sourceLastmod: "2020-01-01",
      officialOrder: 1,
    });
    const second = productFixture({
      slug: "second",
      releasedAt: null,
      sourceLastmod: "2030-01-01",
      officialOrder: 2,
    });

    expect([second, first].sort(compareByReleasedAt).map(({ slug }) => slug))
      .toEqual(["first", "second"]);
  });

  test("places unknown release dates after known dates with a stable fallback", () => {
    const unknownLater = productFixture({
      slug: "unknown-later",
      releasedAt: null,
      officialOrder: 8,
    });
    const known = productFixture({
      slug: "known",
      releasedAt: "2024-03-10",
      officialOrder: 9,
    });
    const unknownEarlier = productFixture({
      slug: "unknown-earlier",
      releasedAt: null,
      officialOrder: 3,
    });

    expect(
      [unknownLater, known, unknownEarlier]
        .sort(compareByReleasedAt)
        .map(({ slug }) => slug)
    ).toEqual(["known", "unknown-earlier", "unknown-later"]);
  });

  test("uses sourceLastmod only for the recently updated comparator", () => {
    const olderPage = productFixture({
      slug: "older-page",
      sourceLastmod: "2024-01-01",
      officialOrder: 1,
    });
    const newerPage = productFixture({
      slug: "newer-page",
      sourceLastmod: "2026-01-01",
      officialOrder: 2,
    });

    expect(
      [olderPage, newerPage]
        .sort(compareBySourceUpdatedAt)
        .map(({ slug }) => slug)
    ).toEqual(["newer-page", "older-page"]);
  });

  test("maps legacy newest URLs to the honest updated sort", () => {
    expect(normalizeCatalogSort("newest")).toBe("updated");
    expect(normalizeCatalogSort("updated")).toBe("updated");
    expect(normalizeCatalogSort("unknown")).toBe("popular");
  });

  test("uses official order and SKU as deterministic equal-rank tie-breakers", () => {
    const laterSku = productFixture({
      slug: "later-sku",
      sku: "900002",
      popularityRank: 3,
      officialOrder: 8,
    });
    const earlierSku = productFixture({
      slug: "earlier-sku",
      sku: "900001",
      popularityRank: 3,
      officialOrder: 8,
    });
    const earlierOrder = productFixture({
      slug: "earlier-order",
      sku: "999999",
      popularityRank: 3,
      officialOrder: 2,
    });

    expect(
      [laterSku, earlierSku, earlierOrder]
        .sort((left, right) => compareCatalogProducts(left, right, "popular"))
        .map(({ slug }) => slug)
    ).toEqual(["earlier-order", "earlier-sku", "later-sku"]);
  });
});
