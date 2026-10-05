import { describe, expect, it } from "vitest";
import claimsRegistry from "../../src/data/claims-registry.json";
import publicProducts from "../../src/data/products-public.json";
import publicRomanianProducts from "../../src/data/products-ro-public.json";
import sourceProducts from "../../src/data/products.json";
import {
  getOfficialPageParagraphs,
  getProductCopy,
  getProductDisclaimer,
  isClaimFieldPublishable,
} from "../../src/claims";
import {
  loadOfficialPageData,
  loadProductData,
} from "../../src/data";

const { productBySlug } = await loadProductData();
const { pageByPath } = await loadOfficialPageData();

describe("regulated claims publication guard", () => {
  it("keeps every current claim explicitly pending until reviewed", () => {
    expect(claimsRegistry.length).toBeGreaterThan(0);
    expect(claimsRegistry.every((claim) => claim.status === "pending")).toBe(
      true
    );
    expect(
      claimsRegistry.every(
        (claim) =>
          claim.reviewer === null &&
          claim.reviewedAt === null &&
          claim.approvalReference === null
      )
    ).toBe(true);
  });

  it("quarantines sourced product copy while its claim remains pending", () => {
    const product = productBySlug.get("solaris-body-lotion");
    expect(product).toBeDefined();
    expect(publicProducts.find(item => item.slug === product!.slug)?.longDescription).toBeNull();
    expect(publicProducts.find(item => item.slug === product!.slug)?.shortDescription).toBeNull();
    expect(getProductCopy(product!, "longDescription")).toBe("");
    expect(
      isClaimFieldPublishable(
        "product",
        "solaris-body-lotion",
        "longDescription"
      )
    ).toBe(false);
    expect(isClaimFieldPublishable("product", "solaris-body-lotion", "shortDescription")).toBe(false);
    expect(claimsRegistry.some(claim => claim.contentId === "solaris-body-lotion" &&
      claim.field === "shortDescription" && claim.claimText.includes("лечебным эффектом"))).toBe(true);
  });

  it("removes pending claim fields from browser-facing product datasets", () => {
    const blocked = claimsRegistry.filter(
      (claim) => claim.scope === "product" && claim.status !== "approved"
    );
    const russian = new Map(publicProducts.map((product) => [product.slug, product]));
    for (const claim of blocked) {
      const romanian = claim.contentId.startsWith("ro:");
      const slug = romanian ? claim.contentId.slice(3) : claim.contentId;
      const record = romanian
        ? publicRomanianProducts[slug as keyof typeof publicRomanianProducts]
        : russian.get(slug);
      expect(record).toBeDefined();
      expect(record?.[claim.field as keyof typeof record]).toBeNull();
    }
  });

  it("quarantines Romanian claim fields independently of editorial approval", async () => {
    const { productBySlug: romanianProducts } = await loadProductData("ro");
    const product = romanianProducts.get("solaris-body-lotion");
    expect(product?.contentLocale).toBe("ro");
    expect(product?.longDescription).toBeNull();
    expect(getProductCopy(product!, "longDescription")).toBe("");
    expect(getProductCopy(product!, "shortDescription")).toContain("Dr. Nona");
  });

  it("keeps a product field without a detected regulated claim", () => {
    const source = sourceProducts.find(item => item.shortDescription &&
      item.shortDescription.length >= 50 && item.shortDescription.length <= 200 &&
      publicProducts.find(publicItem => publicItem.slug === item.slug)?.shortDescription === item.shortDescription);
    expect(source).toBeDefined();
    const product = productBySlug.get(source!.slug);
    expect(product).toBeDefined();
    expect(isClaimFieldPublishable("product", source!.slug, "shortDescription")).toBe(true);
    expect(getProductCopy(product!, "shortDescription")).toBe(source!.shortDescription);
  });

  it("suppresses claim-bearing official paragraphs", () => {
    const page = pageByPath.get("/ourformula");
    expect(page).toBeDefined();
    const publishable = getOfficialPageParagraphs(page!);
    expect(publishable.length).toBeLessThan(page!.paragraphs.length);
    expect(publishable.join(" ")).not.toContain("оздоравливает организм");
  });

  it("provides a neutral consumer disclaimer for supplement content", () => {
    const product = productBySlug.get("gonseen");
    expect(product).toBeDefined();
    const disclaimer = getProductDisclaimer(product!);
    expect(disclaimer?.status).toBe("interim");
    expect(disclaimer?.text).toContain("Не является лекарственным средством");
    expect(disclaimer?.text).not.toContain("Молдовы");
    expect(disclaimer?.text).not.toContain("подтверждения");
  });
});
