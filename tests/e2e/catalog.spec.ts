import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  await page.goto("/products");
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50);
  if (testInfo.project.name === "chromium-mobile") {
    await page.getByRole("button", { name: "Поиск и сортировка" }).click();
  }
});

test("search, category filter and alphabetical sort update the catalogue", async ({
  page,
}) => {
  const search = page.getByRole("searchbox", { name: "Поиск по названию" });
  await search.fill("404001");
  await expect(page).toHaveURL(/q=404001/);
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { level: 3, name: "Dynamic Cream" })
  ).toBeVisible();

  await page.getByRole("button", { name: "Очистить поиск" }).click();
  await page.getByRole("combobox", { name: "Все категории" }).selectOption({
    label: "Кремы",
  });
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(12);

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
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50);
});

test("selection action stays separated from product copy", async ({ page }) => {
  await page.goto("/products");
  const card = page.locator(".catalog-grid .product-card").first();
  const description = card.locator(".product-card__description");
  const selectionButton = card.locator(".save-button");

  const [descriptionBox, buttonBox] = await Promise.all([
    description.boundingBox(),
    selectionButton.boundingBox(),
  ]);
  expect(descriptionBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  expect(buttonBox!.y - (descriptionBox!.y + descriptionBox!.height)).toBeGreaterThanOrEqual(20);
});

test("catalog actions share one vertical position in every card", async ({
  page,
}) => {
  const actionOffsets = await page
    .locator(".catalog-grid .product-card")
    .evaluateAll((cards) =>
      cards.map((card) => {
        const cardBox = card.getBoundingClientRect();
        const actions = card.querySelector<HTMLElement>(".product-card__actions");
        if (!actions) throw new Error("Product card actions are missing");
        return Math.round(actions.getBoundingClientRect().top - cardBox.top);
      })
    );

  expect(actionOffsets).toHaveLength(50);
  expect(Math.max(...actionOffsets) - Math.min(...actionOffsets)).toBeLessThanOrEqual(2);
});

test("every catalogue card uses a loaded normalized product image", async ({
  page,
}) => {
  const images = page.locator(".catalog-grid .product-card__image");
  await expect(images).toHaveCount(50);
  const sources = await images.evaluateAll((items) =>
    items.map((item) => item.getAttribute("src"))
  );
  expect(sources).toHaveLength(50);
  expect(
    sources.every((source) =>
      /^\/products\/catalog-normalized\/.+\.png$/.test(source ?? "")
    )
  ).toBe(true);

  const firstImage = images.first();
  await expect(firstImage).toBeVisible();
  await expect
    .poll(() =>
      firstImage.evaluate(
        (item) =>
          (item as HTMLImageElement).complete &&
          (item as HTMLImageElement).naturalWidth > 0
      )
    )
    .toBe(true);
});
