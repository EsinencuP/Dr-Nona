import manifestJson from "./data/seo-manifest.json";
import {
  absoluteUrl,
  buildJsonLd,
  getRouteMetadata,
  normalizeSiteOrigin,
  type SeoManifest,
  type SeoRouteMetadata,
} from "./seo-core.mjs";

const manifest = manifestJson as SeoManifest;

function siteOrigin() {
  const prerendered = document.documentElement.dataset.siteOrigin;
  return normalizeSiteOrigin(prerendered || window.location.origin);
}

function appendMeta(
  attribute: "name" | "property",
  key: string,
  content: string
) {
  const node = document.createElement("meta");
  node.dataset.routeSeo = "true";
  node.setAttribute(attribute, key);
  node.setAttribute("content", content);
  document.head.append(node);
}

function appendLink(
  rel: "canonical" | "alternate",
  href: string,
  hreflang?: string
) {
  const node = document.createElement("link");
  node.dataset.routeSeo = "true";
  node.rel = rel;
  node.href = href;
  if (hreflang) node.hreflang = hreflang;
  document.head.append(node);
}

export function getSeoMetadata(pathname: string): SeoRouteMetadata {
  return getRouteMetadata(manifest, pathname);
}

export function applyRouteMetadata(pathname: string) {
  const metadata = getSeoMetadata(pathname);
  const origin = siteOrigin();
  const canonical = absoluteUrl(metadata.canonicalPath, origin);
  const image = absoluteUrl(metadata.image, origin);

  document.querySelectorAll("[data-route-seo]").forEach((node) => node.remove());
  document.querySelector('meta[name="description"]')?.remove();
  document.title = metadata.title;

  appendMeta("name", "description", metadata.description);
  appendMeta("name", "robots", metadata.robots);
  appendMeta("property", "og:locale", "ru_MD");
  appendMeta("property", "og:site_name", manifest.siteName);
  appendMeta("property", "og:type", metadata.ogType);
  appendMeta("property", "og:title", metadata.title);
  appendMeta("property", "og:description", metadata.description);
  appendMeta("property", "og:url", canonical);
  appendMeta("property", "og:image", image);
  appendMeta(
    "name",
    "twitter:card",
    metadata.image === "/brand/dr-nona-logo.png"
      ? "summary"
      : "summary_large_image"
  );
  appendMeta("name", "twitter:title", metadata.title);
  appendMeta("name", "twitter:description", metadata.description);
  appendMeta("name", "twitter:image", image);

  if (metadata.schema?.type === "Article" && metadata.schema.dateModified) {
    appendMeta(
      "property",
      "article:modified_time",
      metadata.schema.dateModified
    );
  }

  appendLink("canonical", canonical);
  if (metadata.indexable) {
    appendLink("alternate", canonical, "ru-MD");
    appendLink("alternate", canonical, "x-default");
  }

  const jsonLd = document.createElement("script");
  jsonLd.dataset.routeSeo = "true";
  jsonLd.type = "application/ld+json";
  jsonLd.textContent = JSON.stringify(buildJsonLd(metadata, origin)).replaceAll(
    "<",
    "\\u003c"
  );
  document.head.append(jsonLd);
}

export { manifest as seoManifest };
