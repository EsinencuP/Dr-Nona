import { describe, expect, it } from "vitest";
import claimsRegistry from "../../src/data/claims-registry.json";
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

  it("keeps sourced product copy visible while the claim remains tracked", () => {
    const product = productBySlug.get("solaris-body-lotion");
    expect(product).toBeDefined();
    expect(getProductCopy(product!, "shortDescription")).toBe(
      product!.shortDescription
    );
    expect(
      isClaimFieldPublishable(
        "product",
        "solaris-body-lotion",
        "longDescription"
      )
    ).toBe(false);
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
