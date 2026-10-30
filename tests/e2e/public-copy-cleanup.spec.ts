import { expect, test } from "@playwright/test";

for (const locale of ["ru", "ro"]) {
  test(`${locale}: public pages retain headings and actions without decorative overlines or draft notices`, async ({ page }) => {
    const paths = ["", "/products", "/product/solaris-body-lotion", "/ourformula", "/about", "/about/company", "/about/our-history", "/about/founders", "/about/science", "/selection", "/contactus", "/certificates"];
    for (const path of paths) {
      await page.goto(`/${locale}${path}`);
      await expect(page.locator("main h1"), path || "home").toHaveCount(1);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator(".eyebrow, .catalog-popularity-note, .product-info__kicker, .product-stage__caption")).toHaveCount(0);
      await expect(page.locator("main")).not.toContainText(/Информация пока не опубликована|Informațiile nu sunt publicate încă|Документы для Молдовы пока не опубликованы|Nu sunt publicate documente pentru Moldova|Данных о заказах пока недостаточно|Datele despre comenzi sunt încă insuficiente|представлен в каталоге Dr. Nona|este prezentat în catalogul Dr. Nona/u);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
    }
    await expect(page.getByRole("link", { name: locale === "ro" ? "Solicită documentele" : "Запросить документы" })).toHaveAttribute("href", `/${locale}/contactus`);
  });
}
