import { describe, expect, it } from "vitest";
import { loadProductData } from "../../src/data";
import { loadProductDetail } from "../../src/features/product/productDetailData";
import homeProducts from "../../src/data/home-products.json";
import runtime from "../../src/data/runtime-content.json";
import packages from "../../src/data/product-volumes.json";

describe("generated public product projections", () => {
  for (const locale of ["ru", "ro"] as const) {
    it(`${locale}: all PDPs preserve public copy, quarantine and recommendation order`, async () => {
      const catalog = await loadProductData(locale);
      expect(catalog.products).toHaveLength(50);
      for (const product of catalog.products) {
        const sourcePackage = packages.products[product.slug as keyof typeof packages.products];
        expect(product.packageSize, product.slug).toEqual(sourcePackage.packageSize);
        expect(product.packageSize!.quantity).toBeGreaterThan(0);
        expect(sourcePackage.sourceText.trim(), product.slug).not.toBe("");
        const detail = (await loadProductDetail(product.slug))[locale];
        expect(detail.product).toEqual(product);
        expect(detail.related).toEqual(catalog.getRelatedProducts(product));
      }
    });

    it(`${locale}: Home contains only the six existing public selections`, async () => {
      const catalog = await loadProductData(locale);
      expect(homeProducts[locale]).toEqual(runtime.home.productSlugs.map((slug) => catalog.productBySlug.get(slug)));
    });
  }

  it("unknown products preserve the 404 path without importing a catalogue", async () => {
    expect(await loadProductDetail("not-a-published-product")).toEqual({ ru: { product: undefined, related: [] }, ro: { product: undefined, related: [] } });
  });
});
