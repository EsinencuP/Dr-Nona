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
  const titles = page.locator(".catalog-grid .product-card h2");
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

test("Romanian catalogue uses authorized Romanian product names and copy", async ({
  page,
}) => {
  await page.goto("/ro/products");

  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50);
  await expect(
    page.getByRole("heading", { level: 2, name: "Cremă Dynamic" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Loțiune de corp Solaris" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Apă de gură Multi Mouthwash" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Apă de parfum FAYA" })
  ).toBeVisible();

  const visibleText = await page.locator("body").innerText();
  expect(visibleText).not.toMatch(cyrillic);
  await expect(page.getByRole("link", { name: "RO", exact: true })).toHaveAttribute(
    "aria-current",
    "true"
  );
});

test("Romanian product route publishes authorized factual copy and keeps its source", async ({
  page,
}) => {
  await page.goto("/ro/product/dynamic-hydrating-cream");

  await expect(
    page.getByRole("heading", { level: 1, name: "Cremă Dynamic" })
  ).toBeVisible();
  await expect(
    page.getByText("Cremă Dr. Nona pentru față și corp, cu aloe vera, mușețel și uleiuri vegetale.").first()
  ).toBeVisible();
  await expect(page.getByText(/Cremă universală care îngrijește pielea/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: /drnona\.md/i })).toHaveAttribute(
    "href",
    "https://www.drnona.md/dynamic"
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

test("Romanian editorial shell keeps original-language pages on their canonical URL", async ({
  page,
}) => {
  await page.goto("/ro/blog");

  const articleLink = page.locator(".article-card h3 a").first();
  const articlePath = await articleLink.getAttribute("href");
  expect(articlePath).toMatch(/^\/blog\//u);
  expect(articlePath).not.toMatch(/^\/ro\//u);

  await articleLink.click();
  await expect(page).toHaveURL(new RegExp(`${articlePath}$`));
  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
  await expect(page.locator(".article-page h1")).toHaveAttribute("lang", "ru");
  await expect(page.locator(".article-page .prose")).toHaveAttribute("lang", "ru");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${testBaseUrl}${articlePath}`
  );
  await expect(page.locator('link[rel="alternate"][hreflang="ro-MD"]')).toHaveCount(0);

  await page.goto(`/ro${articlePath}`);
  await expect(page).toHaveURL(new RegExp(`${articlePath}$`));
  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
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
