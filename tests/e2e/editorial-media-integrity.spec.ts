import { expect, test } from "@playwright/test";

const widths = [320, 375, 430, 768, 1024, 1440, 1920, 2048, 844];

// Deterministic image geometry; live official assets are reviewed separately.
test.beforeEach(async ({ page }) => {
  await page.route("https://res.cloudinary.com/**", async (route) => {
    const height = route.request().url().includes("/pages/") ? 1024 : 384;
    await route.fulfill({ contentType: "image/svg+xml", body: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="${height}"><rect width="100%" height="100%" fill="#d1e6e7"/><text x="0" y="24">START</text><text x="1024" y="${height}" text-anchor="end">END</text></svg>` });
  });
});

for (const locale of ["ru", "ro"]) {
  test(`${locale}: editorial artwork and labels preserve the full image`, async ({ page }) => {
    await page.goto(`/${locale}/editorial`);
    await expect(page.locator(".article-card").first()).toBeVisible();
    await expect(page.locator("main")).not.toContainText("Shop Dr. Nona International");
    const artwork = page.locator(".article-card--artwork").first();
    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 900 });
      await expect(artwork.locator("img")).toHaveCSS("object-fit", "contain");
      expect(await artwork.locator("img").getAttribute("src")).not.toContain("c_fill");
      const media = await artwork.locator(".article-card__visual").boundingBox();
      const label = await artwork.locator(".article-card__kind").boundingBox();
      expect(label!.y).toBeGreaterThanOrEqual(media!.y + media!.height);
      const photo = page.locator(".article-card--photo").first();
      const photoMedia = await photo.locator(".article-card__visual").boundingBox();
      const photoBody = await photo.locator(".article-card__body").boundingBox();
      const overlap = Math.min(photoMedia!.x + photoMedia!.width, photoBody!.x + photoBody!.width) - Math.max(photoMedia!.x, photoBody!.x);
      if (width <= 640) expect(overlap).toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
    await artwork.hover();
    await expect(artwork.locator("img")).toHaveCSS("transform", "none");
    await expect(artwork.locator("h3")).toHaveAttribute("lang", "ru");
    await expect(artwork.locator(".text-link")).toContainText(locale === "ro" ? "Citește" : "Читать");
  });

  test(`${locale}: article artwork retains its original aspect ratio and language`, async ({ page }) => {
    await page.goto(`/${locale}/news/zoom-08-07-2026`);
    const hero = page.locator(".article-page__hero");
    await expect(hero).toBeVisible();
    await expect(page.locator("h1")).toHaveAttribute("lang", "ru");
    await expect(page.locator("main")).not.toContainText("Shop Dr. Nona International");
    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 900 });
      const dimensions = await hero.evaluate((image: HTMLImageElement) => ({ rendered: image.clientWidth / image.clientHeight, source: image.naturalWidth / image.naturalHeight }));
      expect(dimensions.rendered).toBeCloseTo(dimensions.source, 1);
    }
  });

  test(`${locale}: About portraits have a complete frame at each breakpoint`, async ({ page }) => {
    await page.goto(`/${locale}/about`);
    await expect(page.locator(".about-chapter--portrait")).toHaveCount(3);
    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 900 });
      for (const image of await page.locator(".about-chapter--portrait img").all()) {
        await expect(image).toHaveCSS("object-fit", "contain");
        expect((await image.boundingBox())!.height).toBeGreaterThanOrEqual(200);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
    const portrait = page.locator(".about-chapter--portrait").first();
    await portrait.hover();
    await expect(portrait.locator("img")).toHaveCSS("transform", "none");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(portrait.locator("img")).toHaveCSS("transform", "none");
  });
}
