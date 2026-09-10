import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../../src/data/seo-manifest.json", import.meta.url), "utf8")) as { routes: Array<{ path: string; kind: string; locale?: string }> };
const productRoutes = manifest.routes.filter(route => route.path.startsWith("/ro/product/"));

test("all 50 RO products keep localized controls, metadata and quarantine", async ({ page }) => {
  test.setTimeout(120_000);
  expect(productRoutes).toHaveLength(50);
  for (const route of productRoutes) {
    await page.goto(route.path);
    await expect(page.locator("html")).toHaveAttribute("lang", "ro");
    await expect(page.locator(".product-select-button")).toHaveText(/Adaugă în selecție/u);
    await expect(page.locator(".product-stage img")).toHaveAttribute("alt", /Imaginea produsului/u);
    const metadata = await page.locator('meta[name="description"]').getAttribute("content");
    expect(metadata).not.toMatch(/[А-Яа-яЁё]/u);
    expect(await page.title()).not.toMatch(/[А-Яа-яЁё]/u);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route.path}$`, "u"));
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "ro_MD");
    const languageLeaks = await page.locator("main").evaluate(element => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT), leaks = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (/[А-Яа-яЁё]/u.test(node.textContent ?? "") && node.parentElement?.closest("[lang]")?.getAttribute("lang") !== "ru") leaks.push(node.textContent);
      }
      return leaks;
    });
    expect(languageLeaks, route.path).toEqual([]);
  }
});

test("Romanian generic-page shell overrides Russian content language for its controls", async ({ page }) => {
  await page.goto("/ro");
  await page.goto("/business");
  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
  await expect(page.locator(".official-page h1")).toHaveAttribute("lang", "ru");
  const gallery = page.locator(".official-media-grid");
  await expect(gallery).toHaveCount(1);
  await expect(gallery).toHaveAttribute("lang", "ro");
  await expect(gallery.locator("img")).toHaveCount(8);
  for (const image of await gallery.locator("img").all()) await expect(image).toHaveAttribute("lang", "ru");
});

test("all remaining RO route shells preserve their locale and metadata", async ({ page }) => {
  const routes = manifest.routes.filter(route => /^\/ro(?:\/|$)/u.test(route.path) && !route.path.startsWith("/ro/product/"));
  expect(routes).toHaveLength(14);
  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "ro");
    expect(await page.title()).not.toMatch(/[А-Яа-яЁё]/u);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "ro_MD");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route.path}$`, "u"));
  }
});
