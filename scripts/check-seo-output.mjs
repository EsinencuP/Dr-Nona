import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "cheerio";
import manifest from "../src/data/seo-manifest.json" with { type: "json" };
import {
  absoluteUrl,
  buildJsonLd,
  normalizeSiteOrigin,
} from "../src/seo-core.mjs";

const siteOrigin = normalizeSiteOrigin(
  process.env.SITE_URL ?? "http://127.0.0.1:4173"
);
const errors = [];
const stats = {
  total: manifest.routes.length,
  indexable: 0,
  noindex: 0,
  product: 0,
  article: 0,
  breadcrumb: 0,
  hreflang: 0,
};

function routeFile(routePath) {
  return routePath === "/"
    ? "dist/index.html"
    : join("dist", ...routePath.split("/").filter(Boolean), "index.html");
}

function expect(condition, message) {
  if (!condition) errors.push(message);
}

for (const route of manifest.routes) {
  if (route.indexable) stats.indexable += 1;
  else stats.noindex += 1;
  const file = routeFile(route.path);
  let html;
  try {
    html = readFileSync(file, "utf8");
  } catch {
    errors.push(`${route.path}: prerendered HTML file is missing (${file}).`);
    continue;
  }
  const $ = load(html);
  const canonical = absoluteUrl(route.canonicalPath, siteOrigin);

  expect($("title").text() === route.title, `${route.path}: title mismatch.`);
  expect(
    $('meta[name="description"]').attr("content") === route.description,
    `${route.path}: description mismatch.`
  );
  expect(
    $('meta[name="robots"]').attr("content") === route.robots,
    `${route.path}: robots mismatch.`
  );
  expect(
    $('link[rel="canonical"]').attr("href") === canonical,
    `${route.path}: canonical mismatch.`
  );
  expect(
    $('link[rel="canonical"]').length === 1,
    `${route.path}: expected exactly one canonical link.`
  );
  const alternateLinks = $('link[rel="alternate"][hreflang]');
  if (route.indexable) {
    stats.hreflang += 1;
    expect(
      alternateLinks.length === 2,
      `${route.path}: expected exactly two available-language alternates.`
    );
    expect(
      $('link[rel="alternate"][hreflang="ru-MD"]').attr("href") === canonical,
      `${route.path}: ru-MD alternate mismatch.`
    );
    expect(
      $('link[rel="alternate"][hreflang="x-default"]').attr("href") === canonical,
      `${route.path}: x-default alternate mismatch.`
    );
    expect(
      $('link[rel="alternate"][hreflang="ro-MD"]').length === 0,
      `${route.path}: unpublished Romanian alternate must not be advertised.`
    );
  } else {
    expect(
      alternateLinks.length === 0,
      `${route.path}: noindex route must not advertise language alternates.`
    );
  }
  for (const property of [
    "og:type",
    "og:title",
    "og:description",
    "og:url",
    "og:image",
  ]) {
    expect(
      $(`meta[property="${property}"]`).length === 1,
      `${route.path}: missing ${property}.`
    );
  }
  for (const name of [
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
  ]) {
    expect(
      $(`meta[name="${name}"]`).length === 1,
      `${route.path}: missing ${name}.`
    );
  }
  expect(
    $('[data-prerendered-route]').attr("data-prerendered-route") === route.path,
    `${route.path}: route content is not present before JavaScript.`
  );
  expect(
    $('[data-prerendered-route] h1').text().trim() === route.pageTitle,
    `${route.path}: prerendered heading mismatch.`
  );
  expect(
    $('[data-prerendered-route] p').first().text().trim() === route.description,
    `${route.path}: prerendered description mismatch.`
  );

  const scripts = $('script[type="application/ld+json"]');
  expect(scripts.length === 1, `${route.path}: expected one JSON-LD graph.`);
  if (scripts.length !== 1) continue;

  let jsonLd;
  try {
    jsonLd = JSON.parse(scripts.text());
  } catch {
    errors.push(`${route.path}: JSON-LD is not valid JSON.`);
    continue;
  }
  const expectedJsonLd = buildJsonLd(route, siteOrigin);
  expect(
    JSON.stringify(jsonLd) === JSON.stringify(expectedJsonLd),
    `${route.path}: JSON-LD differs from the route contract.`
  );
  const graph = Array.isArray(jsonLd["@graph"]) ? jsonLd["@graph"] : [];
  const breadcrumbs = graph.find((item) => item["@type"] === "BreadcrumbList");
  if (route.breadcrumbs.length >= 2) {
    stats.breadcrumb += 1;
    expect(Boolean(breadcrumbs), `${route.path}: BreadcrumbList is missing.`);
    expect(
      breadcrumbs?.itemListElement?.length === route.breadcrumbs.length,
      `${route.path}: BreadcrumbList length mismatch.`
    );
  }

  if (route.kind === "product") {
    stats.product += 1;
    const product = graph.find((item) => item["@type"] === "Product");
    expect(Boolean(product), `${route.path}: Product JSON-LD is missing.`);
    expect(Boolean(product?.name), `${route.path}: Product.name is missing.`);
    expect(Boolean(product?.image?.length), `${route.path}: Product.image is missing.`);
    expect(Boolean(product?.brand?.name), `${route.path}: Product.brand is missing.`);
    expect(Boolean(product?.url), `${route.path}: Product.url is missing.`);
    expect(
      !("offers" in (product ?? {})) &&
        !("review" in (product ?? {})) &&
        !("aggregateRating" in (product ?? {})),
      `${route.path}: Product JSON-LD contains unverified commerce or review data.`
    );
  }

  if (route.kind === "blog" || route.kind === "news") {
    stats.article += 1;
    const expectedType = route.kind === "news" ? "NewsArticle" : "BlogPosting";
    const article = graph.find((item) => item["@type"] === expectedType);
    expect(Boolean(article), `${route.path}: ${expectedType} JSON-LD is missing.`);
    expect(Boolean(article?.headline), `${route.path}: Article headline is missing.`);
    expect(
      Boolean(article?.mainEntityOfPage?.["@id"]),
      `${route.path}: Article mainEntityOfPage is missing.`
    );
    expect(
      !("datePublished" in (article ?? {})),
      `${route.path}: unverified article publication date was emitted.`
    );
  }
}

const indexedRoutes = manifest.routes.filter((route) => route.indexable);
expect(
  new Set(indexedRoutes.map((route) => route.title)).size === indexedRoutes.length,
  "Indexable route titles are not unique."
);
expect(
  new Set(indexedRoutes.map((route) => route.description)).size ===
    indexedRoutes.length,
  "Indexable route descriptions are not unique."
);

if (errors.length) {
  throw new Error(`SEO output gate failed:\n- ${errors.join("\n- ")}`);
}

const report = `# SEO build report

Generated automatically by \`npm run build\`.

## Static output

| Check | Result |
|---|---:|
| Route HTML files | ${stats.total} |
| Indexable routes | ${stats.indexable} |
| Explicit noindex routes | ${stats.noindex} |
| Product JSON-LD pages | ${stats.product} |
| Article JSON-LD pages | ${stats.article} |
| Breadcrumb JSON-LD pages | ${stats.breadcrumb} |
| Pages with ru-MD and x-default alternates | ${stats.hreflang} |
| Unique indexable titles | ${stats.indexable} |
| Unique indexable descriptions | ${stats.indexable} |
| Canonical origin | \`${siteOrigin}\` |
| Structural errors | 0 |

Every generated route contains title, description, one canonical, robots, Open
Graph, Twitter Cards, a JSON-LD graph and meaningful body content before
JavaScript execution. Every indexable Russian route declares reciprocal
\`ru-MD\` and \`x-default\` alternates. \`ro-MD\` is intentionally withheld
until a complete Romanian route set exists.

Product records deliberately omit \`offers\`, \`review\` and
\`aggregateRating\`: the catalogue is not a shop and no verified price,
availability or review dataset exists. Article records use sitemap
\`sourceLastmod\` only as \`dateModified\`; no publication date is inferred.

For a production build set \`RELEASE_MODE=production\` and provide the approved
\`SITE_URL\`. The build rejects a production release without that origin.
`;
writeFileSync("docs/SEO_REPORT.md", report, "utf8");

console.log(
  `SEO output gate: PASS (${stats.total} routes; ${stats.product} Product; ${stats.article} Article; 0 structural errors).`
);
