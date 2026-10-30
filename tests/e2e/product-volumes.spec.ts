import { expect, test } from "@playwright/test";

for (const locale of ["ru", "ro"]) {
  test(`${locale}: every card shows its verified package size opposite the category`, async ({ page }) => {
    await page.goto(`/${locale}/products`);
    await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50);
    await expect(page.locator(".catalog-grid .product-card__volume")).toHaveCount(50);
    await page.addStyleTag({ content: ".catalog-grid .product-card { content-visibility: visible !important; }" });
    for (const [name, volume] of [["Solaris Body Lotion", 250], ["Hand and Nail Cream", 50], ["Dynamic Cream", 50], ["IMUNSEEN", 125]] as const) {
      const card = page.locator(".catalog-grid .product-card").filter({ has: page.getByRole("heading", { name, exact: true }) });
      const label = card.locator(".product-card__volume");
      await expect(label).toHaveText(`${volume} ${locale === "ru" ? "мл" : "ml"}`);
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await label.scrollIntoViewIfNeeded();
        const row = await card.locator(".product-card__meta").evaluate((element) => {
          const category = element.firstElementChild!.getBoundingClientRect();
          const volume = element.lastElementChild!.getBoundingClientRect();
          const bounds = element.getBoundingClientRect();
          return { separated: category.right <= volume.left, contained: volume.right <= bounds.right + 1, complete: element.scrollWidth <= element.clientWidth + 1 };
        });
        expect(row, `${name}, ${width}px`).toEqual({ separated: true, contained: true, complete: true });
      }
    }
    const dryPackages = [
      ["Top Samples Kit", "8 проб.", "8 mostre"],
      ["Gonseen Tea", "24 пак.", "24 plicuri"],
      ["OKSEEN", "60 caps", "60 caps"],
      ["RAVSEEN", "100 caps", "100 caps"],
      ["DND", "60 шт.", "60 buc."],
      ["Compressed Wipes", "15 шт.", "15 buc."],
      ["Mineral Lipstick", "4 г", "4 g"],
      ["Slimseen Coffee Mix", "250 г", "250 g"],
      ["Chocoseen", "250 г", "250 g"],
      ["Soupseen", "300 г", "300 g"],
      ["Bath Salts with Camomile extract", "300 г", "300 g"],
    ];
    for (const [name, ru, ro] of dryPackages) {
      const card = page.locator(".catalog-grid .product-card").filter({ has: page.getByRole("heading", { name, exact: true }) });
      await expect(card.locator(".product-card__volume")).toHaveText(locale === "ru" ? ru : ro);
    }
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const collisions = await page.locator(".catalog-grid .product-card__meta").evaluateAll((rows) => rows.filter((row) => {
        const category = row.firstElementChild!.getBoundingClientRect();
        const size = row.lastElementChild!.getBoundingClientRect();
        return category.right > size.left + 1 || size.right > row.getBoundingClientRect().right + 1 || row.scrollWidth > row.clientWidth + 1;
      }).map((row) => row.textContent));
      expect(collisions, `${locale}, ${width}px`).toEqual([]);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
