import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import { blocksText, discoverLinks, parseMoldovaProductHtml, sourceIdentity } from "./moldova-product-content-lib.mjs";

const origin = "https://www.drnona.md";
const readJson = async path => JSON.parse(await readFile(path, "utf8"));
const hash = text => createHash("sha256").update(text).digest("hex");
const cacheDir = "artifacts/catalog-source";
const categoriesRo = { "Кремы": "Creme", "Напитки": "Băuturi", "Пищевые добавки": "Suplimente alimentare", "Гигиена": "Igienă", "Парфюмерия": "Parfumerie" };

async function fetchPage(url) {
  const path = `${cacheDir}/${new URL(url).pathname.slice(1)}.html`;
  if (process.argv.includes("--offline")) return readFile(path, "utf8");
  let error;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      await writeFile(path, html);
      return html;
    } catch (caught) { error = caught; }
  }
  throw new Error(`${url}: ${error.message}`);
}

async function discover(locale) {
  const catalogUrl = `${origin}/catalog${locale === "ro" ? "_ro" : ""}`;
  const categoryUrls = discoverLinks(await fetchPage(catalogUrl), catalogUrl, "category");
  if (!categoryUrls.length) throw new Error(`No ${locale} categories discovered`);
  const categories = [];
  for (const sourceUrl of categoryUrls) {
    const html = await fetchPage(sourceUrl);
    const $ = cheerio.load(html);
    const title = $("title").text().replace(/\s*\(\s*(?:RU|RO)\s*\)\s*$/iu, "").trim();
    const urls = discoverLinks(html, sourceUrl, "product");
    if (!urls.length) throw new Error(`No products discovered: ${sourceUrl}`);
    categories.push({ sourceUrl, title, urls });
  }
  return categories;
}

function section(blocks, pattern) {
  const index = blocks.findIndex(block => block.type !== "list" && pattern.test(block.text));
  if (index < 0) return null;
  const heading = blocks[index].text;
  const inline = heading.slice(heading.indexOf(":") + 1).trim();
  if (inline) return inline;
  const next = blocks[index + 1];
  return next ? blocksText([next]) : null;
}

function copyFrom(parsed, sourceUrl) {
  return {
    shortDescription: parsed.shortDescription,
    longDescription: parsed.longDescription,
    sourceBlocks: parsed.sourceBlocks,
    sourceCopy: { method: "verbatim-md-no-emoji", sourceUrl, textHash: hash(parsed.longDescription) },
    ingredients: section(parsed.sourceBlocks, /^(?:.*ингредиенты|состав|также в его состав входят|в его состав входят|основные ингредиенты.*|ingredientele principale.*|ingrediente.*|compoziție|de asemenea, compoziția sa include):/iu),
    howToUse: section(parsed.sourceBlocks, /^(?:способ применения|применение|как использовать|mod de utilizare|cum se utilizează):/iu),
    sourceUrl,
  };
}

async function main() {
  await mkdir(cacheDir, { recursive: true });
  const existing = await readJson("src/data/products.json");
  const existingRo = await readJson("src/data/products-ro.json");
  const review = await readJson("src/data/products-ro-review.json");
  const byIdentity = new Map(existing.map(p => [sourceIdentity(new URL(p.sourceUrl).pathname), p]));
  const ruCategories = await discover("ru");
  const roCategories = await discover("ro");
  const roUrls = new Map(roCategories.flatMap(c => c.urls.map(url => [sourceIdentity(new URL(url).pathname), url])));
  const discovered = new Map();
  for (const category of ruCategories) for (const url of category.urls) {
    if (discovered.has(url)) throw new Error(`Duplicate product in source categories: ${url}`);
    discovered.set(url, category.title);
  }
  const removed = existing.filter(p => !discovered.has(p.sourceUrl));
  if (removed.length) throw new Error(`Source inventory no longer includes: ${removed.map(p => p.slug).join(", ")}; review removals explicitly.`);
  const products = [], romanian = {}, records = [], errors = [];
  const tasks = [...discovered];
  let cursor = 0;
  await Promise.all(Array.from({ length: 5 }, async () => {
    while (cursor < tasks.length) {
      const [sourceUrl, category] = tasks[cursor++];
      try {
        const identity = sourceIdentity(new URL(sourceUrl).pathname);
        const previous = byIdentity.get(identity);
        if (!previous) throw new Error(`New source product ${sourceUrl}; requires asset, SKU and route mapping before publication.`);
        const parsed = parseMoldovaProductHtml(await fetchPage(sourceUrl));
        const product = { ...previous, ...copyFrom(parsed, sourceUrl), category };
        products.push(product);
        records.push({ slug: product.slug, locale: "ru", sourceUrl, sourceTitle: parsed.title, sku: product.sku || null, textHash: hash(parsed.plainSourceText), blocks: parsed.sourceBlocks.length });
        const roUrl = roUrls.get(identity);
        if (!roUrl) throw new Error(`Romanian source not linked by live categories: ${sourceUrl}; no translation substituted.`);
        const localized = parseMoldovaProductHtml(await fetchPage(roUrl));
        romanian[product.slug] = { ...existingRo[product.slug], ...copyFrom(localized, roUrl), category: categoriesRo[category] };
        records.push({ slug: product.slug, locale: "ro", sourceUrl: roUrl, sourceTitle: localized.title, sku: product.sku || null, textHash: hash(localized.plainSourceText), blocks: localized.sourceBlocks.length });
        // A newly imported original is not a reviewed translation. Do not move
        // approval hashes forward or turn an earlier approval into a blanket one.
        if (JSON.stringify(previous) !== JSON.stringify(product) || JSON.stringify(existingRo[product.slug]) !== JSON.stringify(romanian[product.slug])) {
          review.products[product.slug] = Object.fromEntries(["shortDescription", "longDescription", "ingredients", "howToUse"].map(field => [field, "pending"]));
        }
      } catch (error) { errors.push(`${sourceUrl}: ${error.message}`); }
    }
  }));
  const importedIds = new Set(products.map(p => sourceIdentity(new URL(p.sourceUrl).pathname)));
  for (const [identity, url] of roUrls) if (!importedIds.has(identity)) errors.push(`RO-only product needs mapping: ${url}`);
  const manifest = { schemaVersion: 1, method: "Live category discovery; original page text; emoji removal only. SKU retained as historical identity metadata, not reverified from drnona.com.", categories: { ru: ruCategories, ro: roCategories }, records: records.sort((a,b) => `${a.slug}:${a.locale}`.localeCompare(`${b.slug}:${b.locale}`)), errors };
  await writeFile(`${cacheDir}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  if (errors.length) throw new Error(`Import incomplete; source datasets were not written:\n${errors.join("\n")}`);
  products.sort((a,b) => a.officialOrder - b.officialOrder);
  const orderedRo = Object.fromEntries(products.map(p => [p.slug, romanian[p.slug]]));
  if (process.argv.includes("--write")) {
    for (const [path, value] of [["src/data/products.json", products], ["src/data/products-ro.json", orderedRo], ["src/data/products-ro-review.json", review], ["src/data/catalog-source-manifest.json", manifest]]) {
      await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
    }
  }
  console.log(`Moldova catalog: ${products.length} RU + ${roUrls.size} RO products; ${ruCategories.length} + ${roCategories.length} categories; all source blocks preserved; ${process.argv.includes("--write") ? "written" : "dry run"}.`);
}

await main();
