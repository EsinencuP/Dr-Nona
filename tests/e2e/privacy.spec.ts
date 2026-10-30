import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Exercise first visits independently of the returning-visitor navigation fixture.
test.use({ storageState: { cookies: [], origins: [] } });

for (const locale of ["ru", "ro"] as const) {
  const prefix = `/${locale}`;
  const reject = locale === "ro" ? "Refuză" : "Отказаться";
  const accept = locale === "ro" ? "Acceptă" : "Принять";
  const settings = locale === "ro" ? "Setări cookies" : "Настройки cookies";

  test(`${locale}: first visit defaults off, offers equal choices and remembers refusal`, async ({ page, context }) => {
    await page.goto(`${prefix}/product/lord-deodorant?utm_source=before-consent`);
    const notice = page.locator(".privacy-notice");
    await expect(notice).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("utm_source"))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem("session_product_history"))).toBeNull();
    expect(await context.cookies()).toEqual([]);
    const actions = await notice.locator(".privacy-notice__actions .button").evaluateAll((buttons) => buttons.map((button) => {
      const style = getComputedStyle(button);
      const box = button.getBoundingClientRect();
      return { color: style.color, background: style.backgroundColor, width: box.width, height: box.height };
    }));
    expect(actions).toHaveLength(2);
    expect(actions[0]).toEqual(actions[1]);
    expect(actions[0].height).toBeGreaterThanOrEqual(48);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(axe.violations).toEqual([]);
    await notice.getByRole("button", { name: reject, exact: true }).click();
    await expect(notice).toHaveCount(0);
    await page.reload();
    await expect(page.locator("h1")).toBeVisible();
    await expect(notice).toHaveCount(0);
    expect(await page.evaluate(() => sessionStorage.getItem("utm_source"))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem("session_product_history"))).toBeNull();
  });

  test(`${locale}: optional data starts after acceptance and can be revoked`, async ({ page }) => {
    await page.goto(`${prefix}/product/lord-deodorant?utm_source=permitted`);
    const notice = page.locator(".privacy-notice");
    await notice.getByRole("button", { name: accept, exact: true }).click();
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("utm_source"))).toBe("permitted");
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("session_product_history"))).toBe('["lord-deodorant"]');
    const preferences = page.getByRole("button", { name: settings, exact: true });
    await preferences.click();
    await expect(notice.getByRole("button", { name: reject, exact: true })).toBeFocused();
    await notice.getByRole("button", { name: reject, exact: true }).click();
    await expect(notice).toHaveCount(0);
    await expect(preferences).toBeFocused();
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("utm_source"))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem("session_product_history"))).toBeNull();
    await page.goto(`${prefix}/product/okseen?utm_source=after-refusal`);
    expect(await page.evaluate(() => sessionStorage.getItem("session_product_history"))).toBeNull();
  });

  test(`${locale}: policy is localized, candid about missing details and linked from the notice`, async ({ page }) => {
    await page.goto(prefix);
    await page.locator('.privacy-notice a[href$="/privacypolicy"]').click();
    await expect(page).toHaveURL(`${prefix}/privacypolicy`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(locale === "ro" ? "Politica de confidențialitate" : "Политика конфиденциальности");
    await page.locator(".privacy-notice").getByRole("button", { name: reject, exact: true }).click();
    await expect(page.locator(".privacy-page__status")).toContainText(locale === "ro" ? "IDNO" : "IDNO");
    await expect(page.locator(".privacy-storage-list")).toContainText("session_product_history");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}

test("refusal does not block a form and does not authorize attribution through its checkbox", async ({ page }) => {
  let received: Record<string, unknown> | undefined;
  await page.route("**/api/applications", async (route) => {
    received = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({
      ok: true, requestId: "privacy-test", delivery: { telegram: "sent" },
    }) });
  });
  await page.goto("/contactus?products=lord-deodorant&utm_source=not-permitted");
  await page.locator(".privacy-notice").getByRole("button", { name: "Отказаться", exact: true }).click();
  await page.getByLabel("Имя", { exact: true }).fill("Ana");
  await page.getByLabel("Фамилия").fill("Popescu");
  await page.getByLabel("Телефон", { exact: true }).fill("069123456");
  await page.getByLabel("Регион доставки (Молдова)").selectOption("Кишинёв");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Оформить заказ", exact: true }).click();
    await page.getByRole("dialog", { name: "Спасибо!" }).getByRole("button", { name: "Закрыть", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Статус заказа" })).toBeVisible();
  expect(received).toMatchObject({ consentAccepted: true, productSlugs: ["lord-deodorant"] });
  expect(received).not.toHaveProperty("utmSource");
  expect(received).not.toHaveProperty("sessionHistory");
  expect(received).not.toHaveProperty("attribution");
});

test("the full policy remains readable without JavaScript in the built site", async ({ browser }) => {
  test.skip(process.env.PLAYWRIGHT_PRODUCTION !== "1", "Build output verification");
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "4173"}/ro/privacypolicy`);
  await expect(page.getByRole("heading", { name: "Drepturile și cererile dumneavoastră" })).toBeVisible();
  await expect(page.locator("body")).toContainText("drnona-privacy-choice-v1");
  await context.close();
});
