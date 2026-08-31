import { expect, test } from "@playwright/test";

const cyrillic = /[А-Яа-яЁё]/u;

test("Romanian catalogue keeps complete English product names and Romanian copy", async ({
  page,
}) => {
  await page.goto("/ro/products");

  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50);
  await expect(
    page.getByRole("heading", { level: 3, name: "Dynamic Cream" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "Solaris Body Lotion" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "Multi Mouthwash" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "Eau De Parfume ( FAYA )" })
  ).toBeVisible();

  const visibleText = await page.locator("body").innerText();
  expect(visibleText).not.toMatch(cyrillic);
  await expect(page.getByRole("link", { name: "RO", exact: true })).toHaveAttribute(
    "aria-current",
    "true"
  );
});

test("Romanian product route uses the official Romanian product page copy", async ({
  page,
}) => {
  await page.goto("/ro/product/dynamic-hydrating-cream");

  await expect(
    page.getByRole("heading", { level: 1, name: "Dynamic Cream" })
  ).toBeVisible();
  await expect(page.getByText(/Cremă universală care îngrijește pielea/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /drnona\.md/i })).toHaveAttribute(
    "href",
    "https://www.drnona.md/dynamic_ro"
  );
  const visibleText = await page.locator("body").innerText();
  expect(visibleText).not.toMatch(cyrillic);
});

test("company and Halo Complex routes are complete Romanian pages", async ({
  page,
}) => {
  const routes = [
    ["/ro/about", "Viziunea noastră"],
    ["/ro/about/company", "Compania Dr. Nona"],
    ["/ro/about/our-history", "Istoria companiei"],
    ["/ro/about/founders", "Fondatorii"],
    ["/ro/about/science", "Știință și tehnologie"],
    ["/ro/ourformula", "Halo Complex™"],
  ] as const;

  for (const [route, heading] of routes) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang", "ro");
    await expect(
      page.getByRole("heading", { level: 1, name: heading })
    ).toBeVisible();
    const visibleText = await page.locator("body").innerText();
    expect(visibleText, route).not.toMatch(cyrillic);
    await expect(
      page.getByRole("link", { name: "RO", exact: true })
    ).toHaveAttribute("aria-current", "true");
  }
});

test("company navigation and locale switch preserve the selected route", async ({
  page,
}) => {
  await page.goto("/ro/about");

  await expect(page.getByRole("link", { name: "Compania" }).first()).toHaveAttribute(
    "href",
    "/ro/about/company"
  );
  await expect(page.getByRole("link", { name: "Catalog", exact: true }).first()).toHaveAttribute(
    "href",
    "/ro/products"
  );
  await expect(page.getByRole("link", { name: "RU", exact: true })).toHaveAttribute(
    "href",
    "/ru/about"
  );

  await page.getByRole("link", { name: "RU", exact: true }).click();
  await expect(page).toHaveURL(/\/ru\/about$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { level: 1, name: "Наше видение" })).toBeVisible();
});
