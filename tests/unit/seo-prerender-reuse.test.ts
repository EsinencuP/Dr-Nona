import { afterEach, expect, test, vi } from "vitest";
import manifest from "../../src/data/seo-manifest.json";
import { getRouteMetadata, renderPrerenderedContent, renderSeoHead, type SeoManifest } from "../../src/seo-core.mjs";

afterEach(() => {
  delete document.documentElement.dataset.prerenderedPath;
  delete document.documentElement.dataset.prerenderedLocale;
  delete document.documentElement.dataset.siteOrigin;
  document.head.innerHTML = "";
  vi.resetModules();
});

test("reuses the complete prerendered head, then updates on navigation and back", async () => {
  vi.resetModules();
  const origin = "https://catalog.example";
  document.documentElement.dataset.siteOrigin = origin;
  document.documentElement.dataset.prerenderedPath = "/ro";
  document.documentElement.dataset.prerenderedLocale = "ro";
  document.head.innerHTML = renderSeoHead(getRouteMetadata(manifest as SeoManifest, "/ro", "ro"), origin);
  const canonical = document.querySelector('link[rel="canonical"]');
  const { applyRouteMetadata } = await import("../../src/seo");
  await applyRouteMetadata("/ro", "ro");
  await applyRouteMetadata("/ro", "ro"); // StrictMode effect replay
  expect(document.querySelector('link[rel="canonical"]')).toBe(canonical);
  await applyRouteMetadata("/ro/products", "ro");
  expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`${origin}/ro/products`);
  await applyRouteMetadata("/ro", "ro");
  expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`${origin}/ro`);
  expect(document.querySelector('meta[property="og:locale"]')?.getAttribute("content")).toBe("ro_MD");
});

test("an incomplete head cannot bypass metadata loading", async () => {
  vi.resetModules();
  document.documentElement.dataset.prerenderedPath = "/ro";
  document.documentElement.dataset.prerenderedLocale = "ro";
  document.head.innerHTML = '<title>Incomplete</title>';
  const { applyRouteMetadata } = await import("../../src/seo");
  await applyRouteMetadata("/ro", "ro");
  expect(document.title).not.toBe("Incomplete");
  expect(document.querySelector('script[type="application/ld+json"]')).not.toBeNull();
});

test("PDP prerender selects the same responsive media as the interactive page", () => {
  const metadata = getRouteMetadata(manifest as SeoManifest, "/product/dynamic-hydrating-cream");
  const container = document.createElement("div");
  container.innerHTML = renderPrerenderedContent(metadata, "https://catalog.example");
  const picture = container.querySelector("picture");
  expect(picture?.querySelector('source[type="image/avif"]')?.getAttribute("srcset")).toContain("dynamic-hydrating-cream-480.avif 480w");
  expect(picture?.querySelector("source")?.getAttribute("sizes")).toBe("(max-width: 960px) 320px, 560px");
  expect(picture?.querySelector("img")?.getAttribute("height")).toBe("1200");
});
