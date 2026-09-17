import { getProductCopy } from "../../claims";
import type { Product } from "../../data";
import { getPopularityState } from "../../popularity";
import {
  compareCatalogProducts,
  type CatalogSort,
} from "../../product-sort";

export type CatalogFilterInput = {
  products: Product[];
  query: string;
  category: string;
  sort: CatalogSort;
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function isOneEditAway(left: string, right: string) {
  if (Math.abs(left.length - right.length) > 1) return false;
  if (left === right) return true;

  let leftIndex = 0;
  let rightIndex = 0;
  let edits = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      leftIndex += 1;
      rightIndex += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (left[leftIndex] === right[rightIndex + 1] && left[leftIndex + 1] === right[rightIndex]) {
      leftIndex += 2;
      rightIndex += 2;
    } else if (left.length > right.length) {
      leftIndex += 1;
    } else if (right.length > left.length) {
      rightIndex += 1;
    } else {
      leftIndex += 1;
      rightIndex += 1;
    }
  }
  return edits + Number(leftIndex < left.length || rightIndex < right.length) <= 1;
}

function fuzzyNameMatch(product: Product, words: string[]) {
  const titleWords = normalizeSearchText(`${product.officialName} ${product.category}`).split(" ");
  let usedCorrection = false;
  for (const word of words) {
    if (titleWords.includes(word)) continue;
    if (usedCorrection || word.length < 5 || !titleWords.some((candidate) => isOneEditAway(word, candidate))) {
      return false;
    }
    usedCorrection = true;
  }
  return usedCorrection;
}

export function filterCatalogProducts({
  products,
  query,
  category,
  sort,
}: CatalogFilterInput) {
  const needle = normalizeSearchText(query);
  const popularityScores = sort === "popular" ? getPopularityState().scores : null;
  const categoryProducts = products.filter((product) => category === "all" || product.category === category);
  const exact = categoryProducts.filter((product) =>
    !needle || normalizeSearchText([
      product.officialName,
      product.sku,
      product.category,
      getProductCopy(product, "shortDescription"),
      getProductCopy(product, "longDescription"),
      getProductCopy(product, "ingredients"),
    ].join(" ")).includes(needle)
  );
  if (exact.length || !needle) return exact.sort((left, right) => compareCatalogProducts(left, right, sort, popularityScores));

  const words = needle.split(" ");
  if (words.length > 3 || !words.some((word) => word.length >= 5)) return [];
  return categoryProducts
    .filter((product) => fuzzyNameMatch(product, words))
    .sort((left, right) => compareCatalogProducts(left, right, sort, popularityScores));
}
