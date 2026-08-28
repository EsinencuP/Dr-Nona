import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const productsPath = path.join(projectRoot, "src", "data", "products.json");
const outputDirectory = path.join(projectRoot, "public", "products", "catalog");
const publicPrefix = "/products/catalog";
const placeholder = "/brand/product-placeholder.svg";

const imageIdsBySlug = {
  "solaris-body-lotion": "006",
  "hand-and-nail-treatment": "046",
  "dynamic-hydrating-cream": "026",
  "body-butter": "049",
  "facial-solaris": "007",
  "eye-contour-balm": "022",
  "face-milk": "029",
  "night-cream": "048",
  "anti-aging-serum": "052",
  "ard-complex": "044",
  "shp-day-time-face-cream-lc": "045",
  "samples-kit": "009",
  gonseen: "054",
  "coffee-mix": "005",
  chocoseen: "031",
  soupseen: "008",
  okseen: "036",
  "fase-9": "042",
  "dnd-chewing-gum-tablets": "030",
  imunseen: "034",
  goldseen: "038",
  cleanseen: "041",
  ravseen: "037",
  pulmoseen: "055",
  reumoseen: "033",
  yamseen: "001",
  newseen: "032",
  femseen: "035",
  mouthwash: "023",
  "shower-gel-lord": "004",
  "lady-deodorant": "018",
  "kiwi-deodorant": "043",
  "face-soap": "039",
  "halo-pure-unisex-deodorant-stick": "010",
  "halo-shenseen-toothpaste": "002",
  "halo-gel": "003",
  "frequent-use-tonic-shampoo": "053",
  conditioner: "056",
  "beauty-mask-for-face": "047",
  "salts-camomile": "040",
  "salts-ylangylang": "051",
  "salts-rosemary": "050",
};

const sourceDirectory = process.argv[2];
if (!sourceDirectory) {
  throw new Error(
    "Pass the extracted single_product_cards directory as the first argument."
  );
}

const sourceFiles = (await readdir(sourceDirectory)).filter((name) =>
  name.toLowerCase().endsWith(".png")
);
const products = JSON.parse(await readFile(productsPath, "utf8"));
const knownSlugs = new Set(products.map((product) => product.slug));
const unknownMappings = Object.keys(imageIdsBySlug).filter(
  (slug) => !knownSlugs.has(slug)
);

if (products.length !== 50) {
  throw new Error(`Expected 50 products, received ${products.length}.`);
}
if (unknownMappings.length > 0) {
  throw new Error(`Unknown product image mappings: ${unknownMappings.join(", ")}`);
}

await mkdir(outputDirectory, { recursive: true });

for (const [slug, imageId] of Object.entries(imageIdsBySlug)) {
  const matches = sourceFiles.filter((name) => name.startsWith(`${imageId}_`));
  if (matches.length !== 1) {
    throw new Error(
      `Expected one PNG starting with ${imageId}_ for ${slug}, received ${matches.length}.`
    );
  }
  await copyFile(
    path.join(sourceDirectory, matches[0]),
    path.join(outputDirectory, `${slug}.png`)
  );
}

const updatedProducts = products.map((product) => {
  const imageId = imageIdsBySlug[product.slug];
  const image = imageId
    ? `${publicPrefix}/${product.slug}.png`
    : placeholder;
  const updated = {
    ...product,
    image,
    imageAlt: imageId
      ? `${product.officialName} — изображение продукта на белом фоне`
      : `Изображение продукта ${product.officialName} будет добавлено позже`,
  };
  delete updated.cardImage;
  return updated;
});

await writeFile(productsPath, `${JSON.stringify(updatedProducts, null, 2)}\n`, "utf8");

const placeholderCount = updatedProducts.filter(
  (product) => product.image === placeholder
).length;
console.log(
  `Product media: PASS (${Object.keys(imageIdsBySlug).length} archive images; ${placeholderCount} placeholders; one shared image field).`
);
