import { expect, test } from "@playwright/test";

test("valid and invalid product deep links resolve correctly", async ({ page }) => {
  await page.goto("/product/lord-deodorant");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Lord - Halo Deodorant Antiperspirant",
    })
  ).toBeVisible();
  await expect(page.getByText("324001", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Полное описание/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Состав/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Способ применения/ })).toBeVisible();

  await page.goto("/product/parfum-faya");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Эта страница ушла за горизонт",
    })
  ).toBeVisible();
});

test("selection persists after refresh and removal updates storage", async ({
  page,
}) => {
  await page.goto("/products");
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(7);
  const firstCard = page.locator(".product-card").first();
  const productName = await firstCard.locator("h3").innerText();
  await firstCard.getByRole("button", { name: "В подборку" }).click();
  await expect(
    page.getByRole("link", { name: "Подборка: 1" })
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("link", { name: "Подборка: 1" })
  ).toBeVisible();
  await page.getByRole("link", { name: "Подборка: 1" }).click();
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

test("unknown deep links render the site 404", async ({ page }) => {
  await page.goto("/definitely-not-a-route");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Эта страница ушла за горизонт",
    })
  ).toBeVisible();
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
