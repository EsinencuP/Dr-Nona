import disclaimersJson from "./data/product-disclaimers.json";
import runtimeContentJson from "./data/runtime-content.json";
import type { OfficialPage, Product } from "./data";

export type ClaimStatus = "approved" | "rejected" | "pending";
export type ClaimScope = "product" | "official-page" | "formula";
export type ClaimType = "medical" | "therapeutic" | "health" | "cosmetic";

export type ClaimRecord = {
  id: string;
  fingerprint: string;
  scope: ClaimScope;
  contentId: string;
  field: string;
  claimText: string;
  claimType: ClaimType;
  detectionReasons: string[];
  sourceUrl: string;
  sourceLastmod: string;
  market: "MD";
  status: ClaimStatus;
  reviewer: string | null;
  reviewedAt: string | null;
  approvalReference: string | null;
  notes: string;
};

type ProductDisclaimer = {
  id: string;
  market: "MD";
  appliesToCategory: string;
  status: "interim" | "approved";
  reviewer: string | null;
  reviewedAt: string | null;
  approvalReference: string | null;
  title: string;
  text: string;
  sourceUrls: string[];
};

export const productDisclaimers = disclaimersJson as ProductDisclaimer[];

const runtimeClaims = runtimeContentJson.claims as {
  fieldPublishability: Record<string, boolean>;
  blockedContent: string[];
  blockedScopes: string[];
};
const blockedContent = new Set(runtimeClaims.blockedContent);
const blockedScopes = new Set(runtimeClaims.blockedScopes);

export function isClaimFieldPublishable(
  scope: ClaimScope,
  contentId: string,
  field: string
) {
  return (
    runtimeClaims.fieldPublishability[
      `${scope}\u001f${contentId}\u001f${field}`
    ] ?? true
  );
}

export function hasBlockedClaims(scope: ClaimScope, contentId?: string) {
  return contentId
    ? blockedContent.has(`${scope}\u001f${contentId}`)
    : blockedScopes.has(scope);
}

export function getProductCopy(
  product: Product,
  field: "shortDescription" | "longDescription"
) {
  const value = product[field];
  return value && isClaimFieldPublishable("product", product.slug, field)
    ? value
    : "";
}

export function getOfficialPageDescription(page: OfficialPage) {
  return isClaimFieldPublishable("official-page", page.path, "description")
    ? page.description
    : "";
}

export function getOfficialPageParagraphs(page: OfficialPage) {
  return page.paragraphs.filter((_, index) =>
    isClaimFieldPublishable(
      "official-page",
      page.path,
      `paragraphs.${index}`
    )
  );
}

export function getProductDisclaimer(product: Product) {
  return productDisclaimers.find(
    (disclaimer) =>
      disclaimer.market === "MD" &&
      disclaimer.appliesToCategory === product.category
  );
}
