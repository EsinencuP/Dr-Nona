import { expect, test } from "@playwright/test";

const testBaseUrl = `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "4173"}`;

for (const locale of ["ru", "ro"]) {
  test(`${locale}: search copy changes with the page and stays localized`, async ({ page }) => {
    await page.goto(`/${locale}/about`);
    await expect(page).toHaveTitle(locale === "ro" ? /Despre brand și fondatori/ : /Знакомство с компанией/);
    const before = await page.locator('meta[name="description"]').getAttribute("content");
    await page.locator('.about-chapter a[href$="/about/science"]').click();
    await expect(page).toHaveTitle(locale === "ro" ? /Știință, producție și tehnologie/ : /Разработка и контроль качества/);
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveCount(1);
    await expect(description).not.toHaveAttribute("content", before ?? "");
    await expect(description).toHaveAttribute("content", locale === "ro" ? /controlul calității/ : /контроль качества/);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", await description.getAttribute("content") ?? "");
    expect(await page.title()).not.toMatch(/\((?:RU|RO)\)| · /);
  });
}

test("product route exposes complete route metadata and Product JSON-LD", async ({
  page,
}) => {
  await page.goto("/product/lord-deodorant");
  await expect(page).toHaveTitle(/Deodorant \( LORD \)/);

  const metadata = await page.evaluate(() => {
    const jsonLd = JSON.parse(
      document.querySelector('script[type="application/ld+json"]')?.textContent ??
        "{}"
    );
    return {
      title: document.title,
      description: document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content"),
      canonical: document
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href"),
      ogType: document
        .querySelector('meta[property="og:type"]')
        ?.getAttribute("content"),
      twitterCard: document
        .querySelector('meta[name="twitter:card"]')
        ?.getAttribute("content"),
      alternates: Array.from(
        document.querySelectorAll('link[rel="alternate"][hreflang]')
      ).map((node) => ({
        hreflang: node.getAttribute("hreflang"),
        href: node.getAttribute("href"),
      })),
      types: jsonLd["@graph"]?.map(
        (item: Record<string, unknown>) => item["@type"]
      ),
      product: jsonLd["@graph"]?.find(
        (item: Record<string, unknown>) => item["@type"] === "Product"
      ),
    };
  });

  expect(metadata.title).toContain("Deodorant ( LORD )");
  expect(metadata.description).toContain("Deodorant ( LORD )");
  expect(metadata.canonical).toBe(
    `${testBaseUrl}/product/lord-deodorant`
  );
  expect(metadata.ogType).toBe("product");
  expect(metadata.twitterCard).toBe("summary_large_image");
  expect(metadata.alternates).toEqual([
    {
      hreflang: "ru-MD",
      href: `${testBaseUrl}/ru/product/lord-deodorant`,
    },
    {
      hreflang: "ro-MD",
      href: `${testBaseUrl}/ro/product/lord-deodorant`,
    },
    {
      hreflang: "x-default",
      href: `${testBaseUrl}/product/lord-deodorant`,
    },
  ]);
  expect(metadata.types).toEqual(
    expect.arrayContaining(["WebPage", "Product", "BreadcrumbList"])
  );
  expect(metadata.product).not.toHaveProperty("offers");
  expect(metadata.product).not.toHaveProperty("review");
  expect(metadata.product).not.toHaveProperty("aggregateRating");
});

test("legacy /main URL permanently resolves to the canonical home", async ({
  page,
}) => {
  await page.goto("/main");
  await expect(page).toHaveURL(`${testBaseUrl}/`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${testBaseUrl}/`
  );
});

test("retired article route has noindex metadata without publication schema", async ({
  page,
}) => {
  await page.goto("/blog/what-to-eat-after-coronavirus");
  await expect(page).toHaveTitle(/Страница не найдена/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");

  const metadata = await page.evaluate(() => {
    const jsonLd = JSON.parse(
      document.querySelector('script[type="application/ld+json"]')?.textContent ??
        "{}"
    );
    return {
      title: document.title,
      canonical: document
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href"),
      ogType: document
        .querySelector('meta[property="og:type"]')
        ?.getAttribute("content"),
      types: jsonLd["@graph"]?.map(
        (item: Record<string, unknown>) => item["@type"]
      ),
      article: jsonLd["@graph"]?.find(
        (item: Record<string, unknown>) => item["@type"] === "BlogPosting"
      ),
    };
  });

  expect(metadata.title).toContain("Страница не найдена");
  expect(metadata.canonical).toBe(
    `${testBaseUrl}/blog/what-to-eat-after-coronavirus`
  );
  expect(metadata.ogType).toBe("website");
  expect(metadata.types).toEqual(["WebPage", "BreadcrumbList"]);
  expect(metadata.article).toBeUndefined();
});

test("unknown routes are explicitly noindex", async ({ page }) => {
  await page.goto("/definitely-missing");

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex,follow"
  );
  await expect(page).toHaveTitle(/Страница не найдена/);
});
