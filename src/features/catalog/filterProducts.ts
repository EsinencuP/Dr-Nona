import { getProductCopy } from "../../claims";
import type { Product } from "../../data";
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

export function filterCatalogProducts({
  products,
  query,
  category,
  sort,
}: CatalogFilterInput) {
  const needle = query.trim().toLocaleLowerCase("ru");
  return products
    .filter(
      (product) =>
        (category === "all" || product.category === category) &&
        (!needle ||
          [
            product.officialName,
            product.sku,
            product.category,
            getProductCopy(product, "shortDescription"),
            getProductCopy(product, "longDescription"),
            getProductCopy(product, "ingredients"),
          ]
            .join(" ")
            .toLocaleLowerCase("ru")
            .includes(needle))
    )
    .sort((left, right) => compareCatalogProducts(left, right, sort));
}
