import { describe, expect, test } from "vitest";
import { loadProductData, type Product } from "../../src/data";
import {
  buildConsultationEmail,
  buildConsultationPath,
  buildConsultationText,
  resolveSelectionProducts,
} from "../../src/features/contact/consultation";

const { products } = await loadProductData();

function productFixture(overrides: Partial<Product>): Product {
  return { ...products[0], ...overrides };
}

const first = productFixture({
  slug: "night-cream",
  officialName: "Night Cream",
  sku: "NC-01",
});
const second = productFixture({
  slug: "body-lotion",
  officialName: "Body Lotion",
  sku: "BL-02",
});

describe("consultation handoff", () => {
  test("serializes product names, SKUs and public URLs", () => {
    const text = buildConsultationText([first, second]);
    expect(text).toContain("Night Cream");
    expect(text).toContain("Артикул: NC-01");
    expect(text).toContain("/product/night-cream");
    expect(text).toContain("Body Lotion");
  });

  test("deduplicates selection slugs and ignores unknown products", () => {
    const map = new Map([
      [first.slug, first],
      [second.slug, second],
    ]);
    expect(
      resolveSelectionProducts(
        ["night-cream", "night-cream", "missing", "body-lotion"],
        map
      ).map(({ slug }) => slug)
    ).toEqual(["night-cream", "body-lotion"]);
  });

  test("keeps the same product context in contact and email transports", () => {
    const path = buildConsultationPath([first, second]);
    const email = decodeURIComponent(buildConsultationEmail([first, second]));
    expect(path).toBe("/contactus?products=night-cream%2Cbody-lotion");
    expect(email).toContain("Night Cream");
    expect(email).toContain("NC-01");
    expect(email).toContain("2 поз.");
  });

  test("builds Romanian consultation copy and localized product URLs", () => {
    const text = buildConsultationText([first], "ro");
    const email = decodeURIComponent(buildConsultationEmail([first], "ro"));

    expect(text).toContain("Bună ziua!");
    expect(text).toContain("Cod produs: NC-01");
    expect(text).toContain("/ro/product/night-cream");
    expect(email).toContain("Consultație pentru selecția Dr. Nona");
  });
});
