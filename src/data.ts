import formulaContentJson from "./data/formula-content.json";
import { use } from "react";

export type Product = {
  slug: string;
  officialName: string;
  shortDescription: string | null;
  longDescription: string | null;
  ingredients: string | null;
  howToUse: string | null;
  sku: string;
  category: string;
  publicationStatus: "published" | "draft";
  editorialStatus:
    | "ready"
    | "missing-required-content"
    | "review-required";
  image: string;
  cardImage: string;
  catalogScale: number;
  imageAlt: string;
  sourceUrl: string;
  officialSourceUrl?: string | null;
  releasedAt: string | null;
  sourceLastmod: string;
  officialOrder: number;
  popularityRank: number;
  relatedSlugs: string[];
};

export type ProductContentField =
  | "shortDescription"
  | "longDescription"
  | "ingredients"
  | "howToUse";

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

export type FormulaChapter = {
  id: string;
  title: string;
  summary: string;
  text: string;
  sourceUrl: string;
};

export const formulaContent = formulaContentJson as FormulaChapter[];

export type ProductData = {
  allProducts: Product[];
  products: Product[];
  productBySlug: Map<string, Product>;
  categories: string[];
  getRelatedProducts: (product: Product, limit?: number) => Product[];
};

export type OfficialPageData = {
  officialPages: OfficialPage[];
  pageByPath: Map<string, OfficialPage>;
  getEditorial: (kind: "blog" | "news") => OfficialPage[];
};

let productDataPromise: Promise<ProductData> | undefined;
let officialPageDataPromise: Promise<OfficialPageData> | undefined;

function createProductData(productsJson: Product[]): ProductData {
  const allProducts = productsJson;
  const products = allProducts.filter(
    (product) => product.publicationStatus === "published"
  );
  const productBySlug = new Map(
    products.map((product) => [product.slug, product])
  );
  const categories = Array.from(
    new Set(products.map((product) => product.category).filter(Boolean))
  );

  const getRelatedProducts = (product: Product, limit = 4) => {
    const explicit = product.relatedSlugs
      .map((slug) => productBySlug.get(slug))
      .filter((item): item is Product => Boolean(item));
    const sameCategory = products.filter(
      (candidate) =>
        candidate.slug !== product.slug &&
        candidate.category === product.category &&
        !explicit.some((item) => item.slug === candidate.slug)
    );
    const remaining = products.filter(
      (candidate) =>
        candidate.slug !== product.slug &&
        !explicit.some((item) => item.slug === candidate.slug) &&
        !sameCategory.some((item) => item.slug === candidate.slug)
    );
    return [...explicit, ...sameCategory, ...remaining].slice(0, limit);
  };

  return {
    allProducts,
    products,
    productBySlug,
    categories,
    getRelatedProducts,
  };
}

function createOfficialPageData(pagesJson: OfficialPage[]): OfficialPageData {
  const officialPages = pagesJson;
  const pageByPath = new Map(
    officialPages.map((page) => [page.path, page])
  );
  const getEditorial = (kind: "blog" | "news") =>
    officialPages
      .filter((page) => page.path.startsWith(`/${kind}/`) && !page.error)
      .sort(
        (a, b) =>
          new Date(b.sourceLastmod || 0).getTime() -
          new Date(a.sourceLastmod || 0).getTime()
      );

  return { officialPages, pageByPath, getEditorial };
}

export function loadProductData() {
  productDataPromise ??= import("./data/products.json").then((module) =>
    createProductData(module.default as Product[])
  );
  return productDataPromise;
}

export function loadOfficialPageData() {
  officialPageDataPromise ??= import("./data/official-pages.json").then(
    (module) => createOfficialPageData(module.default as OfficialPage[])
  );
  return officialPageDataPromise;
}

export function useProductData() {
  return use(loadProductData());
}

export function useOfficialPageData() {
  return use(loadOfficialPageData());
}

export function isProductContentFieldApplicable<K extends ProductContentField>(
  product: Product,
  field: K
): product is Product & Record<K, string> {
  return product[field] !== null;
}
