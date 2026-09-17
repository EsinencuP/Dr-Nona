import type { Product } from "./data";
import { getPopularityState } from "./popularity";

export type CatalogSort = "popular" | "updated" | "az" | "za";

function timestamp(value: string | null) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function compareDateDescending(
  leftDate: string | null,
  rightDate: string | null,
  leftFallback: number,
  rightFallback: number
) {
  const left = timestamp(leftDate);
  const right = timestamp(rightDate);

  if (left !== null && right !== null && left !== right) return right - left;
  if (left !== null && right === null) return -1;
  if (left === null && right !== null) return 1;
  return leftFallback - rightFallback;
}

export function compareByReleasedAt(left: Product, right: Product) {
  return compareDateDescending(
    left.releasedAt,
    right.releasedAt,
    left.officialOrder,
    right.officialOrder
  );
}

export function compareBySourceUpdatedAt(left: Product, right: Product) {
  return compareDateDescending(
    left.sourceLastmod || null,
    right.sourceLastmod || null,
    left.officialOrder,
    right.officialOrder
  );
}

export function normalizeCatalogSort(value: string | null): CatalogSort {
  if (value === "newest") return "updated";
  if (value === "updated" || value === "az" || value === "za") return value;
  return "popular";
}

export function compareCatalogProducts(
  left: Product,
  right: Product,
  sort: CatalogSort,
  popularityScores: ReadonlyMap<string, number> | null = getPopularityState().scores
) {
  if (sort === "az") {
    return left.officialName.localeCompare(right.officialName, left.contentLocale === "ro" ? "ro-MD" : "ru");
  }
  if (sort === "za") {
    return right.officialName.localeCompare(left.officialName, left.contentLocale === "ro" ? "ro-MD" : "ru");
  }
  if (sort === "updated") return compareBySourceUpdatedAt(left, right);
  const popularityDifference = (popularityScores?.get(left.slug) ?? Number.MAX_SAFE_INTEGER) -
    (popularityScores?.get(right.slug) ?? Number.MAX_SAFE_INTEGER);
  if (popularityDifference !== 0) return popularityDifference;

  // Official order is the transparent fallback when no reviewed CRM snapshot is current.
  const officialOrderDifference = left.officialOrder - right.officialOrder;
  if (officialOrderDifference !== 0) return officialOrderDifference;
  return left.sku.localeCompare(right.sku, "en");
}
