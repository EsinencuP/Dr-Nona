import { readFileSync } from "node:fs";
import { evaluateProductDataset } from "./product-content-lib.mjs";

const products = JSON.parse(readFileSync("src/data/products.json", "utf8"));
const report = evaluateProductDataset(products);

if (report.errors.length) {
  console.error(`Product content gate: FAIL (${report.errors.length} errors).`);
  for (const error of report.errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Product content gate: PASS (${report.total} records; ${report.published} published, ${report.drafts} drafts; all published records complete).`
);
