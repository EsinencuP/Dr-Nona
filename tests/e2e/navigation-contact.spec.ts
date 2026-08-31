import { expect, test } from "@playwright/test";

test("home exposes a complete locale switch and preserves Romanian navigation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.locator("html")).toHaveAttribute("data-ui-locale", "ru");
  await page.getByRole("link", { name: "RO", exact: true }).click();
  await expect(page).toHaveURL(/\/ro$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
  await expect(
    page.getByRole("heading", { level: 2, name: "Recomandarea noastră" })
  ).toBeVisible();
  await page.getByRole("link", { name: "Selecție: 0" }).click();
  await expect(page).toHaveURL(/\/ro\/selection$/);
  await expect(
    page.getByRole("heading", { level: 2, name: "Selecția este goală" })
  ).toBeVisible();
  await page.getByRole("link", { name: "Deschide catalogul" }).click();
  await expect(page).toHaveURL(/\/ro\/products$/);
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
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeFocused();
    await menu.click();
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
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50);
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

test("contact flow preserves context and exposes the real application form", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("drnona-selection", JSON.stringify(["lord-deodorant"]));
  });
  await page.goto("/contactus");

  await expect(
    page.getByRole("heading", { level: 3, name: "В заявку войдут" })
  ).toBeVisible();
  await expect(page.getByText("SKU 324001")).toHaveCount(2);
  await expect(page.locator("form.application-form")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Заказ" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(
    page.getByRole("button", { name: "Отправить заявку" })
  ).toBeVisible();
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

test("Romanian contact route localizes the form and keeps the selected language", async ({
  page,
}) => {
  await page.goto("/ro/contactus");

  await expect(
    page.getByRole("heading", { level: 1, name: "Contacte în Moldova" })
  ).toBeVisible();
  await expect(page.getByLabel("Prenume")).toBeVisible();
  await expect(page.getByLabel("Nume", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Consultație" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(
    page.getByRole("button", { name: "Trimite solicitarea" })
  ).toBeVisible();

  await page.getByRole("link", { name: "Catalog" }).first().click();
  await expect(page).toHaveURL(/\/ro\/products$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
});

test("certificates page links to the international archive without review copy", async ({
  page,
}) => {
  await page.goto("/certificates");

  await expect(
    page.getByRole("heading", { level: 1, name: "Сертификаты и документы" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Международный архив сертификатов",
    })
  ).toBeVisible();
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expect(page.getByText("Russia")).toHaveCount(0);
  await expect(page.getByText("Israel")).toHaveCount(0);
  await expect(page.getByText("Ukraine")).toHaveCount(0);
  await expect(page.getByText(/провер/i)).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /Открыть международный архив/i })
  ).toBeVisible();
});
