import { expect, test } from "@playwright/test";

test("product route exposes complete route metadata and Product JSON-LD", async ({
  page,
}) => {
  await page.goto("/product/lord-deodorant");

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
    "http://127.0.0.1:4173/product/lord-deodorant"
  );
  expect(metadata.ogType).toBe("product");
  expect(metadata.twitterCard).toBe("summary_large_image");
  expect(metadata.alternates).toEqual([
    {
      hreflang: "ru-MD",
      href: "http://127.0.0.1:4173/ru/product/lord-deodorant",
    },
    {
      hreflang: "ro-MD",
      href: "http://127.0.0.1:4173/ro/product/lord-deodorant",
    },
    {
      hreflang: "x-default",
      href: "http://127.0.0.1:4173/product/lord-deodorant",
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
  await expect(page).toHaveURL("http://127.0.0.1:4173/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://127.0.0.1:4173/"
  );
});

test("article route exposes Article and Breadcrumb metadata", async ({
  page,
}) => {
  await page.goto("/blog/what-to-eat-after-coronavirus");
  await expect(page).toHaveTitle(/Чем питаться после коронавируса/);

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

  expect(metadata.title).toContain("Чем питаться после коронавируса");
  expect(metadata.canonical).toBe(
    "http://127.0.0.1:4173/blog/what-to-eat-after-coronavirus"
  );
  expect(metadata.ogType).toBe("article");
  expect(metadata.types).toEqual(
    expect.arrayContaining(["WebPage", "BlogPosting", "BreadcrumbList"])
  );
  expect(metadata.article).toMatchObject({
    headline: "Чем питаться после коронавируса",
    dateModified: "2022-02-17T00:00:00.000Z",
  });
  expect(metadata.article).not.toHaveProperty("datePublished");
});

test("unknown routes are explicitly noindex", async ({ page }) => {
  await page.goto("/definitely-missing");

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex,follow"
  );
  await expect(page).toHaveTitle(/Страница не найдена/);
});
