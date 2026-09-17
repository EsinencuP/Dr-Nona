import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import { preparePopularitySnapshot, validatePopularitySnapshot, type PopularityCandidate } from "../../scripts/popularity-snapshot-lib.mjs";
import { getPopularityState } from "../../src/popularity";
import { compareCatalogProducts } from "../../src/product-sort";
import { loadProductData } from "../../src/data";

const products = JSON.parse(readFileSync("src/data/products.json", "utf8"));
const now = new Date("2026-09-16T12:00:00.000Z");

function candidate(overrides: Record<string, unknown> = {}): PopularityCandidate {
  return {
    version: 1,
    source: "crm-completed-orders",
    status: "ready",
    windowDays: 90,
    windowStart: "2026-06-18T12:00:00.000Z",
    generatedAt: now.toISOString(),
    expiresAt: "2026-09-23T12:00:00.000Z",
    eligibleOrders: 12,
    distinctClients: 6,
    counts: [
      { slug: products[1].slug, orderCount: 9 },
      { slug: products[0].slug, orderCount: 3 },
    ],
    quarantinedSlugs: [],
    ...overrides,
  } as PopularityCandidate;
}

describe("reviewed CRM popularity snapshot", () => {
  test("ranks 50 published products by order occurrence, then official order", async () => {
    const snapshot = preparePopularitySnapshot(candidate(), products, now);
    expect(snapshot).not.toBeNull();
    if (!snapshot) throw new Error("Expected a complete popularity snapshot");
    validatePopularitySnapshot(snapshot, products);
    expect(snapshot.orderedSlugs).toHaveLength(50);
    expect(snapshot.orderedSlugs.slice(0, 3)).toEqual([products[1].slug, products[0].slug, products[2].slug]);
    const { products: publicProducts } = await loadProductData("ru");
    const scores = new Map<string, number>(snapshot.orderedSlugs.map((slug, index) => [slug, index]));
    expect([publicProducts[0], publicProducts[1]].sort((a, b) => compareCatalogProducts(a, b, "popular", scores))[0].slug)
      .toBe(products[1].slug);
  });

  test("rejects unknown products and customer fields in the public pipeline", () => {
    expect(() => preparePopularitySnapshot(candidate({ clientPhone: "+373..." }), products, now)).toThrow("unexpected fields");
    expect(() => preparePopularitySnapshot(candidate({ quarantinedSlugs: ["unknown"] }), products, now)).toThrow("quarantine");
    expect(() => preparePopularitySnapshot(candidate({ counts: [{ slug: "unknown", orderCount: 11 }] }), products, now)).toThrow("unknown");
  });

  test("keeps the fallback when real samples are too small or expire", () => {
    expect(preparePopularitySnapshot(candidate({ status: "insufficient", eligibleOrders: 3, distinctClients: 2, counts: [{ slug: products[0].slug, orderCount: 2 }] }), products, now)).toBeNull();
    expect(() => preparePopularitySnapshot(candidate({ generatedAt: "2026-09-10T12:00:00.000Z", windowStart: "2026-06-12T12:00:00.000Z", expiresAt: "2026-09-15T12:00:00.000Z" }), products, now)).toThrow("stale");
    expect(getPopularityState(now).active).toBe(false);
  });
});
