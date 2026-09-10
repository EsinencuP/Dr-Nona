import { use } from "react";
import type { Product } from "../../data";
import slugs from "../../data/published-product-slugs.json";
import { useLocale } from "../../locales/LocaleProvider";

type ProductDetail = { product: Product | undefined; related: Product[] };
type LocalizedDetail = Record<"ru" | "ro", ProductDetail>;
const modules = import.meta.glob<{ default: LocalizedDetail }>("../../data/product-details/*.json");
const published = new Set<string>(slugs);
const pending = new Map<string, Promise<LocalizedDetail>>();
const missing = { product: undefined, related: [] };

export function loadProductDetail(slug: string) {
  const cached = pending.get(slug);
  if (cached) return cached;
  const loader = modules[`../../data/product-details/${slug}.json`];
  const promise = published.has(slug) && loader
    ? loader().then((module) => module.default)
    : Promise.resolve({ ru: missing, ro: missing });
  pending.set(slug, promise);
  return promise;
}

export function useProductDetail(slug: string) {
  const { locale } = useLocale();
  return use(loadProductDetail(slug))[locale];
}
