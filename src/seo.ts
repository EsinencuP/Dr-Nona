import {
  absoluteUrl,
  buildJsonLd,
  getRouteMetadata,
  normalizeSiteOrigin,
  type SeoManifest,
  type SeoRouteMetadata,
} from "./seo-core.mjs";

let manifestPromise: Promise<SeoManifest> | undefined;

function loadManifest() {
  manifestPromise ??= import("./data/seo-manifest.json").then(
    (module) => module.default as SeoManifest
  );
  return manifestPromise;
}

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

export async function getSeoMetadata(pathname: string): Promise<SeoRouteMetadata> {
  return getRouteMetadata(await loadManifest(), pathname);
}

export async function applyRouteMetadata(pathname: string) {
  const manifest = await loadManifest();
  const metadata = getRouteMetadata(manifest, pathname);
  const origin = siteOrigin();
  const canonical = absoluteUrl(metadata.canonicalPath, origin);
  const image = absoluteUrl(metadata.image, origin);

  document.querySelectorAll("[data-route-seo]").forEach((node) => node.remove());
  document.querySelector('meta[name="description"]')?.remove();
  document.title = metadata.title;

  appendMeta("name", "description", metadata.description);
  appendMeta("name", "robots", metadata.robots);
  appendMeta(
    "property",
    "og:locale",
    metadata.locale === "ro" ? "ro_MD" : "ru_MD"
  );
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
    const alternates = metadata.alternates ?? {
      [metadata.locale === "ro" ? "ro-MD" : "ru-MD"]:
        metadata.canonicalPath,
      "x-default": metadata.canonicalPath,
    };
    for (const [language, path] of Object.entries(alternates)) {
      appendLink("alternate", absoluteUrl(path, origin), language);
    }
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
