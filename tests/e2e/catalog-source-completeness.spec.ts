import { expect, test } from "@playwright/test";
import products from "../../src/data/products.json" with { type: "json" };
import romanian from "../../src/data/products-ro.json" with { type: "json" };

for (const locale of ["ru", "ro"] as const) {
  test(`${locale}: every source block is rendered in order without clipping`, async ({ page }) => {
    test.setTimeout(240_000);
    for (const product of products) {
      const source = locale === "ro" ? romanian[product.slug as keyof typeof romanian] : product;
      await page.goto(`/${locale}/product/${product.slug}`);
      const full = page.getByTestId("full-product-description");
      await expect(full).toBeVisible();
      const actual = await full.locator("[data-source-block]").evaluateAll(nodes => nodes.flatMap(node =>
        node.matches("ul,ol") ? [...node.querySelectorAll("li")].map(li => li.textContent ?? "") : [node.textContent ?? ""]));
      const expected = source.sourceBlocks.flatMap(block => "items" in block ? block.items : [block.text]);
      expect(actual, `${locale}:${product.slug}: complete ordered source text`).toEqual(expected);
      const geometry = await full.evaluate(element => {
        const styles = [element, ...element.querySelectorAll("*")].map(node => getComputedStyle(node));
        return {
          overflow: document.documentElement.scrollWidth - innerWidth,
          copyWidth: element.getBoundingClientRect().width,
          clipped: styles.some(style => style.webkitLineClamp !== "none" && style.webkitLineClamp !== "" || style.textOverflow === "ellipsis" || style.maxHeight !== "none" || style.overflowY === "hidden"),
        };
      });
      expect(geometry.overflow, product.slug).toBeLessThanOrEqual(1);
      expect(geometry.clipped, product.slug).toBe(false);
      expect(geometry.copyWidth, `${product.slug}: readable text measure`).toBeGreaterThan(200);
    }
  });
}
