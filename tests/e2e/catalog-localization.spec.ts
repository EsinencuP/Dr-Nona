import { expect, test } from "@playwright/test";

const cyrillic = /[А-Яа-яЁё]/u;
// A production build can be previewed on a different port than its canonical origin.
const testBaseUrl = process.env.SITE_URL ?? `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "4173"}`;

test("Romanian alphabet sorting places S before Ș in both directions", async ({ page }, testInfo) => {
  await page.goto("/ro/products");
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50);
  if (testInfo.project.name === "chromium-mobile") await page.getByRole("button", { name: "Căutare și sortare", exact: true }).click();
  const sorting = page.getByRole("combobox", { name: "Sortare", exact: true });
  await sorting.selectOption("az");
  await expect(page).toHaveURL(/sort=az/u);
  const titles = page.locator(".catalog-grid .product-card__localized-name");
  await expect.poll(async () => {
    const names = await titles.allTextContents();
    return names.indexOf("Supliment alimentar YAMSEEN") < names.indexOf("Șampon mineral");
  }).toBe(true);
  await sorting.selectOption("za");
  await expect(page).toHaveURL(/sort=za/u);
  await expect.poll(async () => {
    const names = await titles.allTextContents();
    return names.indexOf("Șampon mineral") < names.indexOf("Supliment alimentar YAMSEEN");
  }).toBe(true);
});

test("Romanian catalogue keeps English headings with Romanian product names below", async ({
  page,
}) => {
  await page.goto("/ro/products");

  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50);
  for (const [title, subtitle] of [
    ["Dynamic Cream", "Cremă Dynamic"],
    ["Solaris Body Lotion", "Loțiune de corp Solaris"],
    ["Multi Mouthwash", "Apă de gură Multi Mouthwash"],
    ["Eau De Parfume ( FAYA )", "Apă de parfum FAYA"],
  ]) {
    const card = page.locator(".catalog-grid .product-card").filter({
      has: page.getByRole("heading", { level: 2, name: title, exact: true }),
    });
    await expect(card.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(card.locator(".product-card__localized-name")).toHaveText(subtitle);
  }

  const visibleText = await page.locator("body").innerText();
  expect(visibleText).not.toMatch(cyrillic);
  await expect(page.getByRole("link", { name: "RO", exact: true })).toHaveAttribute(
    "aria-current",
    "true"
  );
});

test("Romanian product route publishes authorized factual copy without outbound sources", async ({
  page,
}) => {
  await page.goto("/ro/product/dynamic-hydrating-cream");

  await expect(
    page.getByRole("heading", { level: 1, name: "Dynamic Cream" })
  ).toBeVisible();
  await expect(page.locator(".product-purpose")).toHaveCount(0);
  await expect(page.locator(".product-copy-card--overview")).toHaveCount(0);
  await expect(page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Compoziție" }) })).toContainText("extract de mușețel");
  await expect(page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Mod de utilizare" }) })).toContainText("Spălați bine fața");
  await expect(page.getByText(/accelerează regenerarea celulară/i)).toHaveCount(0);
  await expect(page.locator('a[href*="drnona.md"], a[href*="drnona.com"]')).toHaveCount(0);
  const visibleText = await page.locator("body").innerText();
  expect(visibleText).not.toMatch(cyrillic);
});

test("company and Halo Complex routes are complete Romanian pages", async ({
  page,
}) => {
  const routes = [
    ["/ro/about", "Compania Dr. Nona"],
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
  await expect(page.getByRole("heading", { level: 1, name: "Компания Dr. Nona" })).toBeVisible();
});

test("Romanian entries to retired editorial sections show a localized 404", async ({ page }) => {
  for (const route of ["/ro/editorial", "/ro/blog", "/ro/news", "/ro/news/zoom-08-07-2026", "/ro/blog/what-to-eat-after-coronavirus"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1, name: "Această pagină a dispărut din orizont" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "ro");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
    await expect(page.locator(".article-card, .article-page")).toHaveCount(0);
  }
});

test("Romanian UI does not invent localized URLs for original generic pages", async ({
  page,
}) => {
  await page.goto("/ro");
  const faq = page.getByRole("link", { name: "Întrebări și răspunsuri" }).first();
  await expect(faq).toHaveAttribute("href", "/faq");
  await faq.click();

  await expect(page).toHaveURL(/\/faq$/u);
  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
  await expect(page.locator(".official-page .prose")).toHaveAttribute("lang", "ru");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${testBaseUrl}/faq`
  );
  await expect(page.locator('link[rel="alternate"][hreflang="ro-MD"]')).toHaveCount(0);
});

test("Romanian error states keep localized UI and noindex metadata without a false alias", async ({
  page,
}) => {
  await page.goto("/ro/definitely-missing");
  await expect(page).toHaveURL(/\/definitely-missing$/u);
  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
  await expect(page.getByRole("heading", { name: "Această pagină a dispărut din orizont" })).toBeVisible();
  await expect(page).toHaveTitle(/Pagină negăsită/u);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);

  await page.goto("/ro/bad-request");
  await expect(page).toHaveURL(/\/bad-request$/u);
  await expect(page.getByRole("heading", { name: "Link deteriorat" })).toBeVisible();
  await expect(page).toHaveTitle(/Link deteriorat/u);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "ro_MD");
});
