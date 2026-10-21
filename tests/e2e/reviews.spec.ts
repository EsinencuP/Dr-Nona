import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("reviews navigation, SKU selection, failed retry and moderation acknowledgement", async ({
  page,
}, info) => {
  let attempts = 0;
  const keys: string[] = [];
  await page.route("**/api/reviews**", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { ok: true, reviews: [], hasMore: false } });
    keys.push(route.request().headers()["idempotency-key"]);
    const payload = route.request().postDataJSON();
    expect(payload.productSlug).toBe("lord-deodorant");
    expect(payload.consentAccepted).toBe(true);
    attempts += 1;
    return route.fulfill({
      status: attempts === 1 ? 503 : 202,
      json: attempts === 1 ? { ok: false } : { ok: true, status: "PENDING" },
    });
  });
  await page.goto("/");
  if (info.project.name === "chromium-mobile")
    await page.getByRole("button", { name: "Открыть меню", exact: true }).click();
  await page
    .getByRole("navigation", {
      name: info.project.name === "chromium-mobile" ? "Мобильная навигация" : "Основная навигация",
      exact: true,
    })
    .getByRole("link", { name: "Отзывы", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Отзывы", exact: true })).toBeVisible();
  await expect(page.locator(".reviews-header p")).toHaveCount(0);
  await expect(page.locator("#review-filter-product")).toHaveCount(0);
  await expect(page.locator("#review-product option").filter({ hasText: "SKU" })).toHaveCount(0);
  await expect(page.locator('#review-product option[value="lord-deodorant"]')).toHaveText("Deodorant ( LORD )");
  await expect(page.getByText(/Пока нет опубликованных отзывов/)).toBeVisible();
  await page.getByLabel("Ваше имя", { exact: true }).fill("Тестовый автор");
  await page.getByLabel("О чём отзыв", { exact: true }).selectOption("lord-deodorant");
  await page
    .getByLabel("Ваш отзыв", { exact: true })
    .fill("Тестовый отзыв для проверки формы, не для публикации.");
  await page.getByRole("checkbox", { name: /Я согласен/ }).check();
  await page.getByRole("button", { name: "Отправить на проверку" }).click();
  await expect(page.getByRole("alert")).toContainText("Не удалось отправить");
  await expect(page.getByLabel("Ваш отзыв", { exact: true })).toHaveValue(/Тестовый отзыв/);
  await page.getByRole("button", { name: "Отправить на проверку" }).click();
  await expect(page.locator("#write-review").getByRole("status")).toContainText(
    "Отзыв отправлен на проверку",
  );
  expect(keys[0]).toBe(keys[1]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("Romanian form accepts general reviews and shows honest load failures", async ({ page }) => {
  await page.route("**/api/reviews**", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ status: 503, json: { ok: false } });
    expect(route.request().postDataJSON().productSlug).toBeNull();
    expect(route.request().postDataJSON().locale).toBe("ro");
    return route.fulfill({ status: 202, json: { ok: true, status: "PENDING" } });
  });
  await page.goto("/ro/reviews");
  await expect(page.getByRole("heading", { name: "Recenzii", exact: true })).toBeVisible();
  await expect(page.locator(".reviews-header p")).toHaveCount(0);
  await expect(page.locator("#review-filter-product")).toHaveCount(0);
  await expect(page.locator('#review-product option[value="lord-deodorant"]')).toHaveText("Deodorant ( LORD )");
  await expect(page.locator(".mobile-contact-action")).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText("Recenziile nu au putut fi încărcate");
  await page.getByLabel("Numele tău", { exact: true }).fill("Autor de test");
  await page
    .getByLabel("Recenzia ta", { exact: true })
    .fill("Recenzie pentru verificarea formularului, nu pentru publicare.");
  await page.getByRole("checkbox", { name: /Sunt de acord/ }).check();
  await page.getByRole("button", { name: "Trimite spre verificare" }).click();
  await expect(page.locator("#write-review").getByRole("status")).toContainText(
    "trimisă spre verificare",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("an open review page reflects moderation across all opened pages without losing draft text", async ({
  page,
}) => {
  const fixture = (id: number) => ({
    id: `live-test-${id}`,
    authorName: `ТЕСТ · Live ${id}`,
    body: `Тестовая запись ${id} для проверки автоматического обновления.`,
    productSlug: null,
    locale: "ru",
    createdAt: new Date(Date.UTC(2026, 9, 21, 10, id)).toISOString(),
  });
  let published = Array.from({ length: 13 }, (_, index) => fixture(index + 1));
  await page.route("**/api/reviews**", async (route) => {
    const pageNumber = Number(new URL(route.request().url()).searchParams.get("page") || 1);
    const offset = (pageNumber - 1) * 12;
    return route.fulfill({
      json: {
        ok: true,
        reviews: published.slice(offset, offset + 12),
        hasMore: offset + 12 < published.length,
      },
    });
  });
  await page.goto("/ru/reviews");
  await expect(page.locator(".review-entry")).toHaveCount(12);
  await page.getByRole("button", { name: "Показать ещё", exact: true }).click();
  await expect(page.locator(".review-entry")).toHaveCount(13);
  await page
    .getByLabel("Ваш отзыв", { exact: true })
    .fill("Мой незавершённый отзыв должен сохраниться при обновлении списка.");
  published = [fixture(14), ...published.filter((row) => row.id !== "live-test-13")];
  await expect(page.getByRole("heading", { name: "ТЕСТ · Live 14", exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByRole("heading", { name: "ТЕСТ · Live 13", exact: true })).toHaveCount(0);
  await expect(page.locator(".review-entry")).toHaveCount(13);
  await expect(page.getByLabel("Ваш отзыв", { exact: true })).toHaveValue(
    "Мой незавершённый отзыв должен сохраниться при обновлении списка.",
  );
});
