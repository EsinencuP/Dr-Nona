import { describe, expect, it } from "vitest";
import claimsRegistry from "../../src/data/claims-registry.json";
import publicProducts from "../../src/data/products-public.json";
import publicRomanianProducts from "../../src/data/products-ro-public.json";
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
    expect(getProductCopy(product!, "shortDescription")).not.toBe(
      product!.shortDescription
    );
    expect(getProductCopy(product!, "shortDescription")).toContain(
      "ежедневного ухода"
    );
    expect(getProductCopy(product!, "longDescription")).toBe("");
    expect(
      isClaimFieldPublishable(
        "product",
        "solaris-body-lotion",
        "longDescription"
      )
    ).toBe(false);
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

  it("does not expose unreviewed Romanian descriptive fields", async () => {
    const { productBySlug: romanianProducts } = await loadProductData("ro");
    const product = romanianProducts.get("solaris-body-lotion");
    expect(product?.contentLocale).toBe("ro");
    expect(product?.longDescription).toBeNull();
    expect(getProductCopy(product!, "shortDescription")).toContain(
      "îngrijirea zilnică"
    );
  });

  it("keeps a product field without a detected regulated claim", () => {
    const product = productBySlug.get("lord-deodorant");
    expect(product).toBeDefined();
    expect(getProductCopy(product!, "shortDescription")).toBe(
      product!.shortDescription
    );
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
