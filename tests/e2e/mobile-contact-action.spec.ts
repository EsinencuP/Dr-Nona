import { expect, test } from "@playwright/test";

for (const locale of ["ru", "ro"] as const) {
  const prefix = `/${locale}`;

  test(`${locale}: mobile contact action stays fixed without hiding footer links`, async ({ page }, testInfo) => {
    await page.goto(prefix);
    const action = page.locator(".mobile-contact-action");
    if (testInfo.project.name === "chromium-desktop") {
      await expect(action).toBeHidden();
      return;
    }
    const link = action.getByRole("link", { name: locale === "ro" ? "Solicită o consultație" : "Получить консультацию" });
    await expect(link).toHaveAttribute("href", `${prefix}/contactus`);
    for (const width of [320, 375, 430]) {
      await page.setViewportSize({ width, height: 812 });
      await expect(link).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const layout = await action.evaluate((element) => {
        const bar = element.querySelector(".mobile-contact-action__bar")!.getBoundingClientRect();
        const button = element.querySelector("a")!.getBoundingClientRect();
        const footerLinks = [...document.querySelectorAll(".footer-bottom a")];
        return {
          fixed: getComputedStyle(element.firstElementChild!).position === "fixed",
          bottom: bar.bottom,
          viewportHeight: innerHeight,
          buttonHeight: button.height,
          footerVisible: footerLinks.every((item) => item.getBoundingClientRect().bottom <= bar.top),
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          buttonWithinViewport: button.left >= 0 && button.right <= innerWidth,
        };
      });
      expect(layout.fixed).toBe(true);
      expect(layout.bottom).toBeCloseTo(layout.viewportHeight, 0);
      expect(layout.buttonHeight).toBeGreaterThanOrEqual(52);
      expect(layout.footerVisible).toBe(true);
      expect(layout.buttonWithinViewport).toBe(true);
      expect(layout.overflow).toBe(false);
    }
    await link.click();
    await expect(page).toHaveURL(`${prefix}/contactus`);
    await expect(action).toHaveCount(0);
    await expect(page.locator("form.application-form")).toBeVisible();
  });

  test(`${locale}: product action transfers the current product to the contact form`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-desktop", "Mobile-only action");
    await page.goto(`${prefix}/product/lord-deodorant`);
    const action = page.locator(".mobile-contact-action");
    await action.getByRole("link").click();
    await expect(page).toHaveURL(`${prefix}/contactus?products=lord-deodorant`);
    await expect(page.locator(".contact-handoff")).toContainText("Deodorant");
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(action).toHaveCount(0);
  });
}

test("mobile action hides during navigation and text entry", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "chromium-desktop", "Mobile-only action");
  await page.goto("/products");
  const action = page.locator(".mobile-contact-action");
  await expect(action).toBeVisible();
  await page.locator(".mobile-menu-button").click();
  await expect(action).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(action).toBeVisible();
  await page.locator(".mobile-filters-toggle").click();
  await page.getByRole("searchbox").focus();
  await expect(action).toBeHidden();
  await page.getByRole("searchbox").blur();
  await expect(action).toBeVisible();
});

test("mobile action is absent from selection and error pages", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "chromium-desktop", "Mobile-only action");
  for (const route of ["/selection", "/missing-page", "/product/not-a-published-product", "/bad-request"]) {
    await page.goto(route);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator(".mobile-contact-action")).toHaveCount(0);
  }
});
