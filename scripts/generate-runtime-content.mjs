import { readFileSync, writeFileSync } from "node:fs";

const pages = JSON.parse(
  readFileSync("src/data/official-pages.json", "utf8")
);
const claims = JSON.parse(
  readFileSync("src/data/claims-registry.json", "utf8")
);
const products = JSON.parse(readFileSync("src/data/products.json", "utf8"));

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
  },
};

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
  `Runtime content: ${Object.keys(fieldPublishability).length} claim fields; ${runtimeContent.home.editorial.length} home editorial cards; ${products.filter((product) => product.publicationStatus === "published").length} selectable products.`
);
