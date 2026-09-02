import type { Product } from "../../data";

type Locale = "ru" | "ro";

type ProductOverviewInput = Pick<Product, "officialName" | "category"> & {
  longDescription: string;
  ingredients: string;
  howToUse: string;
};

function clean(value: string) {
  return value.replace(/\s+/gu, " ").trim();
}

export function summarizeProductField(value: string, maxLength = 176) {
  const normalized = clean(value);
  if (normalized.length <= maxLength) return normalized;
  const boundary = normalized.lastIndexOf(" ", maxLength - 1);
  return `${normalized.slice(0, Math.max(boundary, 72)).replace(/[,:;.!?]+$/u, "")}…`;
}

function ingredientLead(value: string, limit = 4) {
  return value
    .split(/[,;]+/u)
    .map((item) => clean(item).replace(/[.!?]+$/u, ""))
    .filter(Boolean)
    .slice(0, limit)
    .join(", ");
}

export function buildProductOverview(
  product: ProductOverviewInput,
  locale: Locale
) {
  if (product.longDescription) return clean(product.longDescription);

  const ingredients = ingredientLead(product.ingredients);
  const usage = summarizeProductField(product.howToUse, 210);

  if (locale === "ro") {
    const sentences = [
      `${product.officialName} este prezentat în catalogul Dr. Nona Moldova în categoria „${product.category}”.`,
    ];
    if (ingredients) {
      sentences.push(`În fișa produsului sunt indicate, printre altele: ${ingredients}.`);
    }
    if (usage) {
      sentences.push(`Modul de utilizare indicat de producător: ${usage}`);
    }
    return sentences.join(" ");
  }

  const sentences = [
    `${product.officialName} представлен в каталоге Dr. Nona Moldova в категории «${product.category}».`,
  ];
  if (ingredients) {
    sentences.push(`Среди указанных в карточке компонентов: ${ingredients}.`);
  }
  if (usage) {
    sentences.push(`Рекомендованный производителем способ применения: ${usage}`);
  }
  return sentences.join(" ");
}
