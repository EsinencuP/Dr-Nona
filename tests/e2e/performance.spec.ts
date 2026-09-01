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

test("home does not load complete product or official content datasets", async ({
  page,
}) => {
  const requests = observeModuleRequests(page);
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Halo");

  expect(requests.some((url) => url.includes("official-pages.json"))).toBe(
    false
  );
  expect(requests.some((url) => url.includes("products.json"))).toBe(false);
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

  expect(requests.some((url) => url.includes("products.json"))).toBe(false);
  expect(requests.some((url) => url.includes("official-pages.json"))).toBe(
    false
  );
  expect(requests.some((url) => url.includes("/pages/CatalogPage"))).toBe(
    false
  );
});

test("catalogue loads its own route module and product data only", async ({
  page,
}) => {
  const requests = observeModuleRequests(page);
  await page.goto("/products");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Каталог"
  );

  expect(requests.some((url) => url.includes("/pages/CatalogPage"))).toBe(true);
  expect(requests.some((url) => url.includes("products-public.json"))).toBe(
    true
  );
  expect(requests.some((url) => url.includes("official-pages.json"))).toBe(
    false
  );
});
