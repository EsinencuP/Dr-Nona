import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const products = JSON.parse(readFileSync(new URL("../../src/data/products-public.json", import.meta.url), "utf8")) as Array<{ slug: string }>;

const widths = [320, 375, 430, 641, 768, 960, 961, 1024, 1180, 1440, 1920, 844];

test("tablet packshots select enough pixels for their optical scale", async ({ browser }) => {
  for (const deviceScaleFactor of [1, 2]) {
    const context = await browser.newContext({ viewport: { width: 960, height: 900 }, deviceScaleFactor, reducedMotion: "reduce" });
    const page = await context.newPage();
    try {
      await page.goto("/ru/products");
      const image = page.locator('.catalog-grid a[href$="/product/dynamic-hydrating-cream"] img');
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((element: HTMLImageElement) => element.decode());
      const resolution = await image.evaluate((element: HTMLImageElement) => {
        const box = element.getBoundingClientRect();
        return { required: Math.min(box.width, box.height) * devicePixelRatio, available: Number(element.currentSrc.match(/-(\d+)\.(?:avif|webp)/)?.[1]) };
      });
      expect(resolution.available).toBeGreaterThanOrEqual(resolution.required - 1);
    } finally {
      await context.close();
    }
  }
});

for (const locale of ["ru", "ro"] as const) {
  test(`${locale}: About reading text and facts remain complete on mobile`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}/about`);
    const paragraphs = page.locator(".about-overview__statement p, .about-chapters__heading > p");
    await expect(paragraphs).toHaveCount(2);
    await page.evaluate(() => document.fonts.ready);
    for (const width of [320, 375, 430, 641, 768, 960, 1024, 1180, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      for (const paragraph of await paragraphs.all()) {
        await expect(paragraph).toHaveCSS("-webkit-line-clamp", "none");
        const overflow = await paragraph.evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const text = range.getBoundingClientRect(), box = element.getBoundingClientRect();
          return text.right > box.right + 1 || text.bottom > box.bottom + 1;
        });
        expect(overflow).toBe(false);
      }
      const croppedFacts = await page.locator(".about-facts dt, .about-facts dd").evaluateAll((elements) => elements.filter((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const text = range.getBoundingClientRect(), box = element.parentElement!.getBoundingClientRect();
        return text.left < box.left - 1 || text.right > box.right + 1 || text.bottom > box.bottom + 1;
      }).map((element) => element.textContent));
      expect(croppedFacts).toEqual([]);
      if (width <= 430) {
        const labelStarts = await page.locator(".about-facts dd").evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().left));
        expect(Math.max(...labelStarts) - Math.min(...labelStarts)).toBeLessThanOrEqual(1);
        for (const value of await page.locator(".about-facts dt").all()) await expect(value).toHaveCSS("white-space", "nowrap");
      } else if (width > 640) {
        const labelTops = await page.locator(".about-facts dd").evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().top));
        expect(Math.max(...labelTops) - Math.min(...labelTops)).toBeLessThanOrEqual(1);
      }
    }
  });

  test(`${locale}: home mini product titles support long names and user text spacing`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}`);
    const headings = page.locator(".home-product-mini h3");
    await expect(headings).toHaveCount(2);
    const name = locale === "ru"
      ? "Диагностическое длинное название набора средств для ежедневного ухода за кожей"
      : "Denumire diagnostică lungă a colecției de produse pentru îngrijirea zilnică a pielii";
    await headings.evaluateAll((elements, text) => elements.forEach((element) => { element.textContent = text; }), name);
    await page.addStyleTag({ content: ".home-product-mini h3 { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }" });
    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 900 });
      for (const heading of await headings.all()) {
        await heading.scrollIntoViewIfNeeded();
        await expect(heading).toHaveCSS("-webkit-line-clamp", "none");
        const fit = await heading.evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const text = range.getBoundingClientRect(), box = element.getBoundingClientRect();
          const action = element.parentElement!.querySelector(".text-link")!.getBoundingClientRect();
          return text.right <= box.right + 1 && text.bottom <= box.bottom + 1 && text.bottom <= action.top + 1;
        });
        expect(fit).toBe(true);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
  });

  test(`${locale}: all 50 PDPs keep identity, media and action separate across the matrix`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(products).toHaveLength(50);
    for (const product of products) {
      await page.goto(`/${locale}/product/${product.slug}`);
      await expect(page.locator(".product-select-button")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      for (const width of widths) {
        await page.setViewportSize({ width, height: width === 844 ? 390 : 900 });
        await page.locator(".product-stage img").evaluate((element: HTMLImageElement) => element.decode());
        const state = await page.evaluate(() => {
          const title = document.querySelector("h1")!, image = document.querySelector<HTMLImageElement>(".product-stage img")!;
          const stage = document.querySelector(".product-stage")!.getBoundingClientRect();
          const action = document.querySelector(".product-select-button")!.getBoundingClientRect();
          const identity = title.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(title);
          const text = range.getBoundingClientRect();
          const overlap = (a: DOMRect, b: DOMRect) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            titleOverflow: text.left < identity.left - 1 || text.right > identity.right + 1,
            overlap: overlap(stage, action) || overlap(stage, identity),
            loaded: image.naturalWidth > 0 && image.naturalHeight > 0,
            contain: getComputedStyle(image).objectFit === "contain",
            clamp: getComputedStyle(title).webkitLineClamp,
          };
        });
        expect(state, `${locale}/${product.slug} at ${width}px`).toEqual({ overflow: false, titleOverflow: false, overlap: false, loaded: true, contain: true, clamp: "none" });
      }
    }
  });
}
