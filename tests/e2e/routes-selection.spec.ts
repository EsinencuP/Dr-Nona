import { expect, test } from "@playwright/test";

test("valid and invalid product deep links resolve correctly", async ({ page }) => {
  await page.goto("/product/lord-deodorant");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Deodorant ( LORD )",
    })
  ).toBeVisible();
  await expect(page.getByText("324001", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "О продукте" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Состав" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Способ применения" })).toBeVisible();
  const relatedImages = page.locator(".related-grid .product-card__image");
  await expect(relatedImages).toHaveCount(4);
  for (const image of await relatedImages.all()) {
    await expect(image).toHaveAttribute(
      "src",
      /\/products\/catalog-normalized\/.+\.png$/
    );
  }

  await page.goto("/product/parfum-faya");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Eau De Parfume ( FAYA )",
    })
  ).toBeVisible();
  await expect(page.getByText("309001", { exact: true })).toBeVisible();
});

test("every catalog category exposes product identity without outbound sources", async ({ page }) => {
  await page.goto("/products");
  const catalogLinks = page.locator(".catalog-grid .product-card :is(h2, h3) a");
  await expect(catalogLinks).toHaveCount(50);
  const categorySamples = [
    "/product/solaris-body-lotion",
    "/product/gonseen",
    "/product/okseen",
    "/product/mouthwash",
    "/product/parfum-faya",
  ];

  for (const href of categorySamples) {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".product-purpose")).toHaveCount(0);
    await expect(page.locator(".product-copy-card--overview")).toHaveCount(0);
    for (const name of ["Состав", "Способ применения"]) {
      const heading = page.getByRole("heading", { level: 2, name });
      if (href === "/product/parfum-faya") {
        await expect(heading).toHaveCount(0);
      } else {
        await expect(heading).toBeVisible();
      }
    }
    await expect(page.locator('a[href*="drnona.md"], a[href*="drnona.com"]')).toHaveCount(0);
    await expect(page.getByTestId("claims-review-notice")).toHaveCount(0);
  }
});

test("stale selection entries do not inflate the header count", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "drnona-selection",
      JSON.stringify(["removed-catalog-product"])
    );
  });
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Оформить заказ: 0" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("drnona-selection")))
    .toBe("[]");
});

test("selection persists after refresh and removal updates storage", async ({
  page,
}) => {
  await page.goto("/products");
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50, {
    timeout: 15_000,
  });
  const firstCard = page.locator(".product-card").first();
  const productName = await firstCard.getByRole("heading", { level: 2 }).innerText();
  await firstCard.getByRole("button", { name: "В подборку" }).click();
  await expect(
    page.getByRole("link", { name: "Оформить заказ: 1" })
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("link", { name: "Оформить заказ: 1" })
  ).toBeVisible();
  await page.getByRole("link", { name: "Оформить заказ: 1" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: productName })
  ).toBeVisible();

  await page.getByRole("button", { name: `Удалить ${productName}` }).click();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "В подборке пока нет продуктов",
    })
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "В подборке пока нет продуктов",
    })
  ).toBeVisible();
});

test("selection count synchronizes between open tabs", async ({ context }) => {
  const firstTab = await context.newPage();
  const secondTab = await context.newPage();
  await Promise.all([firstTab.goto("/products"), secondTab.goto("/products")]);
  await expect(firstTab.locator(".catalog-grid .product-card")).toHaveCount(50);
  await expect(secondTab.getByRole("link", { name: "Оформить заказ: 0" })).toBeVisible();

  await firstTab
    .locator(".catalog-grid .product-card")
    .first()
    .getByRole("button", { name: "В подборку" })
    .click();

  await expect(secondTab.getByRole("link", { name: "Оформить заказ: 1" })).toBeVisible();
});

test("unknown deep links render the site 404", async ({ page }) => {
  for (const route of ["/definitely-not-a-route", "/product/missing-product", "/missing/nested/"]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
    expect(response?.headers()["x-robots-tag"]).toContain("noindex");
    await expect(page.getByRole("heading", { level: 1, name: "Эта страница ушла за горизонт" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
    await expect(page.locator(".not-found__actions a")).toHaveCount(2);
  }
  const refreshed = await page.reload();
  expect(refreshed?.status()).toBe(404);
  await page.locator(".not-found__actions").getByRole("link", { name: "В каталог", exact: true }).click();
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50);
  await page.goto("/definitely-not-a-route");
  await page.locator(".not-found__actions").getByRole("link", { name: "На главную", exact: true }).click();
  await expect(page.locator(".home-hero h1")).toBeVisible();
});

for (const malformedPath of ["/product/%", "/product/%E0%A4%A"]) {
  test(`malformed product path ${malformedPath} is recoverable`, async ({ page }) => {
    await page.goto(malformedPath);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Ссылка повреждена",
      })
    ).toBeVisible();

    const records = await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("drnona:client-errors") ?? "[]")
    );
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "malformed-route",
          pathname: "/bad-request",
        }),
      ])
    );

    await page.getByRole("link", { name: "На главную" }).click();
    await expect(
      page.getByRole("heading", { level: 1 })
    ).toContainText("Halo");
  });
}
