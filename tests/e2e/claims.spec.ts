import { expect, test } from "@playwright/test";

test("therapeutic product copy is hidden until Moldova approval", async ({
  page,
}) => {
  await page.goto("/product/solaris-body-lotion");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Halo Solaris Body Lotion"
  );
  await expect(page.getByTestId("claims-review-notice")).toBeVisible();
  await expect(
    page.getByText("Способствует обновлению клеток и заживлению кожи.")
  ).toHaveCount(0);
  await expect(
    page.getByText(/массажа при мышечных и суставных болях/i)
  ).toHaveCount(0);
});

test("supplement product shows an adjacent interim notice", async ({
  page,
}) => {
  await page.goto("/product/halo-gonseen-vitalitea");

  const disclaimer = page.getByTestId("product-disclaimer");
  await expect(disclaimer).toBeVisible();
  await expect(disclaimer).toContainText("Не является лекарственным средством");
  await expect(disclaimer).toContainText(
    "регистрационный статус для рынка Молдовы ожидают подтверждения"
  );
  await expect(page.getByText(/способствует общему благополучию/i)).toHaveCount(
    0
  );
});

test("Halo formula claims are replaced by the review state", async ({
  page,
}) => {
  await page.goto("/ourformula");

  await expect(page.getByTestId("claims-review-notice")).toBeVisible();
  await expect(page.getByText(/целебные свойства моря усиливают/i)).toHaveCount(
    0
  );
  await expect(
    page.getByText(/помогает защищать организм.*регенерации кожи/i)
  ).toHaveCount(0);
});
