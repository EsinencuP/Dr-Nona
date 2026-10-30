import { expect, test } from "@playwright/test";

for (const locale of ["ru", "ro"] as const) {
  const prefix = `/${locale}`;
  const breadcrumbsName = locale === "ro" ? "Fir de navigare" : "Хлебные крошки";
  const relatedName = locale === "ro" ? "Pagini conexe" : "Связанные страницы";

  test(`${locale}: product category and consultation links retain their context`, async ({ page }) => {
    await page.goto(`${prefix}/product/lord-deodorant`);
    const breadcrumbs = page.locator("main .breadcrumbs");
    await expect(breadcrumbs.locator('[aria-current="page"]')).toContainText("Deodorant");
    const categoryLink = breadcrumbs.locator('a[href*="category="]');
    const category = await categoryLink.innerText();
    await categoryLink.click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/products\\?category=`));
    await expect(page.locator('select[name="category"]')).toHaveValue(category);
    await expect(page.locator(".product-card").first()).toBeVisible();
    await expect(page.locator(".catalog-categories button.is-active")).toContainText(category);

    await page.goBack();
    const related = page.getByRole("navigation", { name: relatedName });
    await related.locator('a[href*="contactus?"]').click();
    await expect(page).toHaveURL(`${prefix}/contactus?products=lord-deodorant`);
    await expect(page.locator(".contact-handoff")).toContainText("Deodorant");
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("main")).toContainText("324001");
  });

  test(`${locale}: company, formula and catalogue are connected in both directions`, async ({ page }) => {
    await page.goto(prefix);
    await page.locator('.home-about a[href$="/about"]').click();
    await expect(page).toHaveURL(`${prefix}/about`);
    await page.locator('.about-chapter a[href$="/about/science"]').click();
    await expect(page).toHaveURL(`${prefix}/about/science`);
    await page.locator('.reading-links a[href$="/ourformula"]').click();
    await expect(page).toHaveURL(`${prefix}/ourformula`);
    await page.locator('.reading-links a[href$="/products"]').click();
    await expect(page).toHaveURL(`${prefix}/products`);
    await page.locator('.reading-links a[href$="/ourformula"]').click();
    await expect(page).toHaveURL(`${prefix}/ourformula`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("main .breadcrumbs [aria-current=page]")).toHaveText("Halo Complex™");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });

  test(`${locale}: company breadcrumb returns to the overview`, async ({ page }) => {
    await page.goto(`${prefix}/about/our-history`);
    const breadcrumbs = page.locator("main .breadcrumbs");
    await expect(breadcrumbs).toHaveAttribute("aria-label", breadcrumbsName);
    await breadcrumbs.locator('a[href$="/about"]').click();
    await expect(page).toHaveURL(`${prefix}/about`);
    await expect(page.locator(".about-chapter")).toHaveCount(4);
  });

  test(`${locale}: breadcrumbs remain readable, tappable and keyboard accessible`, async ({ page }) => {
    await page.goto(`${prefix}/product/salts-ylangylang`);
    const breadcrumbs = page.getByRole("navigation", { name: breadcrumbsName });
    await expect(breadcrumbs.getByRole("listitem")).toHaveCount(4);
    await expect(breadcrumbs.locator('[aria-current="page"]')).toHaveText(await page.locator("h1").innerText());
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => document.fonts.ready);
      const layout = await breadcrumbs.evaluate((nav) => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        links: [...nav.querySelectorAll("a")].map((link) => {
          const rect = link.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }),
        itemsWithinViewport: [...nav.querySelectorAll("li")].every((item) => {
          const rect = item.getBoundingClientRect();
          return rect.left >= 0 && rect.right <= innerWidth + 1;
        }),
      }));
      expect(layout.overflow, `${width}px`).toBe(false);
      expect(layout.itemsWithinViewport, `${width}px`).toBe(true);
      expect(layout.links.every((link) => link.width >= 44 && link.height >= 44)).toBe(true);
    }
    const links = breadcrumbs.getByRole("link");
    await links.nth(0).focus();
    await page.keyboard.press("Tab");
    await expect(links.nth(1)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(links.nth(2)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`${prefix}/products\\?category=`));
  });
}
