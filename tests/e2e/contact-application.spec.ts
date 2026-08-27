import { expect, test, type Page } from "@playwright/test";

async function fillCommon(page: Page) {
  await page.getByLabel("Имя").fill("Ana");
  await page.getByLabel("Фамилия").fill("Popescu");
  await page.getByLabel("Телефон").fill("069 123 456");
  await page.getByLabel("Город").fill("Chișinău");
  await page.getByRole("checkbox").check();
}

test("consultation success uses mocked API and focuses status", async ({ page }) => {
  await page.route("**/api/applications", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        requestId: "request-e2e",
        delivery: { telegram: "sent" },
      }),
    });
  });
  await page.goto("/contactus");
  await expect(page.getByRole("button", { name: "Консультация" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await fillCommon(page);
  await page.getByLabel("Предпочтительная дата").fill("2099-01-01");
  await page.getByLabel("Предпочтительное время").fill("10:00");
  await page.getByRole("button", { name: "Отправить заявку" }).click();
  await expect(page.getByText(/Заявка №request-e2e отправлена/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Статус заявки" })).toBeFocused();
});

test("order defaults from selection and Telegram delivery succeeds", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("drnona-selection", JSON.stringify(["lord-deodorant"]));
  });
  await page.route("**/api/applications", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        requestId: "request-order",
        delivery: { telegram: "sent" },
      }),
    });
  });
  await page.goto("/contactus");
  await expect(page.getByRole("button", { name: "Заказ" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await fillCommon(page);
  await page.getByRole("button", { name: "Отправить заявку" }).click();
  await expect(page.getByText(/Заявка №request-order отправлена/)).toBeVisible();
});

test("client validation and complete failure preserve data", async ({ page }) => {
  await page.route("**/api/applications", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    await route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, code: "DELIVERY_FAILED" }),
    });
  });
  await page.goto("/contactus");
  await page.getByRole("button", { name: "Отправить заявку" }).click();
  await expect(page.getByText("Проверьте отмеченные поля.")).toBeVisible();
  await fillCommon(page);
  await page.getByLabel("Предпочтительная дата").fill("2099-01-01");
  await page.getByLabel("Предпочтительное время").fill("10:00");
  const submit = page.getByRole("button", { name: "Отправить заявку" });
  await submit.click();
  await expect(page.getByRole("button", { name: "Отправляем заявку…" })).toBeDisabled();
  await expect(page.getByText(/Заявка не отправлена/)).toBeVisible();
  await expect(page.getByLabel("Имя")).toHaveValue("Ana");
});
