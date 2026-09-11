import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { hasCurrentTranslationApproval } from "./romanian-translation-approval-lib.mjs";

const pages = JSON.parse(
  readFileSync("src/data/official-pages.json", "utf8")
);
const claims = JSON.parse(
  readFileSync("src/data/claims-registry.json", "utf8")
);
const products = JSON.parse(readFileSync("src/data/products.json", "utf8"));
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

const publicProducts = products.map((product) => ({
  ...product,
  ...Object.fromEntries(
    productCopyFields.map((field) => [
      field,
      fieldIsPublishable(product.slug, field) ? product[field] : null,
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
            review[field] === "approved" &&
            fieldIsPublishable(`ro:${product.slug}`, field)
              ? localized[field]
              : null,
          ])
        ),
      },
    ];
  })
);

// Projections are derived only after the existing claims/editorial quarantine.
// A direct PDP needs its own product and the same four recommendations as the
// catalogue comparator; it must not fetch all 50 detailed records.
const published = publicProducts.filter((product) => product.publicationStatus === "published");
function localize(product, locale) {
  return locale === "ro"
    ? { ...product, ...publicRomanianProducts[product.slug], contentLocale: locale }
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
  writeFileSync(`src/data/product-details/${product.slug}.json`, `${JSON.stringify(Object.fromEntries(
    ["ru", "ro"].map((locale) => [locale, { product: localize(product, locale), related: related.map((item) => localize(item, locale)) }])
  ))}\n`);
}
writeFileSync("src/data/home-products.json", `${JSON.stringify(Object.fromEntries(
  ["ru", "ro"].map((locale) => [locale, homeProductSlugs.map((slug) => {
    const product = published.find((item) => item.slug === slug);
    if (!product) throw new Error(`Missing published home product: ${slug}`);
    return localize(product, locale);
  })])
))}\n`);

function editorial(kind, limit) {
  return pages
    .filter((page) => page.path.startsWith(`/${kind}/`) && !page.error)
    .sort(
      (left, right) =>
        new Date(right.sourceLastmod || 0).getTime() -
        new Date(left.sourceLastmod || 0).getTime()
    )
    .slice(0, limit)
    .map(
      ({
        path,
        title,
        description,
        headings,
        images,
        sourceUrl,
        sourceLastmod,
      }) => ({
        path,
        title,
        description,
        headings,
        paragraphs: [],
        images,
        sourceUrl,
        sourceLastmod,
      })
    );
}

const runtimeContent = {
  version: 1,
  claims: {
    fieldPublishability,
    blockedContent: [...blockedContent].sort(),
    blockedScopes: [...blockedScopes].sort(),
  },
  home: {
    editorial: [...editorial("news", 2), ...editorial("blog", 1)],
    productSlugs: homeProductSlugs.map((slug) => {
      const product = products.find((candidate) => candidate.slug === slug);
      if (!product || product.publicationStatus !== "published") {
        throw new Error(`Missing published home product: ${slug}`);
      }
      return slug;
    }),
  },
};

writeFileSync(
  "src/data/products-public.json",
  `${JSON.stringify(publicProducts, null, 2)}\n`,
  "utf8"
);

writeFileSync(
  "src/data/products-ro-public.json",
  `${JSON.stringify(publicRomanianProducts, null, 2)}\n`,
  "utf8"
);

writeFileSync(
  "src/data/runtime-content.json",
  `${JSON.stringify(runtimeContent, null, 2)}\n`,
  "utf8"
);

writeFileSync(
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
