import { expect, test } from "@playwright/test";

for (const locale of ["ru", "ro"]) {
  test(`${locale}: full product information precedes the save action`, async ({ page }) => {
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
          const knowledge = document.querySelector(".product-knowledge__content")!;
          const cards = [...knowledge.querySelectorAll(".product-copy-card")];
          return { titleTop: title.getBoundingClientRect().top,
            actionAfterKnowledge: Boolean(knowledge.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING),
            actionBelowKnowledge: action.getBoundingClientRect().top >= knowledge.getBoundingClientRect().bottom,
            cardsBeforeAction: cards.every((card) => card.getBoundingClientRect().bottom <= action.getBoundingClientRect().top),
            duplicateBlocks: document.querySelectorAll(".product-purpose, .product-summary, .product-highlights, .product-knowledge__intro").length,
            overflow: document.documentElement.scrollWidth > innerWidth };
        });
        expect(geometry.titleTop).toBeLessThan(240);
        expect(geometry.actionAfterKnowledge).toBe(true);
        expect(geometry.actionBelowKnowledge).toBe(true);
        expect(geometry.cardsBeforeAction).toBe(true);
        expect(geometry.duplicateBlocks).toBe(0);
        expect(geometry.overflow).toBe(false);
        await page.locator(".product-select-button").click();
        await expect(page.locator(".product-select-button")).toHaveAttribute("aria-pressed", "true");
        await page.locator(".product-select-button").click();
      }
    }
  });

  test(`${locale}: hero image fills the background behind readable copy and benefits`, async ({ page }) => {
    for (const width of [320, 375, 430, 768, 1024, 1440, 1920, 2048, 844]) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 900 });
      await page.goto(`/${locale}`);
      await expect(page.locator(".hero-visual")).toBeVisible();
      const state = await page.evaluate(() => {
        const media = document.querySelector(".hero-visual")!;
        const m = media.getBoundingClientRect();
        const hero = document.querySelector(".home-hero")!.getBoundingClientRect();
        const copy = document.querySelector(".hero-copy")!;
        const c = copy.getBoundingClientRect();
        const benefits = document.querySelector(".hero-benefits")!.getBoundingClientRect();
        const textBounds = [...copy.querySelectorAll("h1, p")].map((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          return range.getBoundingClientRect();
        });
        return {
          coversHero: Math.abs(m.left - hero.left) <= 1 && Math.abs(m.right - hero.right) <= 1
            && Math.abs(m.top - hero.top) <= 1 && Math.abs(m.bottom - hero.bottom) <= 1,
          copyAboveBenefits: c.bottom <= benefits.top,
          textFits: textBounds.every((bounds) => bounds.left >= c.left - 1 && bounds.right <= c.right + 1 && bounds.bottom <= c.bottom + 1),
          overlay: getComputedStyle(media, "::after").backgroundImage.includes("linear-gradient"),
          copyInFront: Number(getComputedStyle(copy).zIndex) > Number(getComputedStyle(media).zIndex),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      expect(state.coversHero).toBe(true);
      expect(state.copyAboveBenefits).toBe(true);
      expect(state.textFits).toBe(true);
      expect(state.overlay).toBe(true);
      expect(state.copyInFront).toBe(true);
      expect(state.overflow).toBe(false);
    }
  });
}
