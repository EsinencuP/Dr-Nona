import { expect, test } from "@playwright/test";

test("pending product claims stay out of home, catalogue search and detail", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText(/Мощное восстановление и защита/u)).toHaveCount(0);
  await expect(page.getByText(/Глоток здоровья в чашке чая/u)).toHaveCount(0);

  await page.goto("/products");
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
