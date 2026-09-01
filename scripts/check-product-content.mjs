import { readFileSync } from "node:fs";
import { evaluateProductDataset } from "./product-content-lib.mjs";
import { assessRomanianProductCopy } from "./romanian-product-content-lib.mjs";

const products = JSON.parse(readFileSync("src/data/products.json", "utf8"));
const romanianProducts = JSON.parse(
  readFileSync("src/data/products-ro.json", "utf8")
);
const romanianReview = JSON.parse(
  readFileSync("src/data/products-ro-review.json", "utf8")
);
const publicProducts = JSON.parse(
  readFileSync("src/data/products-public.json", "utf8")
);
const publicRomanianProducts = JSON.parse(
  readFileSync("src/data/products-ro-public.json", "utf8")
);
const claims = JSON.parse(
  readFileSync("src/data/claims-registry.json", "utf8")
);
const report = evaluateProductDataset(products);
const descriptiveFields = ["shortDescription", "longDescription", "ingredients", "howToUse"];
const reviewStatuses = new Set(["pending", "approved", "rejected"]);
const publicProductBySlug = new Map(publicProducts.map((product) => [product.slug, product]));
const blockedFields = new Set(
  claims
    .filter((claim) => claim.scope === "product" && claim.status !== "approved")
    .map((claim) => `${claim.contentId}\u001f${claim.field}`)
);

if (publicProducts.length !== products.length) {
  report.errors.push("Public product dataset count differs from source products.");
}

if (!reviewStatuses.has(romanianReview.defaultStatus)) {
  report.errors.push("Romanian review manifest has an invalid defaultStatus.");
}

for (const product of products) {
  const publicProduct = publicProductBySlug.get(product.slug);
  if (!publicProduct) {
    report.errors.push(`${product.slug}: public product record is missing.`);
  }
  for (const field of descriptiveFields) {
    if (
      blockedFields.has(`${product.slug}\u001f${field}`) &&
      publicProduct?.[field] != null
    ) {
      report.errors.push(`${product.slug}: blocked ${field} leaked into public product data.`);
    }
    if (
      blockedFields.has(`ro:${product.slug}\u001f${field}`) &&
      publicRomanianProducts[product.slug]?.[field] != null
    ) {
      report.errors.push(`${product.slug}: blocked Romanian ${field} leaked into public product data.`);
    }
  }
  const localized = romanianProducts[product.slug];
  if (!localized) {
    report.errors.push(`${product.slug}: Romanian content record is missing.`);
    continue;
  }
  for (const field of ["category", "imageAlt", "sourceUrl"]) {
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
  for (const error of assessRomanianProductCopy(localized)) {
    report.errors.push(`${product.slug}: Romanian semantic validation failed: ${error}.`);
  }
  const productReview = romanianReview.products[product.slug] ?? {};
  for (const field of descriptiveFields) {
    const status = productReview[field] ?? romanianReview.defaultStatus;
    if (!reviewStatuses.has(status)) {
      report.errors.push(`${product.slug}: Romanian ${field} has invalid review status.`);
      continue;
    }
    if (status !== "approved") continue;
    const value = localized[field];
    if (typeof value !== "string" || !value.trim()) {
      report.errors.push(`${product.slug}: approved Romanian ${field} is empty.`);
    } else if (/[А-Яа-яЁё]/u.test(value)) {
      report.errors.push(`${product.slug}: approved Romanian ${field} contains Cyrillic text.`);
    } else if (field === "shortDescription" && (value.length < 50 || value.length > 200)) {
      report.errors.push(`${product.slug}: approved Romanian shortDescription is outside 50-200 characters.`);
    } else if (field === "longDescription" && (value.length < 200 || value.length > 800)) {
      report.errors.push(`${product.slug}: approved Romanian longDescription is outside 200-800 characters.`);
    }
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
  `Product content gate: PASS (${report.total} records; ${report.published} published, ${report.drafts} drafts; Romanian structure valid, descriptive fields quarantined until approval).`
);
