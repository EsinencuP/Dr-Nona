import { readFile, writeFile } from "node:fs/promises";
import * as cheerio from "cheerio";

const moldovaOrigin = "https://www.drnona.md";
const internationalOrigin = "https://drnona.com";
const placeholder = "/brand/product-placeholder.svg";
const outputPath = new URL("../src/data/products.json", import.meta.url);

const categoryInventory = {
  "Кремы": [
    "solaris",
    "hand_and_nail_cream",
    "dynamic",
    "body_butter",
    "facial_solaris",
    "eye_care_balm",
    "face_milk",
    "night_cream",
    "anti_aging_serum",
    "ard_cream_for_face",
    "shp_day_time_face_cream",
    "top_samples_kit",
  ],
  "Напитки": ["gonseen", "slimseen_coffee_mix", "chocoseen", "soupseen"],
  "Пищевые добавки": [
    "okseen",
    "phase_9",
    "dnd",
    "imunseen",
    "goldseen",
    "cleanseen",
    "ravseen",
    "pulmoseen",
    "reumoseen",
    "yamseen",
    "newseen",
    "femseen",
  ],
  "Гигиена": [
    "mouthwash",
    "compressed_wipes_ru",
    "shower_gel_lord",
    "deodorant_lady",
    "deodorant_kiwi",
    "deodorant_lord",
    "facial_foam_soap",
    "unisex_deodorant_stick",
    "shenseen_mousse_toothpaste",
    "shower_gel",
    "mineral_shampoo",
    "mineral_hair_conditioner",
    "mineral_lipstick",
    "recovering_mud_musk",
    "bath_salts_with_chamomile_extract",
    "bath_salts_with_ylang_ylang_extract",
    "bath_salts_with_rosemary_extract",
    "bath_salts_with_lavender_extract",
  ],
  "Парфюмерия": ["parfume_lord", "parfume_kiwi", "parfume_lady", "parfume_faya"],
};

const internationalSlugs = {
  solaris: "solaris-body-lotion",
  hand_and_nail_cream: "hand-and-nail-treatment",
  dynamic: "dynamic-hydrating-cream",
  facial_solaris: "facial-solaris",
  eye_care_balm: "eye-contour-balm",
  face_milk: "face-milk",
  night_cream: "night-cream",
  anti_aging_serum: "anti-aging-serum",
  ard_cream_for_face: "ard-complex",
  shp_day_time_face_cream: "shp-day-time-face-cream-lc",
  top_samples_kit: "samples-kit",
  gonseen: "gonseen",
  slimseen_coffee_mix: "coffee-mix",
  chocoseen: "chocoseen",
  soupseen: "soupseen",
  okseen: "okseen",
  phase_9: "fase-9",
  dnd: "dnd-chewing-gum-tablets",
  imunseen: "imunseen",
  goldseen: "goldseen",
  cleanseen: "cleanseen",
  ravseen: "ravseen",
  pulmoseen: "pulmoseen",
  reumoseen: "reumoseen",
  yamseen: "yamseen",
  newseen: "newseen",
  femseen: "femseen",
  mouthwash: "mouthwash",
  compressed_wipes_ru: "dead-sea-water-compresses",
  deodorant_lady: "lady-deodorant",
  deodorant_kiwi: "kiwi-deodorant",
  deodorant_lord: "lord-deodorant",
  facial_foam_soap: "face-soap",
  unisex_deodorant_stick: "halo-pure-unisex-deodorant-stick",
  shenseen_mousse_toothpaste: "halo-shenseen-toothpaste",
  shower_gel: "halo-gel",
  mineral_shampoo: "frequent-use-tonic-shampoo",
  mineral_hair_conditioner: "conditioner",
  mineral_lipstick: "lipstick-new",
  recovering_mud_musk: "beauty-mask-for-face",
  bath_salts_with_chamomile_extract: "salts-camomile",
  bath_salts_with_ylang_ylang_extract: "salts-ylangylang",
  bath_salts_with_rosemary_extract: "salts-rosemary",
  bath_salts_with_lavender_extract: "salts-lavander",
  parfume_lord: "after-shave-lord",
  parfume_kiwi: "perfume-kiwi",
  parfume_lady: "perfume-lady",
  parfume_faya: "parfum-faya",
};

const expectedCategoryCounts = {
  "Кремы": 12,
  "Напитки": 4,
  "Пищевые добавки": 12,
  "Гигиена": 18,
  "Парфюмерия": 4,
};

const clean = (value = "") =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .replace(/\p{Extended_Pictographic}|\p{Emoji_Modifier}|\uFE0F|\u200D/gu, " ")
    .replace(/[•▪◾◆◇✓✔]+/g, ". ")
    .replace(/[—–]\s*(?=\p{Lu})/gu, ". ")
    .replace(/([.!?])(?=\p{Lu})/gu, "$1 ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\.{2,}/g, ".")
    .trim();

function extractRichText($, selection) {
  const content = selection.clone();
  content.find("br").replaceWith(" ");
  content.find("p,li,div,h1,h2,h3,h4,h5,h6").each((_, element) => {
    $(element).append(" ");
  });
  return clean(content.text());
}

function parseSitemap(xml) {
  return new Map(
    [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => {
      const block = match[1];
      const url = block.match(/<loc>(.*?)<\/loc>/)?.[1]?.replaceAll("&amp;", "&") ?? "";
      const lastmod = block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1] ?? "";
      return [url, lastmod];
    })
  );
}

function parseJsonLd($, type) {
  for (const element of $('script[type="application/ld+json"]').toArray()) {
    try {
      const value = JSON.parse($(element).text());
      const records = Array.isArray(value) ? value : [value];
      const found = records.find((record) => record?.["@type"] === type);
      if (found) return found;
    } catch {
      // Invalid third-party JSON-LD is ignored; the product page remains usable.
    }
  }
  return null;
}

function sourceTitle($) {
  return clean($("title").text().replace(/\s*\(\s*RU\s*\)\s*$/i, ""));
}

function stripSourceHeading(text, title) {
  let value = text;
  for (const prefix of [`${title} Dr. Nona`, title, "Dr. Nona"]) {
    if (value.toLocaleLowerCase("ru").startsWith(prefix.toLocaleLowerCase("ru"))) {
      value = value.slice(prefix.length).trim();
    }
  }
  return clean(value);
}

function shortDescription(value) {
  const protectedValue = value
    .replace(/^[\s–—-]+/, "")
    .replace(/Dr\.\s*Nona/gi, "Dr Nona");
  const segments = [...new Intl.Segmenter("ru", { granularity: "sentence" }).segment(protectedValue)]
    .map(({ segment }) => clean(segment).replace(/Dr Nona/gi, "Dr. Nona"))
    .filter((segment) => segment.length > 25);
  const first = segments[0] || value;
  if (first.length <= 260) return first;
  const clipped = first.slice(0, 257).replace(/\s+\S*$/, "").trim();
  return `${clipped}…`;
}

function segmentBetween(value, starts, ends) {
  const startPattern = starts.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const endPattern = ends.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const match = value.match(new RegExp(`(?:${startPattern})\\s*:?\\s*(.+?)(?=(?:${endPattern})|$)`, "iu"));
  return match ? clean(match[1]) : null;
}

function extractMoldovaProduct(html) {
  const $ = cheerio.load(html);
  $("script,style,noscript,svg").remove();
  const title = sourceTitle($);
  const body = stripSourceHeading(extractRichText($, $("body")), title);
  if (!title || body.length < 40) throw new Error("Moldova product page has no usable title or description.");
  return {
    title,
    shortDescription: shortDescription(body),
    longDescription: body,
    ingredients: segmentBetween(
      body,
      ["В составе также присутствуют", "В составе", "В его состав входят", "Также в его состав входят"],
      ["Преимущества", "Благодаря", "Идеален", "Особенно", "помогают", "Способ применения", "Применение"]
    ),
    howToUse: segmentBetween(
      body,
      ["Способ применения", "Применение", "Как использовать"],
      ["Состав", "Преимущества", "Важно", "Противопоказания"]
    ),
  };
}

function extractInternationalProduct(html) {
  const $ = cheerio.load(html);
  const productLd = parseJsonLd($, "Product") ?? {};
  const title = $("main h1").first();
  const panel = title.parent();
  const tabs = panel.find(".w-auto.bg-white.h-auto").first().children("div");
  return {
    name: clean(productLd.name || title.text()),
    sku: clean(productLd.sku || ""),
    description: extractRichText($, panel.find(".product-description-prose").first()),
    ingredients: extractRichText($, tabs.eq(0)) || null,
    howToUse: extractRichText($, tabs.eq(1)) || null,
  };
}

async function fetchText(url, attempts = 3) {
  let error;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131 Safari/537.36",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (caught) {
      error = caught;
    }
  }
  throw new Error(`${url}: ${error instanceof Error ? error.message : String(error)}`);
}

async function mapConcurrent(records, limit, mapper) {
  const result = new Array(records.length);
  let cursor = 0;
  async function worker() {
    while (cursor < records.length) {
      const index = cursor;
      cursor += 1;
      result[index] = await mapper(records[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, records.length) }, worker));
  return result;
}

function localSlug(sourceSlug) {
  return internationalSlugs[sourceSlug] || sourceSlug.replace(/_ru$/, "").replaceAll("_", "-");
}

function validate(products) {
  const errors = [];
  if (products.length !== 50) errors.push(`Expected 50 products, received ${products.length}.`);
  const slugs = new Set();
  for (const product of products) {
    if (slugs.has(product.slug)) errors.push(`Duplicate slug: ${product.slug}.`);
    slugs.add(product.slug);
    if (!product.officialName || !product.shortDescription || !product.longDescription) {
      errors.push(`${product.slug}: required catalog copy is incomplete.`);
    }
    if (new URL(product.sourceUrl).origin !== moldovaOrigin) {
      errors.push(`${product.slug}: primary source is not drnona.md.`);
    }
  }
  for (const [category, expected] of Object.entries(expectedCategoryCounts)) {
    const actual = products.filter((product) => product.category === category).length;
    if (actual !== expected) errors.push(`${category}: expected ${expected}, received ${actual}.`);
  }
  if (errors.length) throw new Error(`Catalog validation failed:\n${errors.join("\n")}`);
}

async function main() {
  const shouldWrite = process.argv.includes("--write");
  const existingProducts = JSON.parse(await readFile(outputPath, "utf8"));
  const existingBySlug = new Map(
    existingProducts.map((product) => [product.slug, product])
  );
  const sitemap = parseSitemap(await fetchText(`${moldovaOrigin}/sitemap.xml`));
  const inventory = Object.entries(categoryInventory).flatMap(([category, sourceSlugs]) =>
    sourceSlugs.map((sourceSlug) => ({ category, sourceSlug }))
  );

  const products = await mapConcurrent(inventory, 6, async ({ category, sourceSlug }, index) => {
    const sourceUrl = `${moldovaOrigin}/${sourceSlug}`;
    const internationalSlug = internationalSlugs[sourceSlug];
    const officialSourceUrl = internationalSlug
      ? `${internationalOrigin}/product/${internationalSlug}`
      : null;
    const moldova = extractMoldovaProduct(await fetchText(sourceUrl));
    let international = null;
    if (officialSourceUrl) {
      try {
        international = extractInternationalProduct(await fetchText(officialSourceUrl));
      } catch (error) {
        console.warn(`Enrichment skipped for ${sourceSlug}: ${error instanceof Error ? error.message : error}`);
      }
    }
    const slug = localSlug(sourceSlug);
    const existing = existingBySlug.get(slug);
    const sameCategory = categoryInventory[category].map(localSlug);
    const ownIndex = sameCategory.indexOf(slug);
    const relatedSlugs = Array.from({ length: Math.min(4, sameCategory.length - 1) }, (_, offset) =>
      sameCategory[(ownIndex + offset + 1) % sameCategory.length]
    );
    return {
      slug,
      officialName: moldova.title,
      shortDescription: moldova.shortDescription,
      longDescription: moldova.longDescription || international?.description || "",
      ingredients: international?.ingredients || moldova.ingredients || null,
      howToUse: international?.howToUse || moldova.howToUse || null,
      sku: international?.sku || "",
      category,
      publicationStatus: "published",
      editorialStatus: "ready",
      image: existing?.image || placeholder,
      catalogScale: existing?.catalogScale || 1,
      imageAlt:
        existing?.imageAlt ||
        `Изображение продукта ${moldova.title} будет добавлено позже`,
      sourceUrl,
      officialSourceUrl,
      releasedAt: null,
      sourceLastmod: sitemap.get(sourceUrl) || "",
      officialOrder: index + 1,
      popularityRank: index + 1,
      relatedSlugs,
    };
  });

  validate(products);
  const enriched = products.filter((product) => product.officialSourceUrl).length;
  const withSku = products.filter((product) => product.sku).length;
  const withIngredients = products.filter((product) => product.ingredients).length;
  const withHowToUse = products.filter((product) => product.howToUse).length;

  if (shouldWrite) {
    await writeFile(outputPath, `${JSON.stringify(products, null, 2)}\n`, "utf8");
  } else {
    await readFile(outputPath, "utf8");
  }
  console.log(
    `Moldova catalog: PASS (${products.length} products; ${enriched} cross-referenced; ${withSku} SKU; ${withIngredients} ingredients; ${withHowToUse} usage guides; ${shouldWrite ? "written" : "dry run"}).`
  );
}

await main();
