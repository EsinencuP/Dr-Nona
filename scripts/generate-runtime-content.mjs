import { hasVerbatimMoldovaCopy } from "../src/product-copy-policy.mjs";
import { createHash } from "node:crypto";
import { writeGeneratedFile } from "./write-generated-file.mjs";
import { isRetiredEditorialPath } from "../src/editorial-policy.mjs";
import { mkdirSync, readFileSync } from "node:fs";
import { hasCurrentTranslationApproval } from "./romanian-translation-approval-lib.mjs";

const pages = JSON.parse(
  readFileSync("src/data/official-pages.json", "utf8")
);
const claims = JSON.parse(
  readFileSync("src/data/claims-registry.json", "utf8")
);
const products = JSON.parse(readFileSync("src/data/products.json", "utf8"));
const productVolumes = JSON.parse(readFileSync("src/data/product-volumes.json", "utf8")).products;
const packageUnits = new Set(["ml", "g", "caps", "pieces", "tea-bags", "samples"]);
for (const product of products.filter((item) => item.publicationStatus === "published")) {
  const record = productVolumes[product.slug];
  const size = record?.packageSize;
  if (!record || record.officialName !== product.officialName ||
      !size || !Number.isFinite(size.quantity) || size.quantity <= 0 || !packageUnits.has(size.unit) ||
      (!["ml", "g"].includes(size.unit) && !Number.isInteger(size.quantity)) ||
      !record.sourceText?.trim() || record.productSourceUrl !== product.sourceUrl) {
    throw new Error(`Missing, stale or invalid product package record: ${product.slug}`);
  }
}
const russianCardNames = JSON.parse(
  readFileSync("src/data/product-card-names-ru.json", "utf8")
);
for (const product of products.filter((item) => item.publicationStatus === "published")) {
  if (typeof russianCardNames[product.slug] !== "string" || !russianCardNames[product.slug].trim()) {
    throw new Error(`Missing Russian product card name: ${product.slug}`);
  }
}
const romanianProducts = JSON.parse(
  readFileSync("src/data/products-ro.json", "utf8")
);
const romanianReview = JSON.parse(
  readFileSync("src/data/products-ro-review.json", "utf8")
);
const productCopyFields = [
  "shortDescription",
  "longDescription",
  "ingredients",
  "howToUse",
];
const homeProductSlugs = [
  "dynamic-hydrating-cream",
  "hand-and-nail-treatment",
  "gonseen",
  "solaris-body-lotion",
  "after-shave-lord",
  "lord-deodorant",
];

const fieldPublishability = {};
const blockedContent = new Set();
const blockedScopes = new Set();

for (const claim of claims) {
  const fieldKey = `${claim.scope}\u001f${claim.contentId}\u001f${claim.field}`;
  fieldPublishability[fieldKey] =
    (fieldPublishability[fieldKey] ?? true) && claim.status === "approved";
  if (claim.status !== "approved") {
    blockedContent.add(`${claim.scope}\u001f${claim.contentId}`);
    blockedScopes.add(claim.scope);
  }
}

function fieldIsPublishable(contentId, field) {
  return fieldPublishability[`product\u001f${contentId}\u001f${field}`] ?? true;
}

for (const product of [...products, ...Object.values(romanianProducts)]) {
  if ((product.sourceCopy || product.sourceBlocks) && (!hasVerbatimMoldovaCopy(product) ||
      createHash("sha256").update(product.longDescription).digest("hex") !== product.sourceCopy.textHash)) {
    throw new Error(`Invalid verbatim source evidence: ${product.sourceUrl}`);
  }
}

const publicProducts = products.map((product) => ({
  ...product,
  cardTitle: product.officialName,
  packageSize: productVolumes[product.slug]?.packageSize,
  ...Object.fromEntries(
    productCopyFields.map((field) => [
      field,
      hasVerbatimMoldovaCopy(product) || fieldIsPublishable(product.slug, field) ? product[field] : null,
    ])
  ),
}));

const publicRomanianProducts = Object.fromEntries(
  products.map((product) => {
    const localized = romanianProducts[product.slug];
    if (!localized) throw new Error(`Missing Romanian product record: ${product.slug}`);
    const review = romanianReview.products[product.slug] ?? {};
    if (Object.values(review).includes("approved") && !hasCurrentTranslationApproval(product, localized, romanianReview)) {
      throw new Error(`Stale or missing Romanian translation approval: ${product.slug}`);
    }
    return [
      product.slug,
      {
        ...localized,
        ...Object.fromEntries(
          productCopyFields.map((field) => [
            field,
            hasVerbatimMoldovaCopy(localized) || (review[field] === "approved" &&
            fieldIsPublishable(`ro:${product.slug}`, field))
              ? localized[field]
              : null,
          ])
        ),
      },
    ];
  })
);

// Verbatim source reproduction is independent of claims/editorial review.
// Legacy copy continues to use the claims/editorial quarantine.
// A direct PDP needs its own product and the same four recommendations as the
// catalogue comparator; it must not fetch all 50 detailed records.
const published = publicProducts.filter((product) => product.publicationStatus === "published");
function localize(product, locale) {
  return locale === "ro"
    ? { ...product, ...publicRomanianProducts[product.slug], sourceBlocks: publicRomanianProducts[product.slug].sourceBlocks, sourceCopy: publicRomanianProducts[product.slug].sourceCopy, contentLocale: locale }
    : { ...product, contentLocale: locale };
}
function relatedProducts(product) {
  const explicit = product.relatedSlugs.map((slug) => published.find((item) => item.slug === slug)).filter(Boolean);
  const sameCategory = published.filter((item) => item.slug !== product.slug && item.category === product.category && !explicit.includes(item));
  const remaining = published.filter((item) => item.slug !== product.slug && !explicit.includes(item) && !sameCategory.includes(item));
  return [...explicit, ...sameCategory, ...remaining].slice(0, 4);
}
mkdirSync("src/data/product-details", { recursive: true });
for (const product of published) {
  const related = relatedProducts(product);
  writeGeneratedFile(`src/data/product-details/${product.slug}.json`, `${JSON.stringify(Object.fromEntries(
    ["ru", "ro"].map((locale) => [locale, { product: localize(product, locale), related: related.map((item) => localize(item, locale)) }])
  ))}\n`);
}
writeGeneratedFile("src/data/home-products.json", `${JSON.stringify(Object.fromEntries(
  ["ru", "ro"].map((locale) => [locale, homeProductSlugs.map((slug) => {
    const product = published.find((item) => item.slug === slug);
    if (!product) throw new Error(`Missing published home product: ${slug}`);
    return localize(product, locale);
  })])
))}\n`);

const runtimeContent = {
  version: 1,
  claims: {
    fieldPublishability,
    blockedContent: [...blockedContent].sort(),
    blockedScopes: [...blockedScopes].sort(),
  },
  home: {
    editorial: [],
    productSlugs: homeProductSlugs.map((slug) => {
      const product = products.find((candidate) => candidate.slug === slug);
      if (!product || product.publicationStatus !== "published") {
        throw new Error(`Missing published home product: ${slug}`);
      }
      return slug;
    }),
  },
};

writeGeneratedFile(
  "src/data/products-public.json",
  `${JSON.stringify(publicProducts, null, 2)}\n`,
  "utf8"
);

writeGeneratedFile(
  "src/data/products-ro-public.json",
  `${JSON.stringify(publicRomanianProducts, null, 2)}\n`,
  "utf8"
);

writeGeneratedFile(
  "src/data/runtime-content.json",
  `${JSON.stringify(runtimeContent, null, 2)}\n`,
  "utf8"
);

writeGeneratedFile(
  "src/data/published-product-slugs.json",
  `${JSON.stringify(
    products
      .filter((product) => product.publicationStatus === "published")
      .map((product) => product.slug),
    null,
    2
  )}\n`,
  "utf8"
);

console.log(
  `Runtime content: ${Object.keys(fieldPublishability).length} claim fields; ${runtimeContent.home.editorial.length} home editorial cards; ${runtimeContent.home.productSlugs.length} home products; ${products.filter((product) => product.publicationStatus === "published").length} selectable products.`
);

writeGeneratedFile("src/data/official-pages-public.json", `${JSON.stringify(pages.filter((page) => !isRetiredEditorialPath(page.path) && page.path !== "/warehouses"))}\n`, "utf8");
