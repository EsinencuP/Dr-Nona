import { expect, test, type Page } from "@playwright/test";

async function fillCommon(page: Page) {
  await page.getByLabel("Имя").fill("Ana");
  await page.getByLabel("Фамилия").fill("Popescu");
  await page.getByLabel("Телефон").fill("069 123 456");
  await page.getByLabel("Город").fill("Chișinău");
  await page.getByRole("checkbox").check();
}

test("consultation success uses mocked API and focuses status", async ({ page }) => {
  let submittedBody: Record<string, unknown> | undefined;
  await page.addInitScript(() => {
    sessionStorage.setItem(
      "session_product_history",
      JSON.stringify(["dynamic-hydrating-cream"])
    );
  });
  await page.route("**/api/applications", async (route) => {
    submittedBody = route.request().postDataJSON() as Record<string, unknown>;
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
  await page.goto(
    "/contactus?utm_source=instagram&utm_medium=story&utm_campaign=autumn-care&utm_content=product-card"
  );
  await expect(page.getByRole("button", { name: "Консультация" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await fillCommon(page);
  await page.getByLabel("Email (необязательно)").fill("ana@example.com");
  await page
    .getByLabel("Комментарий к заявке (необязательно)")
    .fill("Позвоните заранее");
  await page
    .getByLabel("Удобное время для звонка (необязательно)")
    .fill("После 18:00");
  await page.getByLabel("Предпочтительная дата").fill("2099-01-01");
  await page.getByLabel("Предпочтительное время").fill("10:00");
  await page.getByRole("button", { name: "Отправить заявку" }).click();
  await expect(page.getByText(/Заявка №request-e2e отправлена/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Статус заявки" })).toBeFocused();
  expect(submittedBody).toMatchObject({
    locale: "ru-MD",
    email: "ana@example.com",
    comment: "Позвоните заранее",
    preferredCallTime: "После 18:00",
    utmSource: "instagram",
    utmMedium: "story",
    utmCampaign: "autumn-care",
    utmContent: "product-card",
    entryPoint:
      "/contactus?utm_source=instagram&utm_medium=story&utm_campaign=autumn-care&utm_content=product-card",
    sessionHistory: '["dynamic-hydrating-cream"]',
  });
});

test("Romanian contact form submits ro-MD through the same API contract", async ({ page }) => {
  let submittedBody: Record<string, unknown> | undefined;
  await page.route("**/api/applications", async (route) => {
    submittedBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        requestId: "request-ro",
        delivery: { telegram: "sent" },
      }),
    });
  });

  await page.goto("/ro/contactus");
  await page.getByLabel("Prenume").fill("Ana");
  await page.getByLabel("Nume", { exact: true }).fill("Popescu");
  await page.getByLabel("Telefon").fill("069 123 456");
  await page.getByLabel("Oraș").fill("Chișinău");
  await page.getByRole("checkbox").check();
  await page.getByLabel("Data preferată").fill("2099-01-01");
  await page.getByLabel("Ora preferată").fill("10:00");
  await page.getByRole("button", { name: "Trimite solicitarea" }).click();

  await expect(page.getByText(/Solicitarea nr\. request-ro a fost trimisă/u)).toBeVisible();
  expect(submittedBody).toMatchObject({
    locale: "ro-MD",
    type: "consultation",
    firstName: "Ana",
    lastName: "Popescu",
  });
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

test("offline submission reports failure and preserves entered data", async ({
  page,
}) => {
  await page.route("**/api/applications", (route) => route.abort("internetdisconnected"));
  await page.goto("/contactus");
  await fillCommon(page);
  await page.getByLabel("Предпочтительная дата").fill("2099-01-01");
  await page.getByLabel("Предпочтительное время").fill("10:00");

  await page.getByRole("button", { name: "Отправить заявку" }).click();

  await expect(page.getByText(/Заявка не отправлена/)).toBeVisible();
  await expect(page.getByLabel("Имя")).toHaveValue("Ana");
  await expect(page.getByLabel("Телефон")).toHaveValue("069 123 456");
});

test("consent is required, linked to privacy policy and receives focus", async ({
  page,
}) => {
  let requestCount = 0;
  await page.route("**/api/applications", async (route) => {
    requestCount += 1;
    await route.abort();
  });
  await page.goto("/contactus");
  await page.getByLabel("Имя").fill("Ana");
  await page.getByLabel("Фамилия").fill("Popescu");
  await page.getByLabel("Телефон").fill("069 123 456");
  await page.getByLabel("Город").fill("Chișinău");
  await page.getByLabel("Предпочтительная дата").fill("2099-01-01");
  await page.getByLabel("Предпочтительное время").fill("10:00");

  const consent = page.getByRole("checkbox");
  await expect(consent).toHaveAttribute("required", "");
  await expect(
    page
      .getByRole("form")
      .getByRole("link", { name: "Политика конфиденциальности" })
  ).toHaveAttribute("href", "/privacypolicy");

  await page.getByRole("button", { name: "Отправить заявку" }).click();

  await expect(
    page.getByText("Необходимо принять условия обработки данных")
  ).toBeVisible();
  await expect(consent).toHaveAttribute("aria-invalid", "true");
  await expect(consent).toBeFocused();
  expect(requestCount).toBe(0);
});
