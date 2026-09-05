import { expect, test } from "@playwright/test";

for (const locale of ["ru", "ro"]) {
  test(`${locale}: an unrelated long catalogue title does not inflate the first row`, async ({ page }) => {
    await page.goto(`/${locale}/products`);
    await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50);
    await page.evaluate(() => document.fonts.ready);
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const cards = page.locator(".catalog-grid .product-card");
      await cards.last().scrollIntoViewIfNeeded();
      const before = await cards.first().boundingBox();
      const title = cards.last().locator("h2 a");
      const original = await title.textContent();
      await title.evaluate((element) => {
        element.textContent = "Diagnostic long product identity ".repeat(8);
      });
      const after = await cards.first().boundingBox();
      expect(before).not.toBeNull();
      expect(after).not.toBeNull();
      expect(Math.abs(after!.height - before!.height)).toBeLessThanOrEqual(1);
      await title.evaluate((element, value) => { element.textContent = value; }, original);
    }
  });

  test(`${locale}: selection handoff sits beside a bounded desktop list and follows it on mobile`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await page.evaluate(() => localStorage.setItem("drnona-selection", JSON.stringify([
      "salts-ylangylang", "salts-rosemary", "salts-camomile", "salts-lavander", "ard-complex",
    ])));
    await page.goto(`/${locale}/selection`);
    await expect(page.locator(".selection-list article")).toHaveCount(5);
    for (const width of [320, 768, 1024, 1440, 2048]) {
      await page.setViewportSize({ width, height: 900 });
      const list = await page.locator(".selection-list").boundingBox();
      const handoff = await page.locator(".selection-contact").boundingBox();
      expect(list).not.toBeNull();
      expect(handoff).not.toBeNull();
      if (width > 1180) {
        expect(list!.width).toBeLessThanOrEqual(1020);
        expect(handoff!.x).toBeGreaterThanOrEqual(list!.x + list!.width + 24);
        expect(Math.abs(handoff!.y - list!.y)).toBeLessThanOrEqual(1);
      } else {
        expect(handoff!.y).toBeGreaterThanOrEqual(list!.y + list!.height);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });

  test(`${locale}: contact intro precedes full-width modes and fields`, async ({ page }) => {
    await page.goto(`/${locale}/contactus`);
    await expect(page.locator(".application-form")).toBeVisible();
    for (const width of [320, 768, 1024, 1440, 2048]) {
      await page.setViewportSize({ width, height: 900 });
      const heading = await page.locator(".application-panel__heading").boundingBox();
      const modes = await page.locator(".application-mode").boundingBox();
      const form = await page.locator(".application-form").boundingBox();
      expect(heading).not.toBeNull();
      expect(modes).not.toBeNull();
      expect(form).not.toBeNull();
      expect(modes!.y).toBeGreaterThanOrEqual(heading!.y + heading!.height);
      expect(form!.y).toBeGreaterThanOrEqual(modes!.y + modes!.height);
      expect(Math.abs(form!.x - modes!.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(form!.width - modes!.width)).toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}
