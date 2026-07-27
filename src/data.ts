import productsJson from "./data/products.json";
import pagesJson from "./data/official-pages.json";

export type Product = {
  slug: string;
  officialName: string;
  shortDescription: string;
  longDescription: string;
  ingredients: string;
  howToUse: string;
  sku: string;
  category: string;
  collection: string;
  image: string;
  imageAlt: string;
  sourceUrl: string;
  sourceLastmod: string;
  officialOrder: number;
  popularityRank: number;
  relatedSlugs: string[];
};

export type OfficialPage = {
  path: string;
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  images: Array<{ src: string; alt: string }>;
  sourceUrl: string;
  sourceLastmod: string;
  error?: string;
};

export const products = productsJson as Product[];
export const officialPages = pagesJson as OfficialPage[];

export const productBySlug = new Map(products.map((product) => [product.slug, product]));
export const pageByPath = new Map(officialPages.map((page) => [page.path, page]));

export const categories = Array.from(
  new Set(products.map((product) => product.category).filter(Boolean))
);

export const lordProducts = products.filter((product) => product.collection === "Lord");

export function getRelatedProducts(product: Product, limit = 4) {
  const explicit = product.relatedSlugs
    .map((slug) => productBySlug.get(slug))
    .filter((item): item is Product => Boolean(item));
  const related = products
    .filter(
      (candidate) =>
        candidate.slug !== product.slug &&
        candidate.category === product.category &&
        !explicit.some((item) => item.slug === candidate.slug)
    )
    .slice(0, Math.max(0, limit - explicit.length));
  return [...explicit, ...related].slice(0, limit);
}

export function getEditorial(kind: "blog" | "news") {
  return officialPages
    .filter((page) => page.path.startsWith(`/${kind}/`) && !page.error)
    .sort(
      (a, b) =>
        new Date(b.sourceLastmod || 0).getTime() -
        new Date(a.sourceLastmod || 0).getTime()
    );
}
