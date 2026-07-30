import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  await page.goto("/products");
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(7);
  if (testInfo.project.name === "chromium-mobile") {
    await page.getByRole("button", { name: "Фильтры и сортировка" }).click();
  }
});

test("search, category filter and alphabetical sort update the catalogue", async ({
  page,
}) => {
  const search = page.getByRole("searchbox", { name: "Поиск по названию" });
  await search.fill("Dynamic");
  await expect(page).toHaveURL(/q=Dynamic/);
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { level: 3, name: "Halo Dynamic Cream" })
  ).toBeVisible();

  await page.getByRole("button", { name: "Очистить поиск" }).click();
  await page.getByRole("combobox", { name: "Все категории" }).selectOption({
    label: "Уход за лицом",
  });
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(1);

  await page.getByRole("combobox", { name: "Сортировка" }).selectOption("az");
  const names = await page.locator(".product-card h3").allTextContents();
  expect(names).toEqual(
    [...names].sort((left, right) => left.localeCompare(right, "ru"))
  );

  await page.getByRole("combobox", { name: "Сортировка" }).selectOption("updated");
  await expect(page).toHaveURL(/sort=updated/);
  await expect(page.getByRole("option", { name: "Недавно обновлённые" })).toHaveCount(1);
  await expect(page.getByRole("option", { name: "Сначала новые" })).toHaveCount(0);
});

test("an unknown query shows a recoverable empty state", async ({ page }) => {
  await page
    .getByRole("searchbox", { name: "Поиск по названию" })
    .fill("not-a-real-product");
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "По этим параметрам ничего не найдено.",
    })
  ).toBeVisible();
  await page.getByRole("button", { name: "Сбросить фильтры" }).last().click();
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(7);
});
