import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { load } from "cheerio";
import manifest from "../src/data/seo-manifest.json" with { type: "json" };
import privacyContent from "../src/features/privacy/privacyContent.json" with { type: "json" };
import { renderNotFoundHtml } from "./render-not-found.mjs";
import {
  renderPrerenderedContent,
  renderSeoHead,
  resolveSiteOriginFromEnvironment,
} from "../src/seo-core.mjs";

const siteOrigin = resolveSiteOriginFromEnvironment(process.env);
const template = readFileSync("dist/index.html", "utf8");

function outputPath(routePath) {
  if (routePath === "/") return "dist/index.html";
  const segments = routePath.split("/").filter(Boolean);
  return join("dist", ...segments, "index.html");
}

for (const route of manifest.routes) {
  const $ = load(template);
  $("title").remove();
  $('meta[name="description"]').remove();
  $("[data-route-seo]").remove();
  $("head").append(renderSeoHead(route, siteOrigin));
  $("#root").html(renderPrerenderedContent(route, siteOrigin));
  if ((route.path.replace(/^\/(?:ru|ro)(?=\/|$)/u, "") || "/") === "/privacypolicy") {
    const copy = privacyContent[route.locale === "ro" ? "ro" : "ru"];
    const content = $("[data-prerendered-route]");
    content.append($("<p>").text(copy.updated));
    content.append($("<h2>").text(copy.statusTitle), $("<p>").text(copy.status));
    for (const section of copy.sections) {
      const node = $("<section>").attr("id", section.id).append($("<h2>").text(section.title));
      for (const paragraph of section.paragraphs) node.append($("<p>").text(paragraph));
      content.append(node);
    }
    content.append($("<h2>").text(copy.storageTitle));
    const inventory = $("<dl>");
    for (const item of copy.storage) {
      inventory.append($("<dt>").text(item.name), $("<dd>").text(`${item.keys}. ${item.detail}`));
    }
    content.append(inventory);
    const prefix = route.path.startsWith("/ro/") ? "/ro" : route.path.startsWith("/ru/") ? "/ru" : "";
    content.append($("<p>").append($("<a>").attr("href", `${prefix}/contactus`).text(copy.contact)));
    content.append($("<p>").append($("<a>").attr("href", "https://datepersonale.md/about/faq/").text(copy.authorityLabel)));
  }
  $("html").attr("lang", route.locale === "ro" ? "ro" : "ru");
  $("html").attr("data-site-origin", siteOrigin);
  $("html").attr("data-prerendered-path", route.path);
  $("html").attr("data-prerendered-locale", route.locale);

  // The home background is LCP-critical only on home. Other routes must not
  // spend bandwidth decoding an unused hero; keep responsive home preloads.
  if (!["/", "/ru", "/ro", "/main", "/ru/main", "/ro/main"].includes(route.path)) {
    $('link[rel="preload"][as="image"][href^="/brand/hero/"]').remove();
  }
  if (route.locale === "ro") {
    $('link[rel="preload"][href="/fonts/manrope-cyrillic.woff2"]')
      .attr("href", "/fonts/manrope-latin-ext.woff2");
  }

  const destination = outputPath(route.path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, $.html(), "utf8");
}

writeFileSync(
  "dist/404.html",
  renderNotFoundHtml(template, "/404", "ru", siteOrigin),
  "utf8"
);

const indexableCanonicalPaths = [
  ...new Set(
    manifest.routes
      .filter((route) => route.indexable)
      .map((route) => route.canonicalPath)
  ),
].sort();
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexableCanonicalPaths
  .map((path) => `  <url><loc>${new URL(path, `${siteOrigin}/`).href}</loc></url>`)
  .join("\n")}
</urlset>
`;
writeFileSync("dist/sitemap.xml", sitemap, "utf8");
writeFileSync(
  "dist/robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`,
  "utf8"
);

console.log(
  `Prerendered ${manifest.routes.length} routes for ${siteOrigin}; sitemap contains ${indexableCanonicalPaths.length} canonical URLs.`
);
