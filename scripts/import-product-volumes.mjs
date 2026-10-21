import { readFileSync } from "node:fs";
import { load } from "cheerio";
import { writeGeneratedFile } from "./write-generated-file.mjs";

// Preserve the package measure on the current Moldova cards. Never convert
// weights/counts into millilitres or infer package sizes from usage instructions.
const categories = ["creams", "hygiene", "parfumes", "supplements", "drinks"];
const products = JSON.parse(readFileSync("src/data/products.json", "utf8"))
  .filter((product) => product.publicationStatus === "published");
const normalizeName = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
const pathname = (url) => new URL(url).pathname.replace(/\/$/u, "");
const records = new Map();
const sourceUnits = { ml: "ml", g: "g", capsules: "caps", gums: "pieces", "tea bags": "tea-bags", compresses: "pieces" };
const packagePattern = /^(\d+(?:[.,]\d+)?)\s*(ml|g|capsules|gums|tea bags|compresses)$/iu;

for (const category of categories) {
  const sourceUrl = `https://www.drnona.md/${category}`;
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`${sourceUrl}: HTTP ${response.status}`);
  const $ = load(await response.text());
  for (const card of $(".t-rec").toArray()) {
    const elements = $(card).find(".tn-elem").toArray().map((element) => ({
      text: $(element).find(".tn-atom").text().trim(),
      left: Number($(element).attr("data-field-left-value")),
      width: Number($(element).attr("data-field-width-value")),
      top: Number($(element).attr("data-field-top-value")),
      href: $(element).find("a[href]").attr("href"),
    }));
    for (const volume of elements.filter((element) => packagePattern.test(element.text))) {
      const names = elements.filter((element) => element.text &&
        volume.left >= element.left - 6 && volume.left <= element.left + element.width + 6 &&
        element.top < volume.top && volume.top - element.top <= 65);
      const matches = products.filter((product) => names.some((name) => normalizeName(name.text) === normalizeName(product.officialName)));
      if (matches.length !== 1) throw new Error(`${sourceUrl}: ambiguous package ${volume.text} at ${volume.left}`);
      const product = matches[0];
      if (!elements.some((element) => element.href && pathname(element.href) === pathname(product.sourceUrl))) {
        throw new Error(`${product.slug}: matching product-detail link is missing from source card row`);
      }
      if (records.has(product.slug)) throw new Error(`${product.slug}: duplicate package size`);
      const [, quantity, unit] = volume.text.match(packagePattern);
      records.set(product.slug, {
        officialName: product.officialName,
        packageSize: { quantity: Number(quantity.replace(",", ".")), unit: sourceUnits[unit.toLowerCase()] },
        sourceText: volume.text,
        sourceUrl,
        productSourceUrl: product.sourceUrl,
      });
    }
  }
}

// The samples card has no single measure. Count the explicitly listed samples
// on its own product page rather than adding their different liquid volumes.
const kit = products.find((product) => product.slug === "samples-kit");
if (!kit) throw new Error("Published sample kit is missing.");
const kitResponse = await fetch(kit.sourceUrl);
if (!kitResponse.ok) throw new Error(`${kit.sourceUrl}: HTTP ${kitResponse.status}`);
const kitPage = load(await kitResponse.text());
const kitContents = kitPage("li").toArray().map((item) => kitPage(item).text().trim())
  .filter((text) => /\(\s*\d+(?:[.,]\d+)?\s*ml\s*\)/iu.test(text));
if (!kitContents.length) throw new Error("No sample-kit contents found; source layout may have changed.");
if (records.has(kit.slug)) throw new Error("Sample kit already has a category measure; review the detail-page count.");
records.set(kit.slug, {
  officialName: kit.officialName,
  packageSize: { quantity: kitContents.length, unit: "samples" },
  sourceText: kitContents.join("; "),
  sourceUrl: kit.sourceUrl,
  productSourceUrl: kit.sourceUrl,
  note: "Count of individually listed samples; no volume conversion or estimate applied.",
});
const missing = products.filter((product) => !records.has(product.slug));
if (missing.length) throw new Error(`Missing package sizes: ${missing.map((product) => product.slug).join(", ")}`);
const snapshot = {
  checkedAt: new Date().toISOString().slice(0, 10),
  source: "https://www.drnona.md/catalog",
  products: Object.fromEntries(products.map((product) => [product.slug, records.get(product.slug)])),
};
writeGeneratedFile("src/data/product-volumes.json", `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Product packages: ${records.size} verified sizes; no empty published cards.`);
for (const [slug, record] of records) console.log(`${slug}: ${record.packageSize.quantity} ${record.packageSize.unit}`);
