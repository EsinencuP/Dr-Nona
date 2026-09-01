export type SeoBreadcrumb = {
  name: string;
  path: string;
};

export type ProductSeoSchema = {
  type: "Product";
  name: string;
  sku: string;
  image: string;
};

export type ArticleSeoSchema = {
  type: "Article";
  articleType: "BlogPosting" | "NewsArticle";
  headline: string;
  image: string;
  sourceUrl: string;
  dateModified: string;
};

export type SeoRouteMetadata = {
  path: string;
  canonicalPath: string;
  pageTitle: string;
  title: string;
  description: string;
  robots: string;
  indexable: boolean;
  ogType: "website" | "product" | "article";
  image: string;
  kind: string;
  locale?: "ru" | "ro";
  alternates?: Record<string, string>;
  breadcrumbs: SeoBreadcrumb[];
  schema: ProductSeoSchema | ArticleSeoSchema | null;
};

export type SeoManifest = {
  version: number;
  siteName: string;
  routes: SeoRouteMetadata[];
};

export const SITE_NAME: string;
export const DEFAULT_SITE_ORIGIN: string;
export function resolveSiteOriginFromEnvironment(
  environment?: Record<string, string | undefined>
): string;
export function normalizeSiteOrigin(value?: string): string;
export function absoluteUrl(value: string, siteOrigin: string): string;
export function getRouteMetadata(
  manifest: SeoManifest,
  pathname: string,
  preferredLocale?: "ru" | "ro"
): SeoRouteMetadata;
export function buildJsonLd(
  metadata: SeoRouteMetadata,
  siteOrigin: string
): {
  "@context": "https://schema.org";
  "@graph": Array<Record<string, unknown>>;
};
export function renderSeoHead(
  metadata: SeoRouteMetadata,
  siteOrigin: string
): string;
export function renderPrerenderedContent(
  metadata: SeoRouteMetadata,
  siteOrigin: string
): string;
