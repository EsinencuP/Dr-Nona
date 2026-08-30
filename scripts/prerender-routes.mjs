import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { load } from "cheerio";
import manifest from "../src/data/seo-manifest.json" with { type: "json" };
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
  $("html").attr("lang", "ru");
  $("html").attr("data-site-origin", siteOrigin);

  const destination = outputPath(route.path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, $.html(), "utf8");
}

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
