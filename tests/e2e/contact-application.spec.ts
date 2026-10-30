import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function fillCommon(page: Page) {
  await page.getByLabel("Имя").fill("Ana");
  await page.getByLabel("Фамилия").fill("Popescu");
  await page.getByLabel("Телефон").fill("069 123 456");
  await page.getByLabel("Регион доставки (Молдова)").selectOption("Кишинёв");
  await page.getByRole("checkbox").check();
}

test("order success shows thanks and retains a focused receipt after closing", async ({ page }) => {
  let submittedBody: Record<string, unknown> | undefined;
  await page.addInitScript(() => {
    sessionStorage.setItem(
      "session_product_history",
      JSON.stringify(["dynamic-hydrating-cream"])
    );
    const decidedAt = Date.now();
    localStorage.setItem("drnona-privacy-choice-v1", JSON.stringify({
      version: 1, choice: "accepted", decidedAt, expiresAt: decidedAt + 180 * 24 * 60 * 60 * 1000,
    }));
  });
  await page.route("**/api/applications", async (route) => {
    submittedBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        accepted: true,
        requestId: "request-e2e",
        delivery: { telegram: "sent" },
      }),
    });
  });
  await page.goto(
    "/contactus?products=lord-deodorant&utm_source=instagram&utm_medium=story&utm_campaign=autumn-care&utm_content=product-card"
  );
  await expect(page.locator(".application-mode")).toHaveCount(0);
  await fillCommon(page);
  await page.getByLabel("Email (необязательно)").fill("ana@example.com");
  await page
    .getByLabel("Комментарий к заказу (необязательно)")
    .fill("Позвоните заранее");
  await page
    .getByLabel("Удобное время для звонка (необязательно)")
    .fill("После 18:00");
  await page.getByRole("button", { name: "Оформить заказ" }).click();
  await expect(page.locator(".application-status p").filter({ hasText: /Заказ отправлен. Менеджер свяжется/ })).toBeVisible();
  const thanks = page.getByRole("dialog", { name: "Благодарим за заказ!" });
  await expect(thanks).toBeVisible();
  await expect(thanks.getByRole("button", { name: "Понятно", exact: true })).toBeFocused();
  await thanks.getByRole("button", { name: "Понятно", exact: true }).click();
  await expect(thanks).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Статус заказа" })).toBeFocused();
  expect(submittedBody).toMatchObject({
    locale: "ru-MD",
    type: "order",
    email: "ana@example.com",
    comment: "Позвоните заранее",
    preferredCallTime: "После 18:00",
    utmSource: "instagram",
    utmMedium: "story",
    utmCampaign: "autumn-care",
    utmContent: "product-card",
    entryPoint: "/contactus",
    sessionHistory: '["dynamic-hydrating-cream"]',
    attribution: {
      version: 1,
      consent: "application_submission",
      firstTouch: {
        kind: "campaign",
        source: "instagram",
        medium: "story",
        campaign: "autumn-care",
        content: "product-card",
      },
      lastTouch: {
        kind: "campaign",
        source: "instagram",
        medium: "story",
        campaign: "autumn-care",
        content: "product-card",
      },
      entry: { path: "/contactus", locale: "ru-MD" },
      sessionHistory: ["dynamic-hydrating-cream"],
    },
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
        accepted: true,
        requestId: "request-ro",
        delivery: { telegram: "sent" },
      }),
    });
  });

  await page.goto("/ro/contactus?products=lord-deodorant");
  await page.getByLabel("Prenume").fill("Ana");
  await page.getByLabel("Nume", { exact: true }).fill("Popescu");
  await page.getByLabel("Telefon").fill("069 123 456");
  await page
    .getByLabel("Regiunea de livrare (Moldova)")
    .selectOption("Кишинёв");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Plasează comanda" }).click();

  await expect(page.locator(".application-status p").filter({ hasText: /Comanda a fost trimisă/u })).toBeVisible();
  const thanks = page.getByRole("dialog", { name: "Vă mulțumim pentru comandă!" });
  await expect(thanks).toBeVisible();
  await expect(thanks).toContainText("Numărul comenzii: request-ro");
  await thanks.getByRole("button", { name: "Am înțeles", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Starea comenzii" })).toBeFocused();
  expect(submittedBody).toMatchObject({
    locale: "ro-MD",
    type: "order",
    firstName: "Ana",
    lastName: "Popescu",
  });
});

test("order defaults from selection and Telegram delivery succeeds", async ({
  page,
}) => {
  let submittedBody: Record<string, unknown> | undefined;
  let requestCount = 0;
  let confirmReceipt: (() => void) | undefined;
  const serverConfirmation = new Promise<void>((resolve) => { confirmReceipt = resolve; });
  await page.addInitScript(() => {
    localStorage.setItem("drnona-selection", JSON.stringify(["lord-deodorant"]));
  });
  await page.route("**/api/applications", async (route) => {
    requestCount += 1;
    submittedBody = route.request().postDataJSON() as Record<string, unknown>;
    await serverConfirmation;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        accepted: true,
        requestId: "request-order",
        delivery: { telegram: "sent" },
      }),
    });
  });
  await page.goto("/contactus?products=lord-deodorant");
  await expect(page.locator(".application-mode")).toHaveCount(0);
  await fillCommon(page);
  await page
    .getByRole("button", { name: /Увеличить количество/u })
    .click();
  await page.getByRole("button", { name: "Оформить заказ" }).click();
  await expect(page.getByRole("button", { name: "Отправляем заказ…" })).toBeDisabled();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  confirmReceipt?.();
  await expect(page.locator(".application-status p").filter({ hasText: /Заказ отправлен. Менеджер свяжется/ })).toBeVisible();
  const thanks = page.getByRole("dialog", { name: "Благодарим за заказ!" });
  await expect(thanks).toBeVisible();
  await expect(thanks).toContainText("Номер заказа: request-order");
  await expect(thanks).toContainText("Наш консультант в скором времени свяжется с вами");
  await expect(thanks.getByRole("button", { name: "Понятно", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(thanks.getByRole("button", { name: "Закрыть", exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(thanks.getByRole("button", { name: "Понятно", exact: true })).toBeFocused();
  const box = await thanks.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  const accessibility = await new AxeBuilder({ page }).include(".application-thanks").analyze();
  expect(accessibility.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(thanks).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Статус заказа" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Заказ отправлен" })).toBeDisabled();
  expect(requestCount).toBe(1);
  expect(submittedBody).toMatchObject({
    productSlugs: ["lord-deodorant"],
    items: [{ slug: "lord-deodorant", quantity: 2 }],
  });
});

test("retired booking controls and requests are absent", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => { if (request.url().includes("consultation-slots")) requests.push(request.url()); });
  await page.goto("/contactus");
  await expect(page.getByRole("button", { name: "Консультация", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Мастер-класс", exact: true })).toHaveCount(0);
  await expect(page.locator('input[type="date"], input[type="time"], select[name="consultationSlotId"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Оформить заказ", exact: true })).toBeDisabled();
  expect(requests).toEqual([]);
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
  await page.goto("/contactus?products=lord-deodorant");
  await page.getByRole("button", { name: "Оформить заказ" }).click();
  await expect(page.getByText("Проверьте отмеченные поля.")).toBeVisible();
  await fillCommon(page);
  const submit = page.getByRole("button", { name: "Оформить заказ" });
  await submit.click();
  await expect(page.getByRole("button", { name: "Отправляем заказ…" })).toBeDisabled();
  await expect(page.getByText(/Не удалось отправить заказ/)).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByLabel("Имя")).toHaveValue("Ana");
});

test("offline submission reports failure and preserves entered data", async ({
  page,
}) => {
  await page.route("**/api/applications", (route) => route.abort("internetdisconnected"));
  await page.goto("/contactus?products=lord-deodorant");
  await fillCommon(page);

  await page.getByRole("button", { name: "Оформить заказ" }).click();

  await expect(page.getByText(/Не удалось отправить заказ/)).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
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
  await page.goto("/contactus?products=lord-deodorant");
  await page.getByLabel("Имя").fill("Ana");
  await page.getByLabel("Фамилия").fill("Popescu");
  await page.getByLabel("Телефон").fill("069 123 456");
  await page.getByLabel("Регион доставки (Молдова)").selectOption("Кишинёв");

  const consent = page.getByRole("checkbox");
  await expect(consent).toHaveAttribute("required", "");
  await expect(
    page
      .getByRole("form")
      .getByRole("link", { name: "Политика конфиденциальности" })
  ).toHaveAttribute("href", "/privacypolicy");

  await page.getByRole("button", { name: "Оформить заказ" }).click();

  await expect(
    page.getByText("Необходимо принять условия обработки данных")
  ).toBeVisible();
  await expect(consent).toHaveAttribute("aria-invalid", "true");
  await expect(consent).toBeFocused();
  const consentErrorBox = await page.locator("#consentAccepted-error").boundingBox();
  expect(consentErrorBox).not.toBeNull();
  expect(consentErrorBox!.height).toBeLessThan(100);
  expect(requestCount).toBe(0);
});
