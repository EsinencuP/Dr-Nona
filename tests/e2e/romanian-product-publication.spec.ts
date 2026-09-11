import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import products from "../../src/data/products-ro.json" with { type: "json" };
import { join } from "node:path";

test("all 50 Romanian PDPs publish complete copy, localized SEO and resilient geometry", async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const mobile = testInfo.project.name === "chromium-mobile";
  await page.setViewportSize({ width: mobile ? 320 : 1440, height: mobile ? 800 : 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [slug, product] of Object.entries(products)) {
    await page.goto(`/ro/product/${slug}`);
    await expect(page.locator("html")).toHaveAttribute("lang", "ro");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(product.officialName);
    await expect(page.locator(".product-page")).toBeVisible();
    for (const [heading, value] of [["Compoziție", product.ingredients], ["Mod de utilizare", product.howToUse]]) {
      const article = page.locator(".product-copy-card").filter({ has: page.getByRole("heading", { level: 3, name: heading, exact: true }) });
      await expect(article.locator("p"), `${slug}: ${heading}`).toHaveText(value);
    }
    expect(await page.locator("body").innerText(), slug).not.toMatch(/[А-Яа-яЁё]/u);
    await expect(page).toHaveTitle(new RegExp(product.officialName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", new RegExp(product.officialName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/ro/product/${slug}$`));
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "ro_MD");
    const geometry = await page.evaluate(() => {
      const h1 = document.querySelector("h1")!;
      const rect = h1.getBoundingClientRect();
      return { overflow: document.documentElement.scrollWidth - innerWidth, headingOverflow: h1.scrollWidth - h1.clientWidth, headingLeft: rect.left, headingRight: rect.right, width: innerWidth };
    });
    expect(geometry.overflow, slug).toBeLessThanOrEqual(1);
    expect(geometry.headingOverflow, slug).toBeLessThanOrEqual(1);
    expect(geometry.headingLeft, slug).toBeGreaterThanOrEqual(0);
    expect(geometry.headingRight, slug).toBeLessThanOrEqual(geometry.width + 1);
    if (["dynamic-hydrating-cream", "salts-ylangylang", "parfum-faya"].includes(slug)) {
      await page.screenshot({ path: join("artifacts/locale-2026-09-10", `${slug}-${mobile ? "320" : "1440"}.png`), fullPage: true });
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(axe.violations, slug).toEqual([]);
    }
  }
});
