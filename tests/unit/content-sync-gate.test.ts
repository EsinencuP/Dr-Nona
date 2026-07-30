import { describe, expect, test } from "vitest";
// @ts-expect-error The sync validator is an intentionally framework-neutral ESM module.
import { buildContentSyncDiff, fingerprintContentCandidate, validateContentSyncCandidate } from "../../scripts/content-sync-lib.mjs";

const policy = {
  schemaVersion: 1,
  allowedSourceOrigins: ["https://drnona.com"],
  maxProductCountDrop: 0,
  maxContentCountDrop: 0,
  maxContentErrors: 0,
  requireCompleteNewProducts: true,
};

function product(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    slug: "test-product",
    officialName: "Test Product",
    shortDescription: "Short description",
    longDescription: "Long description",
    ingredients: "Minerals",
    howToUse: "Apply once daily.",
    sku: "SKU-001",
    category: "Уход за лицом",
    publicationStatus: "published",
    editorialStatus: "ready",
    image: "/products/test-product.png",
    imageAlt: "Test Product",
    sourceUrl: "https://drnona.com/product/test-product",
    releasedAt: "2026-01-01",
    sourceLastmod: "2026-01-02",
    officialOrder: 1,
    popularityRank: 1,
    relatedSlugs: [],
    ...overrides,
  };
}

function content(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    path: "/about",
    title: "About",
    description: "About Dr. Nona",
    headings: ["About"],
    paragraphs: ["Content"],
    images: [],
    sourceUrl: "https://drnona.com/about",
    sourceLastmod: "2026-01-02",
    ...overrides,
  };
}

function summary(products: number, contentRecords: number) {
  return {
    source: "https://drnona.com",
    syncedAt: "2026-07-30T10:00:00.000Z",
    sitemapUrls: products + contentRecords,
    defaultLocaleUrls: products + contentRecords,
    products,
    contentRecords,
    excludedSourceRoutes: ["/register", "/search"],
    missingManifestProductRoutes: [],
  };
}

function validate({
  previousProducts = [product()],
  previousContent = [content()],
  products = [product()],
  candidateContent = [content()],
}: {
  previousProducts?: Record<string, unknown>[];
  previousContent?: Record<string, unknown>[];
  products?: Record<string, unknown>[];
  candidateContent?: Record<string, unknown>[];
} = {}) {
  return validateContentSyncCandidate({
    previousProducts,
    previousContent,
    products,
    content: candidateContent,
    summary: summary(products.length, candidateContent.length),
    policy,
  });
}

function errorCodes(result: ReturnType<typeof validate>) {
  return result.errors.map((entry: { code: string }) => entry.code);
}

describe("content sync publication gate", () => {
  test("accepts a complete candidate without writing it to production", () => {
    const result = validate();

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("blocks an unexpected product count drop", () => {
    const result = validate({
      previousProducts: [
        product(),
        product({
          slug: "second-product",
          sku: "SKU-002",
          sourceUrl: "https://drnona.com/product/second-product",
          officialOrder: 2,
          popularityRank: 2,
        }),
      ],
    });

    expect(errorCodes(result)).toContain("product-count-drop");
  });

  test("blocks a required field regression", () => {
    const result = validate({
      products: [product({ longDescription: "" })],
    });

    expect(errorCodes(result)).toContain("required-field-regression");
  });

  test("blocks duplicate product slugs and SKU values", () => {
    const duplicate = product({ officialOrder: 2, popularityRank: 2 });
    const result = validate({
      previousProducts: [product(), duplicate],
      products: [product(), duplicate],
    });

    expect(errorCodes(result)).toContain("duplicate-product-slug");
    expect(errorCodes(result)).toContain("duplicate-product-sku");
  });

  test("blocks source URLs outside the allowlist", () => {
    const result = validate({
      products: [
        product({
          sourceUrl: "https://malicious.example/product/test-product",
        }),
      ],
    });

    expect(errorCodes(result)).toContain("source-origin-not-allowed");
  });

  test("blocks content error records above the configured threshold", () => {
    const result = validate({
      candidateContent: [content({ title: "", error: "Fetch failed" })],
    });

    expect(errorCodes(result)).toContain("content-error-threshold");
  });

  test("blocks records that do not conform to the schema", () => {
    const result = validate({
      products: [product({ sku: "" })],
    });

    expect(errorCodes(result)).toContain("schema-invalid");
  });

  test("reports additions, removals and changed fields for review", () => {
    const diff = buildContentSyncDiff({
      previousProducts: [
        product(),
        product({
          slug: "removed-product",
          sku: "SKU-002",
          sourceUrl: "https://drnona.com/product/removed-product",
        }),
      ],
      previousContent: [content()],
      products: [
        product({ shortDescription: "Changed" }),
        product({
          slug: "added-product",
          sku: "SKU-003",
          sourceUrl: "https://drnona.com/product/added-product",
        }),
      ],
      content: [content()],
    });

    expect(diff.products.added).toEqual(["added-product"]);
    expect(diff.products.removed).toEqual(["removed-product"]);
    expect(diff.products.changed).toEqual([
      { slug: "test-product", fields: ["shortDescription"] },
    ]);
  });

  test("uses a deterministic fingerprint for explicit promotion approval", () => {
    const candidate = {
      products: [product()],
      content: [content()],
      summary: summary(1, 1),
    };

    expect(fingerprintContentCandidate(candidate)).toBe(
      fingerprintContentCandidate(candidate)
    );
    expect(
      fingerprintContentCandidate({
        ...candidate,
        products: [product({ shortDescription: "Changed" })],
      })
    ).not.toBe(fingerprintContentCandidate(candidate));
  });
});
