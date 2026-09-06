import { expect, test } from "@playwright/test";

for (const locale of ["ru", "ro"]) {
  test(`${locale}: product identity and save action precede detailed reading`, async ({ page }) => {
    test.setTimeout(90_000);
    for (const slug of ["solaris-body-lotion", "dynamic-hydrating-cream", "gonseen", "okseen", "reumoseen", "salts-ylangylang"]) {
      for (const viewport of [{ width: 375, height: 812 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
        await page.setViewportSize(viewport);
        await page.goto(`/${locale}/product/${slug}`);
        await expect(page.locator(".product-select-button")).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const geometry = await page.evaluate(() => {
          const title = document.querySelector("h1")!;
          const action = document.querySelector(".product-select-button")!;
          const summary = document.querySelector(".product-summary")!;
          return { titleTop: title.getBoundingClientRect().top, actionBottom: action.getBoundingClientRect().bottom,
            actionBeforeSummary: Boolean(action.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING),
            overflow: document.documentElement.scrollWidth > innerWidth };
        });
        expect(geometry.titleTop).toBeLessThan(240);
        expect(geometry.actionBottom).toBeLessThanOrEqual(viewport.height + 2);
        expect(geometry.actionBeforeSummary).toBe(true);
        expect(geometry.overflow).toBe(false);
        await page.locator(".product-select-button").click();
        await expect(page.locator(".product-select-button")).toHaveAttribute("aria-pressed", "true");
        await page.locator(".product-select-button").click();
      }
    }
  });

  test(`${locale}: hero media is separate from copy and benefits`, async ({ page }) => {
    for (const width of [320, 375, 430, 768, 1024, 1440, 1920, 2048, 844]) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 900 });
      await page.goto(`/${locale}`);
      await expect(page.locator(".hero-visual")).toBeVisible();
      const state = await page.evaluate(() => {
        const media = document.querySelector(".hero-visual")!;
        const m = media.getBoundingClientRect(), c = document.querySelector(".hero-copy")!.getBoundingClientRect(), r = document.querySelector(".hero-benefits")!.getBoundingClientRect();
        const overlappingCopy = Math.min(m.right, c.right) - Math.max(m.left, c.left) > 1 && Math.min(m.bottom, c.bottom) - Math.max(m.top, c.top) > 1;
        return { overlappingCopy, gap: r.top - m.bottom, masked: getComputedStyle(media).backgroundImage.includes("gradient"), overflow: document.documentElement.scrollWidth > innerWidth };
      });
      expect(state.overlappingCopy).toBe(false);
      expect(state.gap).toBeGreaterThanOrEqual(16);
      expect(state.masked).toBe(false);
      expect(state.overflow).toBe(false);
    }
  });
}
