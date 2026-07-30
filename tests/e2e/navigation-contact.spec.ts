import { expect, test } from "@playwright/test";

test("release language remains Russian and incomplete RO is unavailable", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.locator("html")).toHaveAttribute("data-ui-locale", "ru");
  await expect(page.getByRole("button", { name: /RU|RO/i })).toHaveCount(0);
});

test("navigation works for desktop and mobile Chromium", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  if (testInfo.project.name === "chromium-mobile") {
    const menu = page.locator(".mobile-menu-button");
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("navigation", { name: "Мобильная навигация" })
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Мобильная навигация" })
      .getByRole("link", { name: "Каталог" })
      .click();
  } else {
    await expect(
      page.getByRole("navigation", { name: "Основная навигация" })
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Основная навигация" })
      .getByRole("link", { name: "Каталог" })
      .click();
  }

  await expect(page).toHaveURL(/\/products$/);
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(7);
});

test("keyboard navigation reaches the skip link and main content", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Перейти к содержанию" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator("#main-content")).toBeFocused();
});

test("contact flow preserves context and never exposes a fake submit", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("drnona-selection", JSON.stringify(["lord-deodorant"]));
  });
  await page.goto("/contactus");

  await expect(
    page.getByRole("heading", { level: 3, name: "В письмо войдут" })
  ).toBeVisible();
  await expect(page.getByText("SKU 324001")).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Отправить" })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { level: 2, name: "Филиал в Молдове" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "+373 69 281 916" })).toHaveCount(3);
  await expect(page.getByRole("link", { name: "+373 69 049 793" })).toHaveCount(3);
  await expect(page.getByText("Израиль")).toHaveCount(0);
  await expect(page.getByText(/Telegram/)).toHaveCount(0);
  const email = page.getByRole("link", { name: "Подготовить письмо" });
  await expect(email).toHaveAttribute("href", /lord-deodorant/);
  await expect(email).toHaveAttribute("href", /324001/);
});

test("certificates are scoped to Moldova without a foreign country selector", async ({
  page,
}) => {
  await page.goto("/certificates");

  await expect(
    page.getByRole("heading", { level: 1, name: "Сертификаты для Молдовы" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "На сайте нет опубликованных сертификатов для Молдовы",
    })
  ).toBeVisible();
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expect(page.getByText("Russia")).toHaveCount(0);
  await expect(page.getByText("Israel")).toHaveCount(0);
  await expect(page.getByText("Ukraine")).toHaveCount(0);
  await expect(page.getByText("Кем выдан")).toBeVisible();
  await expect(page.getByText("Страна действия")).toBeVisible();
  await expect(page.getByText("Продукты")).toBeVisible();
  await expect(page.getByText("Срок действия")).toBeVisible();
});
