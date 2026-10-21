import type { Product } from "../../data";
import russianNames from "../../data/product-card-names-ru.json";

export function getProductTitle(product: Product) {
  return product.cardTitle ?? product.officialName;
}

export function getLocalizedProductName(product: Product, locale = product.contentLocale ?? "ru") {
  return locale === "ro"
    ? product.officialName
    : (russianNames as Record<string, string>)[product.slug] ?? product.officialName;
}
