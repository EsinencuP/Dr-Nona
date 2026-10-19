import { describe, expect, test } from "vitest";
import manifestJson from "../../src/data/seo-manifest.json";
import {
  buildJsonLd,
  getRouteMetadata,
  resolveSiteOriginFromEnvironment,
  type SeoManifest,
} from "../../src/seo-core.mjs";
import { applyRouteMetadata } from "../../src/seo";

const manifest = manifestJson as SeoManifest;
const origin = "https://catalog.example";

describe("route SEO contract", () => {
  test("prefers the stable Vercel production hostname over a preview URL", () => {
    expect(
      resolveSiteOriginFromEnvironment({
        VERCEL_PROJECT_PRODUCTION_URL: "dr-nona-bice.vercel.app",
        VERCEL_URL: "dr-nona-preview-123.vercel.app",
      })
    ).toBe("https://dr-nona-bice.vercel.app");
  });

  test("keeps every indexable title and description unique", () => {
    const routes = manifest.routes.filter((route) => route.indexable);

    expect(new Set(routes.map((route) => route.title)).size).toBe(routes.length);
    expect(new Set(routes.map((route) => route.description)).size).toBe(
      routes.length
    );
  });

  test("emits Product and Breadcrumb JSON-LD without invented commerce data", () => {
    const route = getRouteMetadata(
      manifest,
      "/product/lord-deodorant"
    );
    const jsonLd = buildJsonLd(route, origin);
    const product = jsonLd["@graph"].find(
      (item) => item["@type"] === "Product"
    );
    const breadcrumbs = jsonLd["@graph"].find(
      (item) => item["@type"] === "BreadcrumbList"
    );

    expect(product).toMatchObject({
      "@type": "Product",
      name: "Deodorant ( LORD )",
      sku: "324001",
      brand: { "@type": "Brand", name: "Dr. Nona" },
    });
    expect(product).not.toHaveProperty("offers");
    expect(product).not.toHaveProperty("review");
    expect(product).not.toHaveProperty("aggregateRating");
    expect(breadcrumbs).toBeTruthy();
  });

  test("retired editorial routes have no publication metadata", () => {
    expect(manifest.routes.some((route) => /^\/(?:editorial|news|blog)(?:\/|$)/u.test(route.path))).toBe(false);
    const route = getRouteMetadata(manifest, "/blog/what-to-eat-after-coronavirus");
    expect(route.robots).toBe("noindex,follow");
    expect(route.schema).toBeNull();
    expect(buildJsonLd(route, origin)["@graph"].map((item) => item["@type"])).toEqual(["WebPage", "BreadcrumbList"]);
  });

  test("excludes the legacy duplicate and marks private and unknown routes noindex", () => {
    expect(getRouteMetadata(manifest, "/selection").robots).toBe(
      "noindex,follow"
    );
    expect(manifest.routes.some((route) => route.path === "/main")).toBe(false);
    expect(getRouteMetadata(manifest, "/missing-route").robots).toBe(
      "noindex,follow"
    );
  });

  test("updates the complete metadata set during client-side navigation", async () => {
    document.documentElement.dataset.siteOrigin = origin;
    await applyRouteMetadata("/product/lord-deodorant");

    expect(document.title).toContain("Deodorant ( LORD )");
    expect(
      document.querySelector('meta[name="description"]')?.getAttribute("content")
    ).toContain("Deodorant ( LORD )");
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute("href")
    ).toBe(`${origin}/product/lord-deodorant`);
    expect(
      document.querySelector('meta[property="og:type"]')?.getAttribute("content")
    ).toBe("product");
    expect(
      document.querySelector('meta[name="twitter:card"]')?.getAttribute("content")
    ).toBe("summary_large_image");
    expect(
      document
        .querySelector('link[rel="alternate"][hreflang="ru-MD"]')
        ?.getAttribute("href")
    ).toBe(`${origin}/ru/product/lord-deodorant`);
    expect(
      document
        .querySelector('link[rel="alternate"][hreflang="x-default"]')
        ?.getAttribute("href")
    ).toBe(`${origin}/product/lord-deodorant`);
    expect(
      document
        .querySelector('link[rel="alternate"][hreflang="ro-MD"]')
        ?.getAttribute("href")
    ).toBe(`${origin}/ro/product/lord-deodorant`);

    const jsonLd = JSON.parse(
      document.querySelector('script[type="application/ld+json"]')?.textContent ??
        "{}"
    );
    expect(
      jsonLd["@graph"].some(
        (item: Record<string, unknown>) => item["@type"] === "Product"
      )
    ).toBe(true);
  });
});
