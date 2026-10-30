import { expect, test } from "@playwright/test";
import { join } from "node:path";

for (const locale of ["ru", "ro"] as const) {
  test(`${locale}: selection → order → validation → failed and pending retry → confirmed receipt`, async ({ page }, info) => {
    const ro = locale === "ro";
    const action = ro ? "Plasează comanda" : "Оформить заказ";
    const requests: Array<{ key: string | undefined; body: Record<string, unknown> }> = [];
    await page.route("**/api/applications", async route => {
      requests.push({ key: route.request().headers()["idempotency-key"], body: route.request().postDataJSON() });
      const attempt = requests.length;
      await route.fulfill({ status: attempt === 1 ? 502 : attempt === 2 ? 202 : 201, contentType: "application/json",
        body: JSON.stringify(attempt === 1 ? { ok: false, code: "DELIVERY_FAILED" } : { ok: true, accepted: attempt === 3, requestId: "order-flow", delivery: { telegram: attempt === 2 ? "pending" : "sent" } }) });
    });
    await page.goto(`/${locale}/products`);
    await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50);
    const cards = page.locator(".catalog-grid .product-card");
    await cards.nth(0).locator(".save-button").click();
    await expect(page.locator(".toast")).toContainText(ro ? "Produsul a fost adăugat în selecție" : "Продукт добавлен в подборку");
    await cards.nth(1).locator(".save-button").click();
    await page.locator(".selection-link").click();
    await expect(page.locator(".selection-list article")).toHaveCount(2);
    await expect(page.locator(".selection-page .page-intro")).toHaveCount(0);
    await expect(page.locator(".selection-page a[href^='mailto:']")).toHaveCount(0);
    await expect(page.locator(".selection-contact").getByRole("button", { name: ro ? "Copiază lista" : "Скопировать список" })).toBeVisible();
    await expect(page.locator(".selection-contact h2")).toHaveText(ro ? "Plasează comanda chiar acum" : "Оформите заказ прямо сейчас");
    await page.locator(".selection-contact").getByRole("link", { name: action, exact: true }).click();
    await expect(page.locator(".application-products li")).toHaveCount(2);
    if (!ro) await expect(page.locator(".application-panel__heading > p")).toHaveText("Заполните контактные данные. Менеджер свяжется с вами для подтверждения заказа и согласования доставки. Оформление заказа не является оплатой");
    await expect(page.locator(".application-mode")).toHaveCount(0);
    const submit = page.getByRole("button", { name: action, exact: true });
    await submit.click();
    const first = page.getByLabel(ro ? "Prenume" : "Имя", { exact: true });
    await expect(first).toHaveAttribute("aria-invalid", "true");
    expect(requests).toHaveLength(0);
    await first.fill("Ana");
    await page.getByLabel(ro ? "Nume" : "Фамилия", { exact: true }).fill("Popescu");
    await page.getByLabel(ro ? "Telefon" : "Телефон", { exact: true }).fill("069123456");
    await page.getByLabel(ro ? "Regiunea de livrare (Moldova)" : "Регион доставки (Молдова)").selectOption("Кишинёв");
    const comment = page.getByLabel(ro ? "Comentariu la comandă (opțional)" : "Комментарий к заказу (необязательно)");
    await comment.fill("Please call before delivery");
    await page.getByRole("checkbox").check();
    await page.locator(".application-quantity").first().getByRole("button").last().click();
    for (let attempt = 1; attempt <= 2; attempt++) {
      await submit.click();
      await expect(page.locator(".application-status--server-error")).toBeVisible();
      await expect(page.getByRole("dialog", { name: ro ? "Vă mulțumim pentru comandă!" : "Благодарим за заказ!" })).not.toBeVisible();
      await expect(first).toHaveValue("Ana");
      await expect(comment).toHaveValue("Please call before delivery");
      await expect(page.locator(".application-products li")).toHaveCount(2);
      await expect(page.locator(".application-quantity output").first()).toHaveText("2");
      expect(requests).toHaveLength(attempt);
    }
    await submit.click();
    const thanks = page.getByRole("dialog", { name: ro ? "Vă mulțumim pentru comandă!" : "Благодарим за заказ!" });
    await expect(thanks).toBeVisible();
    await expect(thanks).toContainText(ro ? "Consultantul nostru vă va contacta în scurt timp pentru confirmarea comenzii și stabilirea detaliilor de livrare" : "Наш консультант в скором времени свяжется с вами для подтверждения заказа и согласования доставки");
    expect(requests).toHaveLength(3);
    expect(new Set(requests.map(request => request.key)).size).toBe(1);
    expect(requests.every(request => request.body.type === "order")).toBe(true);
    expect(requests[2].body).toMatchObject({ locale: `${locale}-MD`, productSlugs: ["solaris-body-lotion", "hand-and-nail-treatment"],
      items: [expect.objectContaining({ slug: "solaris-body-lotion", officialName: "Solaris Body Lotion", sku: "413001", quantity: 2, url: expect.stringContaining("/product/solaris-body-lotion") }), expect.objectContaining({ slug: "hand-and-nail-treatment", sku: "406001", quantity: 1 })] });
    const acknowledge = thanks.getByRole("button", { name: ro ? "Am înțeles" : "Понятно", exact: true });
    await expect(acknowledge).toBeFocused();
    await expect(first).toHaveValue("");
    await expect(comment).toHaveValue("");
    await expect(page.locator(".application-products li")).toHaveCount(0);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("drnona-selection") ?? "null"))).toEqual([]);
    expect(new URL(page.url()).searchParams.has("products")).toBe(false);
    await page.screenshot({ path: join("artifacts/order-flow", `${locale}-${info.project.name}-success.png`), fullPage: true });
    if (ro) await thanks.getByRole("button", { name: "Închide", exact: true }).click();
    else await page.keyboard.press("Escape");
    await expect(thanks).not.toBeVisible();
    await expect(page.getByRole("heading", { name: ro ? "Starea comenzii" : "Статус заказа" })).toBeFocused();
    await page.reload();
    await expect(page.locator(".application-products li")).toHaveCount(0);
    expect(requests).toHaveLength(3);
  });
}
