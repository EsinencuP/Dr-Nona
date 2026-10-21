import { expect, test } from "@playwright/test";

const widths = [320, 375, 430, 768, 1024, 1440, 1920, 2048, 844];

for (const locale of ["ru", "ro"]) {
  test(`${locale}: home and navigation do not expose retired editorial sections`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".editorial-preview, .article-card")).toHaveCount(0);
    await expect(page.locator('a[href*="/editorial"], a[href*="/blog"], a[href*="/news"]')).toHaveCount(0);
    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
  });

  test(`${locale}: a retired article exposes no artwork or public content`, async ({ page }) => {
    await page.goto(`/${locale}/news/zoom-08-07-2026`);
    await expect(page.getByRole("heading", { level: 1, name: locale === "ro" ? "Această pagină a dispărut din orizont" : "Эта страница ушла за горизонт" })).toBeVisible();
    await expect(page.locator(".article-page, .article-page__hero")).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
  });

  test(`${locale}: About uses compact text cards and one local founders photo`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}/about`);
    await expect(page.locator(".about-chapter")).toHaveCount(4);
    await expect(page.locator("main img")).toHaveCount(0);
    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 900 });
      for (const card of await page.locator(".about-chapter").all()) {
        const size = (await card.boundingBox())!;
        expect(size.height).toBeLessThan(340);
        await expect(card.getByRole("heading", { level: 2 })).toBeVisible();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
    const targets = await page.locator(".about-chapter > a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(targets).toEqual(["company", "our-history", "founders", "science"].map((path) => `/${locale}/about/${path}`));
    for (const path of ["company", "our-history", "founders", "science"]) {
      await page.goto(`/${locale}/about/${path}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('main a[href^="http"], main img[src^="http"]')).toHaveCount(0);
      await expect(page.locator("main")).not.toContainText(/По данным международного сайта|на официальном сайте|site-ul oficial/iu);
      await expect(page.locator("main img")).toHaveCount(path === "founders" ? 1 : 0);
      if (path === "founders") {
        const photo = page.locator(".about-founders-photo img");
        await expect(photo).toHaveAttribute("src", "/brand/about/founders.jpg");
        await photo.evaluate((image: HTMLImageElement) => image.decode());
        for (const width of [320, 768, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
          expect((await photo.boundingBox())!.width).toBeLessThanOrEqual(300);
          expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
        }
      }
    }
  });
}
