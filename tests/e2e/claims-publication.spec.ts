import { expect, test } from "@playwright/test";

test("pending product claims stay out of home, catalogue search and detail", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.getByText(/Мощное восстановление и защита/u)).toHaveCount(0);
  await expect(page.getByText(/Глоток здоровья в чашке чая/u)).toHaveCount(0);

  await page.goto("/products");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Каталог", {
    timeout: 15_000,
  });
  const mobileToolbarToggle = page.getByRole("button", {
    name: "Поиск и сортировка",
  });
  if (testInfo.project.name === "chromium-mobile") {
    await expect(mobileToolbarToggle).toBeVisible();
    await mobileToolbarToggle.click();
  }
  await page
    .getByRole("searchbox", { name: "Поиск по названию" })
    .fill("лечебным эффектом");
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "По этим параметрам ничего не найдено.",
    })
  ).toBeVisible();

  await page.goto("/product/dynamic-hydrating-cream");
  await expect(
    page.locator(".product-purpose").getByText(
      "Крем из ассортимента Dr. Nona для ежедневного ухода за кожей."
    )
  ).toBeVisible();
  await expect(page.getByText(/ускоряет регенерацию/u)).toHaveCount(0);
  await expect(page.getByText(/защиты клеток от старения/u)).toHaveCount(0);
});
