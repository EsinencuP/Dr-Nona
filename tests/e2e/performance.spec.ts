import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

function observeModuleRequests(page: Page) {
  const urls: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (
      request.resourceType() === "script" ||
      url.includes("/src/data/") ||
      url.includes("/src/pages/")
    ) {
      urls.push(url);
    }
  });
  return urls;
}

function isCatalogRouteAsset(url: string) {
  return (
    url.includes("/pages/CatalogPage") ||
    /\/assets\/CatalogPage-[^/?]+\.js(?:\?|$)/u.test(url)
  );
}

function isCatalogDataAsset(url: string) {
  return (
    url.includes("products-public.json") ||
    /\/assets\/catalog-data-[^/?]+\.js(?:\?|$)/u.test(url)
  );
}

function isRawCatalogAsset(url: string) {
  // Match the actual dataset filename, not the six-item home-products.json
  // projection (the old substring assertion treated those as the same file).
  return /\/products(?:-ro)?\.json$/.test(new URL(url).pathname);
}

test("home does not load complete product or official content datasets", async ({
  page,
}) => {
  const requests = observeModuleRequests(page);
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Halo");

  expect(requests.some((url) => url.includes("official-pages.json"))).toBe(
    false
  );
  expect(requests.filter(isRawCatalogAsset)).toEqual([]);
  expect(requests.some(isCatalogDataAsset)).toBe(false);
  expect(requests.some(isCatalogRouteAsset)).toBe(false);
  if (await page.locator("html").getAttribute("data-prerendered-path")) {
    expect(requests.some((url) => url.includes("seo-manifest-"))).toBe(false);
    await page.locator('main a[href$="/products"]').first().click();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/products$/);
    expect(requests.some((url) => url.includes("seo-manifest-"))).toBe(true);
  }
});

test("direct contact route does not load product or official datasets", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.clear());
  const requests = observeModuleRequests(page);
  await page.goto("/contactus");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Контакты в Молдове"
  );

  expect(requests.filter(isRawCatalogAsset)).toEqual([]);
  expect(requests.some((url) => url.includes("official-pages.json"))).toBe(
    false
  );
  expect(requests.some(isCatalogRouteAsset)).toBe(false);
  expect(requests.some(isCatalogDataAsset)).toBe(false);
});

for (const locale of ["ru", "ro"]) {
  test(`${locale}: direct PDP loads a bounded detail projection without catalogue data`, async ({ page }) => {
    const requests = observeModuleRequests(page);
    const images: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "image") images.push(request.url());
    });
    await page.goto(`/${locale}/product/dynamic-hydrating-cream`);
    await expect(page.locator("main h1")).toContainText("Dynamic");
    await expect(page.locator(".product-card")).toHaveCount(4);
    expect(requests.some(isCatalogDataAsset)).toBe(false);
    expect(requests.some(isCatalogRouteAsset)).toBe(false);
    expect(requests.some((url) => url.includes("official-pages.json") || /official-content-/.test(url))).toBe(false);
    expect(images.some((url) => url.includes("/catalog-normalized/") && url.endsWith(".png"))).toBe(false);
  });

  test(`${locale}: editorial does not load catalogue data`, async ({ page }) => {
    const requests = observeModuleRequests(page);
    await page.goto(`/${locale}/editorial`);
    await expect(page.locator("main h1")).toBeVisible();
    expect(requests.some(isCatalogDataAsset)).toBe(false);
    expect(requests.some(isCatalogRouteAsset)).toBe(false);
  });
}

test("catalogue loads its own route module and product data only", async ({
  page,
}) => {
  const requests = observeModuleRequests(page);
  await page.goto("/products");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Каталог"
  );

  expect(requests.some(isCatalogRouteAsset)).toBe(true);
  expect(requests.some(isCatalogDataAsset)).toBe(true);
  expect(requests.some((url) => url.includes("official-pages.json"))).toBe(
    false
  );
});
