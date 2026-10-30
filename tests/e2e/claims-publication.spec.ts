import { expect, test } from "@playwright/test";

test("source originals stay searchable and fully visible independently of pending review", async ({
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
  await expect(page.locator(".product-card").filter({ hasText: "Solaris" }).first()).toBeVisible();

  await page.goto("/product/dynamic-hydrating-cream");
  await expect(page.locator(".product-purpose")).toHaveCount(0);
  await expect(page.locator(".product-copy-card--overview")).toBeVisible();
  await expect(page.getByTestId("full-product-description")).toContainText(/ускоряет регенерацию/u);
  await expect(page.getByTestId("full-product-description")).toContainText(/защиты клеток от старения/u);
});
