import { readFile, writeFile } from "node:fs/promises";
import { parseRomanianProductHtml } from "./romanian-product-content-lib.mjs";

const productsPath = new URL("../src/data/products.json", import.meta.url);
const romanianPath = new URL("../src/data/products-ro.json", import.meta.url);
const reviewPath = new URL("../src/data/products-ro-review.json", import.meta.url);
const descriptiveFields = ["shortDescription", "longDescription", "ingredients", "howToUse"];

async function fetchText(url, attempts = 3) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "DrNona-Moldova-Content-QA/1.0" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function mapConcurrent(records, limit, mapper) {
  const output = new Array(records.length);
  let cursor = 0;
  async function worker() {
    while (cursor < records.length) {
      const index = cursor++;
      output[index] = await mapper(records[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, records.length) }, worker));
  return output;
}

const products = JSON.parse(await readFile(productsPath, "utf8"));
const existing = JSON.parse(await readFile(romanianPath, "utf8"));
const existingReview = JSON.parse(await readFile(reviewPath, "utf8"));
const repairedEntries = await mapConcurrent(products, 5, async (product) => {
  const current = existing[product.slug];
  if (!current?.sourceUrl) throw new Error(`${product.slug}: Romanian source URL is missing.`);
  try {
    const parsed = parseRomanianProductHtml(await fetchText(current.sourceUrl));
    return [product.slug, { ...current, ...parsed }];
  } catch (error) {
    throw new Error(
      `${product.slug} (${current.sourceUrl}): ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }
});
const repaired = Object.fromEntries(repairedEntries);
const review = {
  ...existingReview,
  products: Object.fromEntries(
    products.map((product) => {
      const current = existingReview.products?.[product.slug] ?? {};
      return [
        product.slug,
        Object.fromEntries(
          descriptiveFields.map((field) => [field, current[field] ?? "pending"])
        ),
      ];
    })
  ),
};
const ingredients = Object.values(repaired).filter((item) => item.ingredients).length;
const usage = Object.values(repaired).filter((item) => item.howToUse).length;

if (process.argv.includes("--write")) {
  await writeFile(romanianPath, `${JSON.stringify(repaired, null, 2)}\n`, "utf8");
  await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`, "utf8");
}

console.log(
  `Romanian product repair: PASS (${repairedEntries.length} records; ${ingredients} explicit ingredient sections; ${usage} explicit usage sections; ${process.argv.includes("--write") ? "written" : "dry run"}).`
);
