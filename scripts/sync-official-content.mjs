import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const sourceOrigin = "https://drnona.com";
const manifestPath = path.join(
  projectRoot,
  "docs",
  "drnona_products_catalog",
  "manifest.csv"
);
const outputDir = path.join(projectRoot, "src", "data");

const clean = (value = "") =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();

const decodeXml = (value = "") =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells;
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function parseSitemap(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => {
    const block = match[1];
    return {
      url: decodeXml(block.match(/<loc>(.*?)<\/loc>/)?.[1] ?? ""),
      lastmod: block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1] ?? ""
    };
  });
}

function parseJsonLd($, type) {
  for (const element of $('script[type="application/ld+json"]').toArray()) {
    try {
      const value = JSON.parse($(element).text());
      if (value?.["@type"] === type) return value;
    } catch {
      // Ignore malformed third-party blocks.
    }
  }
  return null;
}

function extractProduct(html, manifest, sitemapRecord, order) {
  const $ = cheerio.load(html);
  const productLd = parseJsonLd($, "Product") ?? {};
  const breadcrumbLd = parseJsonLd($, "BreadcrumbList");
  const title = $("main h1").first();
  const panel = title.parent();
  const infoTabs = panel.find(".w-auto.bg-white.h-auto").first().children("div");
  const category =
    clean(breadcrumbLd?.itemListElement?.at(-2)?.name) ||
    clean(panel.find(".inline-flex").first().text()) ||
    "Без категории";
  const localImage = `/products/${manifest.local_filename}`;

  return {
    slug: manifest.product_slug,
    officialName: clean(productLd.name || title.text() || manifest.product_name),
    shortDescription: clean(productLd.description || panel.find("h2").first().text()),
    longDescription: clean(panel.find(".product-description-prose").first().text()),
    ingredients: clean(infoTabs.eq(0).text()),
    howToUse: clean(infoTabs.eq(1).text()),
    sku: clean(productLd.sku || ""),
    category,
    collection: /lord/i.test(`${manifest.product_name} ${manifest.product_slug}`)
      ? "Lord"
      : "Основная линейка",
    image: localImage,
    imageAlt: clean(productLd.description || manifest.product_name),
    sourceUrl: manifest.product_page_url,
    sourceLastmod: sitemapRecord?.lastmod ?? "",
    officialOrder: order,
    popularityRank: order,
    relatedSlugs: []
  };
}

function extractContentRecord(html, sitemapRecord) {
  const $ = cheerio.load(html);
  $("script, style, svg, noscript").remove();
  const main = $("main").first();
  const headings = main
    .find("h1,h2,h3")
    .toArray()
    .map((element) => clean($(element).text()))
    .filter(Boolean);
  const paragraphs = main
    .find("p, article, .prose, section div")
    .toArray()
    .filter((element) => $(element).find("p, article, .prose, section, div").length === 0)
    .map((element) => clean($(element).text()))
    .filter((value) => value.length > 30)
    .filter((value, index, values) => values.indexOf(value) === index);
  const images = main
    .find("img")
    .toArray()
    .map((element) => ({
      src: $(element).attr("src") ?? "",
      alt: clean($(element).attr("alt") ?? "")
    }))
    .filter((image) => image.src.startsWith("http"));

  return {
    path: new URL(sitemapRecord.url).pathname,
    title:
      clean($('meta[name="title"]').attr("content") ?? "") ||
      clean($("title").text().replace(/ - Dr\.Nona International$/i, "")) ||
      headings[0] ||
      "",
    description: clean($('meta[name="description"]').attr("content") ?? ""),
    headings,
    paragraphs,
    images,
    sourceUrl: sitemapRecord.url,
    sourceLastmod: sitemapRecord.lastmod
  };
}

async function fetchText(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
          accept: "text/html,application/xhtml+xml,application/xml"
        }
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  throw lastError;
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  const [manifestText, sitemapText] = await Promise.all([
    readFile(manifestPath, "utf8"),
    fetchText(`${sourceOrigin}/sitemap.xml`)
  ]);
  const manifest = parseCsv(manifestText);
  const sitemap = parseSitemap(sitemapText);
  const defaultRecords = sitemap.filter(
    ({ url }) => !/^https:\/\/drnona\.com\/(en|ua|he|sk)(\/|$)/.test(url)
  );
  const sitemapByUrl = new Map(defaultRecords.map((record) => [record.url, record]));

  const products = await mapLimit(manifest, 5, async (item, index) => {
    const html = await fetchText(item.product_page_url);
    return extractProduct(html, item, sitemapByUrl.get(item.product_page_url), index + 1);
  });

  const contentTargets = defaultRecords.filter(
    ({ url }) =>
      !/\/product\/[^/]+$/.test(url) &&
      !/\/(register|search)$/.test(url) &&
      url !== `${sourceOrigin}/products`
  );
  const content = await mapLimit(contentTargets, 5, async (record) => {
    try {
      const html = await fetchText(record.url);
      return extractContentRecord(html, record);
    } catch (error) {
      return {
        path: new URL(record.url).pathname,
        title: "",
        description: "",
        headings: [],
        paragraphs: [],
        images: [],
        sourceUrl: record.url,
        sourceLastmod: record.lastmod,
        error: String(error)
      };
    }
  });

  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDir, "products.json"), `${JSON.stringify(products, null, 2)}\n`),
    writeFile(path.join(outputDir, "official-pages.json"), `${JSON.stringify(content, null, 2)}\n`),
    writeFile(
      path.join(outputDir, "source-summary.json"),
      `${JSON.stringify(
        {
          source: sourceOrigin,
          syncedAt: new Date().toISOString(),
          sitemapUrls: sitemap.length,
          defaultLocaleUrls: defaultRecords.length,
          products: products.length,
          contentRecords: content.length,
          excludedSourceRoutes: ["/register", "/search"],
          missingManifestProductRoutes: defaultRecords
            .filter(({ url }) => /\/product\/[^/]+$/.test(url))
            .filter(({ url }) => !manifest.some((item) => item.product_page_url === url))
            .map(({ url }) => url)
        },
        null,
        2
      )}\n`
    )
  ]);

  console.log(
    JSON.stringify({
      products: products.length,
      content: content.length,
      sitemap: sitemap.length
    })
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
