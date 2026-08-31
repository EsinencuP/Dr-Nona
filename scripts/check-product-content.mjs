import { readFileSync } from "node:fs";
import { evaluateProductDataset } from "./product-content-lib.mjs";

const products = JSON.parse(readFileSync("src/data/products.json", "utf8"));
const romanianProducts = JSON.parse(
  readFileSync("src/data/products-ro.json", "utf8")
);
const report = evaluateProductDataset(products);

for (const product of products) {
  const localized = romanianProducts[product.slug];
  if (!localized) {
    report.errors.push(`${product.slug}: Romanian content record is missing.`);
    continue;
  }
  for (const field of [
    "shortDescription",
    "longDescription",
    "category",
    "imageAlt",
    "sourceUrl",
  ]) {
    if (typeof localized[field] !== "string" || !localized[field].trim()) {
      report.errors.push(`${product.slug}: Romanian ${field} is empty.`);
    }
  }
  if (/[А-Яа-яЁё]/u.test(JSON.stringify(localized))) {
    report.errors.push(`${product.slug}: Romanian content contains Cyrillic text.`);
  }
  if ("officialName" in localized) {
    report.errors.push(
      `${product.slug}: product names must not be translated or duplicated in Romanian content.`
    );
  }
}

for (const slug of Object.keys(romanianProducts)) {
  if (!products.some((product) => product.slug === slug)) {
    report.errors.push(`${slug}: orphan Romanian content record.`);
  }
}

if (report.errors.length) {
  console.error(`Product content gate: FAIL (${report.errors.length} errors).`);
  for (const error of report.errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Product content gate: PASS (${report.total} records; ${report.published} published, ${report.drafts} drafts; RU/RO records complete).`
);
