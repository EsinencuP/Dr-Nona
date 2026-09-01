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

const neutralProductDescriptions: Record<string, string> = {
  "Кремы": "Крем из ассортимента Dr. Nona для ежедневного ухода за кожей.",
  "Напитки": "Напиток из ассортимента Dr. Nona для повседневного рациона.",
  "Пищевые добавки": "Пищевая добавка из ассортимента Dr. Nona для повседневного рациона.",
  "Уход за лицом": "Продукт Dr. Nona для ежедневного ухода за кожей лица.",
  "Уход за телом": "Продукт Dr. Nona для ежедневного ухода за кожей тела.",
  "Уход за руками": "Продукт Dr. Nona для ежедневного ухода за руками и ногтями.",
  "Фитокомплексы": "Травяной напиток Dr. Nona в удобных индивидуальных пакетиках.",
  "Гигиена": "Компактный продукт Dr. Nona для ежедневного очищения кожи.",
  "Дезодоранты": "Дезодорант-антиперспирант Dr. Nona для ежедневного использования.",
  "Парфюмерия": "Аромат из международной парфюмерной коллекции Dr. Nona.",
  "Creme": "Cremă din gama Dr. Nona pentru îngrijirea zilnică a pielii.",
  "Băuturi": "Băutură din gama Dr. Nona pentru consumul de zi cu zi.",
  "Suplimente alimentare": "Supliment alimentar din gama Dr. Nona pentru consumul de zi cu zi.",
  "Îngrijirea feței": "Produs Dr. Nona pentru îngrijirea zilnică a pielii feței.",
  "Îngrijirea corpului": "Produs Dr. Nona pentru îngrijirea zilnică a pielii corpului.",
  "Îngrijirea mâinilor": "Produs Dr. Nona pentru îngrijirea zilnică a mâinilor și unghiilor.",
  "Fitocomplexe": "Băutură Dr. Nona din plante, ambalată în plicuri individuale.",
  "Igienă": "Produs compact Dr. Nona pentru curățarea zilnică a pielii.",
  "Deodorante": "Deodorant antiperspirant Dr. Nona pentru utilizare zilnică.",
  "Parfumerie": "Parfum din colecția internațională Dr. Nona.",
};

const unsafeEditorialPatterns = [
  /(?:^|\s)(?:твой|твоя|твои|тебя|попробуй)(?:\s|[,.!?]|$)/iu,
  /!!+/u,
  /Преимущества:\s*\./iu,
  /Dr\.\s*Nona—/iu,
  /пртивоспалитель/iu,
  /мыщц/iu,
  /^[,;:.]/u,
];

function normalizedProductCopy(value: string | null) {
  return (value ?? "").replace(/\s+/gu, " ").trim();
}

function isEditoriallySafe(
  field: "shortDescription" | "longDescription" | "ingredients" | "howToUse",
  value: string
) {
  if (!value || unsafeEditorialPatterns.some((pattern) => pattern.test(value))) {
    return false;
  }
  if (field === "shortDescription") return value.length >= 50 && value.length <= 200;
  if (field === "longDescription") return value.length >= 200 && value.length <= 800;
  return true;
}

function claimContentId(product: Product) {
  return product.contentLocale === "ro" ? `ro:${product.slug}` : product.slug;
}

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
  field: "shortDescription" | "longDescription" | "ingredients" | "howToUse"
) {
  const value = normalizedProductCopy(product[field]);
  const publishable = isClaimFieldPublishable(
    "product",
    claimContentId(product),
    field
  );
  if (publishable && isEditoriallySafe(field, value)) return value;
  return field === "shortDescription"
    ? neutralProductDescriptions[product.category] ??
        (product.contentLocale === "ro"
          ? "Produs Dr. Nona pentru îngrijirea zilnică."
          : "Продукт Dr. Nona для ежедневного ухода.")
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

export function getProductDisclaimer(product: Product, locale: "ru" | "ro" = "ru") {
  const disclaimer = productDisclaimers.find(
    (disclaimer) =>
      disclaimer.market === "MD" &&
      disclaimer.appliesToCategory === product.category
  );
  if (locale === "ro" && disclaimer?.status !== "approved") return undefined;
  return disclaimer;
}
