import { expect, test } from "@playwright/test";

test("pending product copy is replaced without internal review language", async ({
  page,
}) => {
  await page.goto("/product/solaris-body-lotion");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Solaris");
  await expect(page.getByTestId("claims-review-notice")).toHaveCount(0);
  await expect(page.locator(".product-purpose")).toHaveText(
    "Крем из ассортимента Dr. Nona для ежедневного ухода за кожей."
  );
  await expect(page.locator(".product-description")).toContainText(
    "Solaris Body Lotion представлен в каталоге Dr. Nona Moldova"
  );
  await expect(page.getByText(/бестселлер компании/i)).toHaveCount(0);
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
  await expect(page.locator(".product-purpose")).toHaveText(
    "Напиток из ассортимента Dr. Nona для повседневного рациона."
  );
  await expect(page.locator(".product-description")).toContainText(
    "Gonseen Tea представлен в каталоге Dr. Nona Moldova"
  );
  await expect(page.getByText(/чай gonseen/i)).toHaveCount(0);
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
