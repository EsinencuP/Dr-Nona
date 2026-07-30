export const SITE_NAME = "Dr. Nona Moldova";
export const DEFAULT_SITE_ORIGIN = "http://127.0.0.1:4173";

export function normalizeSiteOrigin(value = DEFAULT_SITE_ORIGIN) {
  const url = new globalThis.URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`Unsupported SITE_URL protocol: ${url.protocol}`);
  }
  return url.origin;
}

export function absoluteUrl(value, siteOrigin) {
  return new globalThis.URL(
    value || "/",
    `${normalizeSiteOrigin(siteOrigin)}/`
  ).href;
}

export function getRouteMetadata(manifest, pathname) {
  const route = manifest.routes.find((item) => item.path === pathname);
  if (route) return route;
  return {
    path: pathname,
    canonicalPath: pathname,
    pageTitle: "Страница не найдена",
    title: `Страница не найдена — ${SITE_NAME}`,
    description: "Запрошенная страница не найдена. Перейдите на главную страницу или в каталог Dr. Nona Moldova.",
    robots: "noindex,follow",
    indexable: false,
    ogType: "website",
    image: "/brand/dr-nona-logo.png",
    kind: "not-found",
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "Страница не найдена", path: pathname },
    ],
    schema: null,
  };
}

export function buildJsonLd(metadata, siteOrigin) {
  const origin = normalizeSiteOrigin(siteOrigin);
  const canonical = absoluteUrl(metadata.canonicalPath, origin);
  const graph = [
    {
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: metadata.pageTitle,
      description: metadata.description,
      inLanguage: "ru-MD",
      isPartOf: {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: `${origin}/`,
        name: SITE_NAME,
        inLanguage: "ru-MD",
      },
    },
  ];

  if (metadata.kind === "home") {
    graph.push({
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      url: `${origin}/`,
      name: SITE_NAME,
      inLanguage: "ru-MD",
    });
  }

  if (metadata.schema?.type === "Product") {
    const product = {
      "@type": "Product",
      "@id": `${canonical}#product`,
      url: canonical,
      name: metadata.schema.name,
      description: metadata.description,
      image: [absoluteUrl(metadata.schema.image, origin)],
      brand: {
        "@type": "Brand",
        name: "Dr. Nona",
      },
      mainEntityOfPage: {
        "@id": `${canonical}#webpage`,
      },
    };
    if (metadata.schema.sku) product.sku = metadata.schema.sku;
    graph.push(product);
  }

  if (metadata.schema?.type === "Article") {
    const article = {
      "@type": metadata.schema.articleType,
      "@id": `${canonical}#article`,
      url: canonical,
      headline: metadata.schema.headline,
      description: metadata.description,
      mainEntityOfPage: {
        "@id": `${canonical}#webpage`,
      },
      author: {
        "@type": "Organization",
        name: "Dr. Nona",
        url: "https://drnona.com/",
      },
      isBasedOn: metadata.schema.sourceUrl,
      inLanguage: "ru",
    };
    if (metadata.schema.image) {
      article.image = [absoluteUrl(metadata.schema.image, origin)];
    }
    if (metadata.schema.dateModified) {
      article.dateModified = metadata.schema.dateModified;
    }
    graph.push(article);
  }

  if (metadata.breadcrumbs?.length >= 2) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: metadata.breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: absoluteUrl(item.path, origin),
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function serializeJsonLd(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export function renderSeoHead(metadata, siteOrigin) {
  const origin = normalizeSiteOrigin(siteOrigin);
  const canonical = absoluteUrl(metadata.canonicalPath, origin);
  const image = absoluteUrl(metadata.image, origin);
  const twitterCard = metadata.image === "/brand/dr-nona-logo.png"
    ? "summary"
    : "summary_large_image";
  const articleModified =
    metadata.schema?.type === "Article" && metadata.schema.dateModified
      ? `\n<meta data-route-seo property="article:modified_time" content="${escapeHtml(metadata.schema.dateModified)}">`
      : "";
  const alternates = metadata.indexable
    ? `\n<link data-route-seo rel="alternate" hreflang="ru-MD" href="${escapeHtml(canonical)}">
<link data-route-seo rel="alternate" hreflang="x-default" href="${escapeHtml(canonical)}">`
    : "";

  return `<title>${escapeHtml(metadata.title)}</title>
<meta data-route-seo name="description" content="${escapeHtml(metadata.description)}">
<meta data-route-seo name="robots" content="${escapeHtml(metadata.robots)}">
<link data-route-seo rel="canonical" href="${escapeHtml(canonical)}">${alternates}
<meta data-route-seo property="og:locale" content="ru_MD">
<meta data-route-seo property="og:site_name" content="${SITE_NAME}">
<meta data-route-seo property="og:type" content="${escapeHtml(metadata.ogType)}">
<meta data-route-seo property="og:title" content="${escapeHtml(metadata.title)}">
<meta data-route-seo property="og:description" content="${escapeHtml(metadata.description)}">
<meta data-route-seo property="og:url" content="${escapeHtml(canonical)}">
<meta data-route-seo property="og:image" content="${escapeHtml(image)}">
<meta data-route-seo name="twitter:card" content="${twitterCard}">
<meta data-route-seo name="twitter:title" content="${escapeHtml(metadata.title)}">
<meta data-route-seo name="twitter:description" content="${escapeHtml(metadata.description)}">
<meta data-route-seo name="twitter:image" content="${escapeHtml(image)}">${articleModified}
<script data-route-seo type="application/ld+json">${serializeJsonLd(buildJsonLd(metadata, origin))}</script>`;
}

export function renderPrerenderedContent(metadata, siteOrigin) {
  const origin = normalizeSiteOrigin(siteOrigin);
  const breadcrumbs = metadata.breadcrumbs
    .map(
      (item) =>
        `<a href="${escapeHtml(absoluteUrl(item.path, origin))}">${escapeHtml(item.name)}</a>`
    )
    .join(" <span aria-hidden=\"true\">/</span> ");
  const image =
    metadata.image && metadata.image !== "/brand/dr-nona-logo.png"
      ? `<img src="${escapeHtml(absoluteUrl(metadata.image, origin))}" alt="" width="1200" height="630">`
      : "";

  return `<main id="main-content" data-prerendered-route="${escapeHtml(metadata.path)}">
  <nav aria-label="Хлебные крошки">${breadcrumbs}</nav>
  <article>
    <h1>${escapeHtml(metadata.pageTitle)}</h1>
    <p>${escapeHtml(metadata.description)}</p>
    ${image}
  </article>
</main>`;
}
