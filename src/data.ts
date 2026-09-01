import formulaContentJson from "./data/formula-content.json";
import formulaContentRoJson from "./data/formula-content-ro.json";
import companyPagesJson from "./data/company-pages.json";
import { use } from "react";
import { useLocale } from "./locales/LocaleProvider";

type Locale = "ru" | "ro";

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
  catalogScale: number;
  imageAlt: string;
  sourceUrl: string;
  officialSourceUrl?: string | null;
  releasedAt: string | null;
  sourceLastmod: string;
  officialOrder: number;
  popularityRank: number;
  relatedSlugs: string[];
  contentLocale?: Locale;
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
  publicationStatus?: "published" | "tombstone";
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
const formulaContentByLocale: Record<Locale, FormulaChapter[]> = {
  ru: formulaContent,
  ro: formulaContentRoJson as FormulaChapter[],
};

export type ProductData = {
  allProducts: Product[];
  products: Product[];
  productBySlug: Map<string, Product>;
  categories: string[];
  getRelatedProducts: (product: Product, limit?: number) => Product[];
};

type RomanianProductCopy = Pick<
  Product,
  | "shortDescription"
  | "longDescription"
  | "ingredients"
  | "howToUse"
  | "category"
  | "imageAlt"
  | "sourceUrl"
>;

export type OfficialPageData = {
  officialPages: OfficialPage[];
  pageByPath: Map<string, OfficialPage>;
  getEditorial: (kind: "blog" | "news") => OfficialPage[];
};

type LocalizedCompanyPageCopy = Pick<
  OfficialPage,
  "title" | "description" | "headings" | "paragraphs" | "sourceUrl"
>;

const companyPages = companyPagesJson as Record<
  Locale,
  Record<string, LocalizedCompanyPageCopy>
>;
const productDataPromises = new Map<Locale, Promise<ProductData>>();
const officialPageDataPromises = new Map<Locale, Promise<OfficialPageData>>();

function createProductData(productsJson: Product[], locale: Locale): ProductData {
  const allProducts: Product[] = productsJson.map((product) => ({
    ...product,
    contentLocale: locale,
  }));
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

export function loadProductData(locale: Locale = "ru") {
  const cached = productDataPromises.get(locale);
  if (cached) return cached;
  const promise = Promise.all([
    import("./data/products-public.json"),
    locale === "ro" ? import("./data/products-ro-public.json") : Promise.resolve(null),
  ]).then(([productsModule, romanianModule]) => {
    const products = productsModule.default as Product[];
    if (!romanianModule) return createProductData(products, locale);
    const localizedCopy = romanianModule.default as Record<
      string,
      RomanianProductCopy
    >;
    return createProductData(
      products.map((product) => ({
        ...product,
        ...localizedCopy[product.slug],
        officialName: product.officialName,
      })),
      locale
    );
  });
  productDataPromises.set(locale, promise);
  return promise;
}

export function loadOfficialPageData(locale: Locale = "ru") {
  const cached = officialPageDataPromises.get(locale);
  if (cached) return cached;
  const promise = import("./data/official-pages.json").then((module) => {
    const localizedPages = companyPages[locale];
    const pages = (module.default as OfficialPage[]).map((page) => {
      const localizedCopy = localizedPages[page.path];
      return localizedCopy ? { ...page, ...localizedCopy } : page;
    });
    return createOfficialPageData(pages);
  });
  officialPageDataPromises.set(locale, promise);
  return promise;
}

export function useProductData() {
  const { locale } = useLocale();
  return use(loadProductData(locale));
}

export function useOfficialPageData() {
  const { locale } = useLocale();
  return use(loadOfficialPageData(locale));
}

export function useFormulaContent() {
  const { locale } = useLocale();
  return formulaContentByLocale[locale];
}

export function isProductContentFieldApplicable<K extends ProductContentField>(
  product: Product,
  field: K
): product is Product & Record<K, string> {
  return product[field] !== null;
}
