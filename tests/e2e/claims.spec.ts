import { expect, test } from "@playwright/test";

test("source product copy is shown without changing review status", async ({
  page,
}) => {
  await page.goto("/product/solaris-body-lotion");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Solaris");
  await expect(page.getByTestId("claims-review-notice")).toHaveCount(0);
  await expect(page.locator(".product-purpose")).toHaveCount(0);
  await expect(page.locator(".product-copy-card--overview")).toBeVisible();
  await expect(page.getByTestId("full-product-description")).toContainText(/Бестселлер компании/i);
});

test("supplement product shows a neutral adjacent disclaimer", async ({
  page,
}) => {
  await page.goto("/product/gonseen");

  const disclaimer = page.getByTestId("product-disclaimer");
  await expect(disclaimer).toBeVisible();
  await expect(disclaimer).toContainText("Не является лекарственным средством");
  await expect(disclaimer).not.toContainText("Молдовы");
  await expect(disclaimer).not.toContainText("подтверждения");
  await expect(page.locator(".product-purpose")).toHaveCount(0);
  await expect(page.locator(".product-copy-card--overview")).toBeVisible();
  await expect(page.getByTestId("full-product-description")).toContainText(/Чай GONSEEN/i);
});

test("Halo formula uses neutral copy without an internal review state", async ({
  page,
}) => {
  await page.goto("/ourformula");

  await expect(page.getByTestId("claims-review-notice")).toHaveCount(0);
  await expect(
    page.getByText(/Древнейшая форма жизни из экстремальной среды/i)
  ).toBeVisible();
  await expect(page.getByText(/целебные свойства моря усиливают/i)).toHaveCount(
    0
  );
  await expect(
    page.getByText(/помогает защищать организм.*регенерации кожи/i)
  ).toHaveCount(0);
});
