import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  await page.goto("/products");
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50, {
    timeout: 15_000,
  });
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
    page.getByRole("heading", { level: 2, name: "Dynamic Cream" })
  ).toBeVisible();

  await page.getByRole("button", { name: "Очистить поиск" }).click();
  await page.getByRole("combobox", { name: "Все категории" }).selectOption({
    label: "Кремы",
  });
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(12);

  await page.getByRole("combobox", { name: "Сортировка" }).selectOption("az");
  const names = await page.locator(".product-card :is(h2, h3)").allTextContents();
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

test("catalog actions align within each row without equalizing unrelated rows", async ({
  page,
}) => {
  const cardLayouts = await page
    .locator(".catalog-grid .product-card")
    .evaluateAll((cards) =>
      cards.map((card) => {
        const cardBox = card.getBoundingClientRect();
        const actions = card.querySelector<HTMLElement>(".product-card__actions");
        if (!actions) throw new Error("Product card actions are missing");
        const description = card.querySelector<HTMLElement>(".product-card__description");
        if (!description) throw new Error("Product card description is missing");
        return {
          row: Math.round(cardBox.top),
          actionTop: actions.getBoundingClientRect().top,
          copyGap: actions.getBoundingClientRect().top - description.getBoundingClientRect().bottom,
        };
      })
    );

  expect(cardLayouts).toHaveLength(50);
  const rows = new Map<number, typeof cardLayouts>();
  for (const card of cardLayouts) rows.set(card.row, [...(rows.get(card.row) ?? []), card]);
  for (const row of rows.values()) {
    const positions = row.map((card) => card.actionTop);
    expect(Math.max(...positions) - Math.min(...positions)).toBeLessThanOrEqual(2);
    if (row.length === 1) expect(row[0].copyGap).toBeLessThanOrEqual(16);
  }
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

  const mediaFrames = await page
    .locator(".catalog-grid .product-card")
    .evaluateAll((cards) =>
      cards.map((card) => {
        const stage = card.querySelector<HTMLElement>(".product-card__stage");
        const picture = card.querySelector<HTMLElement>(".product-picture");
        const image = card.querySelector<HTMLImageElement>(".product-card__image");
        const stageRect = stage?.getBoundingClientRect();
        const pictureRect = picture?.getBoundingClientRect();
        return {
          stageWidth: Math.round(stageRect?.width ?? 0),
          stageHeight: Math.round(stageRect?.height ?? 0),
          pictureWidth: Math.round(pictureRect?.width ?? 0),
          pictureHeight: Math.round(pictureRect?.height ?? 0),
          objectFit: image ? getComputedStyle(image).objectFit : "",
        };
      })
    );

  expect(mediaFrames).toHaveLength(50);
  expect(
    mediaFrames.every(
      (frame) =>
        frame.objectFit === "contain" &&
        Math.abs(frame.pictureWidth - frame.stageWidth) <= 1 &&
        Math.abs(frame.pictureHeight - frame.stageHeight) <= 1
    )
  ).toBe(true);
});
