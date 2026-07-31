import {
  copyFile,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import {
  ContentSyncPolicySchema,
  fingerprintContentCandidate,
  isAllowedSourceUrl,
  validateContentSyncCandidate,
} from "./content-sync-lib.mjs";
import { assessProductContent } from "./product-content-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const sourceOrigin = "https://drnona.com";
const outputDir = path.join(projectRoot, "src", "data");
const stagingRoot = path.join(projectRoot, "artifacts", "content-sync");
const policyPath = path.join(here, "content-sync-policy.json");
const productionFiles = [
  "products.json",
  "official-pages.json",
  "source-summary.json",
];

const clean = (value = "") =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();

const decodeXml = (value = "") =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");

function parseArguments(argv) {
  const args = [...argv];
  const command = args[0] && !args[0].startsWith("--") ? args.shift() : "stage";
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected argument: ${argument}`);
    }
    const equals = argument.indexOf("=");
    if (equals !== -1) {
      options[argument.slice(2, equals)] = argument.slice(equals + 1);
      continue;
    }
    const key = argument.slice(2);
    const next = args[index + 1];
    if (next && !next.startsWith("--")) {
      options[key] = next;
      index += 1;
    } else {
      options[key] = true;
    }
  }
  return { command, options };
}

function sourceInventoryFromProducts(products) {
  return products.map((product) => ({
    product_name: product.officialName,
    product_slug: product.slug,
    product_page_url: product.sourceUrl,
    local_filename: path.basename(product.image),
  }));
}

function parseSitemap(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => {
    const block = match[1];
    return {
      url: decodeXml(block.match(/<loc>(.*?)<\/loc>/)?.[1] ?? ""),
      lastmod: block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1] ?? "",
    };
  });
}

function parseJsonLd($, type) {
  for (const element of $('script[type="application/ld+json"]').toArray()) {
    try {
      const value = JSON.parse($(element).text());
      if (value?.["@type"] === type) return value;
    } catch {
      // Malformed third-party blocks are ignored; schema validation still
      // evaluates the extracted candidate.
    }
  }
  return null;
}

function extractProduct(html, manifest, sitemapRecord, order, existing) {
  const $ = cheerio.load(html);
  const productLd = parseJsonLd($, "Product") ?? {};
  const breadcrumbLd = parseJsonLd($, "BreadcrumbList");
  const title = $("main h1").first();
  const panel = title.parent();
  const infoTabs = panel.find(".w-auto.bg-white.h-auto").first().children("div");
  const category =
    clean(breadcrumbLd?.itemListElement?.at(-2)?.name) ||
    clean(panel.find(".inline-flex").first().text()) ||
    "Без категории";
  const localImage = `/products/${manifest.local_filename}`;
  const extracted = {
    slug: manifest.product_slug,
    officialName: clean(
      productLd.name || title.text() || manifest.product_name
    ),
    shortDescription: clean(
      productLd.description || panel.find("h2").first().text()
    ),
    longDescription: clean(
      panel.find(".product-description-prose").first().text()
    ),
    ingredients: clean(infoTabs.eq(0).text()),
    howToUse: clean(infoTabs.eq(1).text()),
    sku: clean(productLd.sku || ""),
    category,
    image: existing?.image ?? localImage,
    imageAlt:
      existing?.imageAlt ??
      clean(productLd.description || manifest.product_name),
    sourceUrl: manifest.product_page_url,
    releasedAt: existing?.releasedAt ?? null,
    sourceLastmod: sitemapRecord?.lastmod ?? "",
    officialOrder: order,
    popularityRank: existing?.popularityRank ?? order,
    relatedSlugs: existing?.relatedSlugs ?? [],
  };
  const officialFields = [
    "officialName",
    "shortDescription",
    "longDescription",
    "ingredients",
    "howToUse",
    "sku",
    "category",
    "sourceUrl",
  ];
  const sourceChanged =
    !existing ||
    officialFields.some(
      (field) =>
        JSON.stringify(existing[field]) !== JSON.stringify(extracted[field])
    );
  const assessment = assessProductContent({
    ...extracted,
    publicationStatus: "draft",
    editorialStatus: "review-required",
  });
  const product = {
    ...extracted,
    publicationStatus:
      existing && !sourceChanged ? existing.publicationStatus : "draft",
    editorialStatus:
      existing && !sourceChanged
        ? existing.editorialStatus
        : assessment.complete
          ? "review-required"
          : "missing-required-content",
  };

  if (existing?.cardImage) product.cardImage = existing.cardImage;
  if (typeof existing?.catalogScale === "number") {
    product.catalogScale = existing.catalogScale;
  }
  if (existing?.collection) product.collection = existing.collection;
  return product;
}

function extractContentRecord(html, sitemapRecord) {
  const $ = cheerio.load(html);
  $("script, style, svg, noscript").remove();
  const main = $("main").first();
  const headings = main
    .find("h1,h2,h3")
    .toArray()
    .map((element) => clean($(element).text()))
    .filter(Boolean);
  const paragraphs = main
    .find("p, article, .prose, section div")
    .toArray()
    .filter(
      (element) =>
        $(element).find("p, article, .prose, section, div").length === 0
    )
    .map((element) => clean($(element).text()))
    .filter((value) => value.length > 30)
    .filter((value, index, values) => values.indexOf(value) === index);
  const images = main
    .find("img")
    .toArray()
    .map((element) => ({
      src: $(element).attr("src") ?? "",
      alt: clean($(element).attr("alt") ?? ""),
    }))
    .filter((image) => image.src.startsWith("http"));

  return {
    path: new URL(sitemapRecord.url).pathname,
    title:
      clean($('meta[name="title"]').attr("content") ?? "") ||
      clean($("title").text().replace(/ - Dr\.Nona International$/i, "")) ||
      headings[0] ||
      "",
    description: clean($('meta[name="description"]').attr("content") ?? ""),
    headings,
    paragraphs,
    images,
    sourceUrl: sitemapRecord.url,
    sourceLastmod: sitemapRecord.lastmod,
  };
}

async function fetchText(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
          accept: "text/html,application/xhtml+xml,application/xml",
        },
      });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  throw lastError;
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return results;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function loadPolicy() {
  return ContentSyncPolicySchema.parse(await readJson(policyPath));
}

function validateManifest(manifest, policy) {
  const errors = [];
  const slugs = new Set();
  const sourceUrls = new Set();
  const safeEntries = [];

  for (const [index, item] of manifest.entries()) {
    const scope = `manifest:${index + 2}`;
    let safe = true;
    if (!item.product_slug?.trim()) {
      errors.push({ code: "manifest-slug-missing", scope, message: "Missing product_slug." });
      safe = false;
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.product_slug)) {
      errors.push({
        code: "manifest-slug-invalid",
        scope,
        message: `Invalid product_slug: ${item.product_slug}.`,
      });
      safe = false;
    } else if (slugs.has(item.product_slug)) {
      errors.push({
        code: "manifest-slug-duplicate",
        scope,
        message: `Duplicate product_slug: ${item.product_slug}.`,
      });
      safe = false;
    } else {
      slugs.add(item.product_slug);
    }
    if (!item.local_filename?.trim()) {
      errors.push({
        code: "manifest-image-missing",
        scope,
        message: "Missing local_filename.",
      });
      safe = false;
    } else if (
      path.basename(item.local_filename) !== item.local_filename ||
      !/^[a-zA-Z0-9._-]+\.(?:png|jpe?g|webp)$/i.test(item.local_filename)
    ) {
      errors.push({
        code: "manifest-image-invalid",
        scope,
        message: `Unsafe local_filename: ${item.local_filename}.`,
      });
      safe = false;
    }
    if (
      !isAllowedSourceUrl(item.product_page_url, policy.allowedSourceOrigins)
    ) {
      errors.push({
        code: "manifest-origin-not-allowed",
        scope,
        message: `Product URL is outside the allowlist: ${item.product_page_url}.`,
      });
      safe = false;
    } else if (sourceUrls.has(item.product_page_url)) {
      errors.push({
        code: "manifest-url-duplicate",
        scope,
        message: `Duplicate product_page_url: ${item.product_page_url}.`,
      });
      safe = false;
    } else {
      sourceUrls.add(item.product_page_url);
    }
    if (safe) safeEntries.push(item);
  }
  return { errors, safeEntries };
}

function validateSitemapRecords(records, policy) {
  const errors = [];
  const safeRecords = [];
  const sourceUrls = new Set();

  for (const [index, record] of records.entries()) {
    const scope = `sitemap:${index + 1}`;
    if (!isAllowedSourceUrl(record.url, policy.allowedSourceOrigins)) {
      errors.push({
        code: "sitemap-origin-not-allowed",
        scope,
        message: `Sitemap URL is outside the allowlist: ${record.url}.`,
      });
      continue;
    }
    if (sourceUrls.has(record.url)) {
      errors.push({
        code: "sitemap-url-duplicate",
        scope,
        message: `Duplicate sitemap URL: ${record.url}.`,
      });
      continue;
    }
    sourceUrls.add(record.url);
    safeRecords.push(record);
  }
  return { errors, safeRecords };
}

function renderReview({
  candidateRelativePath,
  fingerprint,
  validation,
}) {
  const errorRows = validation.errors.length
    ? validation.errors
        .map(
          (entry) =>
            `| ${entry.code} | ${entry.scope} | ${entry.message.replaceAll("|", "\\|")} |`
        )
        .join("\n")
    : "| — | — | No blocking errors |";
  const warningRows = validation.warnings.length
    ? validation.warnings
        .map(
          (entry) =>
            `| ${entry.code} | ${entry.scope} | ${entry.message.replaceAll("|", "\\|")} |`
        )
        .join("\n")
    : "| — | — | No warnings |";

  return `# Content sync candidate review

Status: **${validation.ok ? "VALID — review required" : "BLOCKED"}**

## Identity

- Candidate: \`${candidateRelativePath}\`
- Fingerprint: \`${fingerprint}\`
- Production overwrite performed: **no**

## Counts

| Dataset | Previous | Candidate | Delta |
|---|---:|---:|---:|
| Products | ${validation.diff.counts.products.previous} | ${validation.diff.counts.products.candidate} | ${validation.diff.counts.products.delta} |
| Content | ${validation.diff.counts.content.previous} | ${validation.diff.counts.content.candidate} | ${validation.diff.counts.content.delta} |
| Content error records | — | ${validation.diff.counts.contentErrors} | — |

## Blocking errors

| Code | Scope | Message |
|---|---|---|
${errorRows}

## Warnings

| Code | Scope | Message |
|---|---|---|
${warningRows}

## Review sequence

1. Inspect \`diff.json\`, candidate products and content.
2. Resolve every blocking error and rerun staging.
3. Confirm legal/editorial implications outside this automation.
4. Promote only the exact reviewed fingerprint:

\`\`\`powershell
npm run sync:content:promote -- --candidate "${candidateRelativePath}" --approve "${fingerprint}" --reviewed-by "APPROVED_REVIEWER"
\`\`\`
`;
}

async function createStage() {
  const policy = await loadPolicy();
  const [
    sitemapText,
    previousProducts,
    previousContent,
  ] = await Promise.all([
    fetchText(`${sourceOrigin}/sitemap.xml`),
    readJson(path.join(outputDir, "products.json")),
    readJson(path.join(outputDir, "official-pages.json")),
  ]);
  const manifest = sourceInventoryFromProducts(previousProducts);
  const sitemap = parseSitemap(sitemapText);
  const manifestValidation = validateManifest(manifest, policy);
  const externalErrors = [...manifestValidation.errors];
  const existingProductsBySlug = new Map(
    previousProducts.map((product) => [product.slug, product])
  );
  const defaultRecordCandidates = sitemap.filter(
    ({ url }) => !/^https:\/\/drnona\.com\/(en|ua|he|sk)(\/|$)/.test(url)
  );
  const sitemapValidation = validateSitemapRecords(
    defaultRecordCandidates,
    policy
  );
  externalErrors.push(...sitemapValidation.errors);
  const defaultRecords = sitemapValidation.safeRecords;
  const sitemapByUrl = new Map(
    defaultRecords.map((record) => [record.url, record])
  );

  const productResults = await mapLimit(
    manifestValidation.safeEntries,
    5,
    async (item, index) => {
    try {
      const html = await fetchText(item.product_page_url);
      return {
        product: extractProduct(
          html,
          item,
          sitemapByUrl.get(item.product_page_url),
          index + 1,
          existingProductsBySlug.get(item.product_slug)
        ),
      };
    } catch (error) {
      return {
        error: {
          code: "product-fetch-error",
          scope: `product:${item.product_slug}`,
          message: `${item.product_page_url}: ${String(error)}`,
        },
      };
    }
    }
  );
  const products = productResults
    .map((result) => result.product)
    .filter(Boolean);
  externalErrors.push(
    ...productResults.map((result) => result.error).filter(Boolean)
  );

  const contentTargets = defaultRecords.filter(
    ({ url }) =>
      !/\/product\/[^/]+$/.test(url) &&
      !/\/(register|search)$/.test(url) &&
      url !== `${sourceOrigin}/products`
  );
  const content = await mapLimit(contentTargets, 5, async (record) => {
    try {
      const html = await fetchText(record.url);
      return extractContentRecord(html, record);
    } catch (error) {
      return {
        path: new URL(record.url).pathname,
        title: "",
        description: "",
        headings: [],
        paragraphs: [],
        images: [],
        sourceUrl: record.url,
        sourceLastmod: record.lastmod,
        error: String(error),
      };
    }
  });
  const summary = {
    source: sourceOrigin,
    syncedAt: new Date().toISOString(),
    sitemapUrls: sitemap.length,
    defaultLocaleUrls: defaultRecords.length,
    products: products.length,
    contentRecords: content.length,
    excludedSourceRoutes: ["/register", "/search"],
    missingManifestProductRoutes: defaultRecords
      .filter(({ url }) => /\/product\/[^/]+$/.test(url))
      .filter(
        ({ url }) =>
          !manifestValidation.safeEntries.some(
            (item) => item.product_page_url === url
          )
      )
      .map(({ url }) => url),
  };
  const validation = validateContentSyncCandidate({
    previousProducts,
    previousContent,
    products,
    content,
    summary,
    policy,
    externalErrors,
  });
  const fingerprint = fingerprintContentCandidate({
    products,
    content,
    summary,
  });
  const timestamp = summary.syncedAt
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(/\.\d{3}Z$/, "Z");
  const candidateDirectory = path.join(
    stagingRoot,
    `${timestamp}-${fingerprint.slice(0, 12)}`
  );
  const candidateRelativePath = path
    .relative(projectRoot, candidateDirectory)
    .replaceAll("\\", "/");
  await mkdir(candidateDirectory, { recursive: true });
  await Promise.all([
    writeJson(path.join(candidateDirectory, "products.json"), products),
    writeJson(path.join(candidateDirectory, "official-pages.json"), content),
    writeJson(path.join(candidateDirectory, "source-summary.json"), summary),
    writeJson(path.join(candidateDirectory, "diff.json"), validation.diff),
    writeJson(path.join(candidateDirectory, "fetch-errors.json"), externalErrors),
    writeJson(path.join(candidateDirectory, "validation-report.json"), {
      schemaVersion: 1,
      fingerprint,
      ok: validation.ok,
      errors: validation.errors,
      warnings: validation.warnings,
    }),
    writeFile(
      path.join(candidateDirectory, "REVIEW.md"),
      renderReview({ candidateRelativePath, fingerprint, validation }),
      "utf8"
    ),
  ]);

  console.log(
    JSON.stringify(
      {
        status: validation.ok ? "review-required" : "blocked",
        candidate: candidateRelativePath,
        fingerprint,
        products: products.length,
        content: content.length,
        errors: validation.errors.length,
        warnings: validation.warnings.length,
        productionWritten: false,
      },
      null,
      2
    )
  );
  if (!validation.ok) process.exitCode = 1;
}

async function loadAndValidateCandidate(candidateOption) {
  if (!candidateOption || candidateOption === true) {
    throw new Error("--candidate is required.");
  }
  const candidateDirectory = path.resolve(projectRoot, candidateOption);
  const stagingPrefix = `${path.resolve(stagingRoot)}${path.sep}`;
  if (!candidateDirectory.startsWith(stagingPrefix)) {
    throw new Error("Candidate must be inside artifacts/content-sync.");
  }
  const [
    products,
    content,
    summary,
    previousProducts,
    previousContent,
    policy,
    externalErrors,
  ] = await Promise.all([
    readJson(path.join(candidateDirectory, "products.json")),
    readJson(path.join(candidateDirectory, "official-pages.json")),
    readJson(path.join(candidateDirectory, "source-summary.json")),
    readJson(path.join(outputDir, "products.json")),
    readJson(path.join(outputDir, "official-pages.json")),
    loadPolicy(),
    readJson(path.join(candidateDirectory, "fetch-errors.json")).catch(() => []),
  ]);
  const validation = validateContentSyncCandidate({
    previousProducts,
    previousContent,
    products,
    content,
    summary,
    policy,
    externalErrors,
  });
  const fingerprint = fingerprintContentCandidate({
    products,
    content,
    summary,
  });
  return {
    candidateDirectory,
    products,
    content,
    summary,
    previousProducts,
    previousContent,
    validation,
    fingerprint,
  };
}

async function validateStage(options) {
  const candidate = await loadAndValidateCandidate(options.candidate);
  console.log(
    JSON.stringify(
      {
        status: candidate.validation.ok ? "valid" : "blocked",
        fingerprint: candidate.fingerprint,
        errors: candidate.validation.errors,
        warnings: candidate.validation.warnings,
      },
      null,
      2
    )
  );
  if (!candidate.validation.ok) process.exitCode = 1;
}

async function promoteStage(options) {
  if (!options.approve || options.approve === true) {
    throw new Error("--approve <fingerprint> is required.");
  }
  if (!options["reviewed-by"] || options["reviewed-by"] === true) {
    throw new Error("--reviewed-by <name> is required.");
  }
  const candidate = await loadAndValidateCandidate(options.candidate);
  if (!candidate.validation.ok) {
    throw new Error(
      `Candidate is blocked by ${candidate.validation.errors.length} validation error(s).`
    );
  }
  if (options.approve !== candidate.fingerprint) {
    throw new Error(
      `Fingerprint mismatch. Expected ${candidate.fingerprint}; received ${options.approve}.`
    );
  }

  const promotedAt = new Date().toISOString();
  const backupDirectory = path.join(
    stagingRoot,
    "backups",
    `${promotedAt.replace(/[:.]/g, "-")}-${candidate.fingerprint.slice(0, 12)}`
  );
  await mkdir(backupDirectory, { recursive: true });
  await Promise.all(
    productionFiles.map((file) =>
      copyFile(path.join(outputDir, file), path.join(backupDirectory, file))
    )
  );
  const promotedSummary = {
    ...candidate.summary,
    promotedAt,
    promotedBy: String(options["reviewed-by"]).trim(),
    candidateFingerprint: candidate.fingerprint,
  };

  try {
    await writeJson(path.join(outputDir, "products.json"), candidate.products);
    await writeJson(
      path.join(outputDir, "official-pages.json"),
      candidate.content
    );
    await writeJson(
      path.join(outputDir, "source-summary.json"),
      promotedSummary
    );
  } catch (error) {
    await Promise.all(
      productionFiles.map((file) =>
        copyFile(path.join(backupDirectory, file), path.join(outputDir, file))
      )
    );
    throw new Error(`Promotion failed and was rolled back: ${String(error)}`, {
      cause: error,
    });
  }

  const auditDirectory = path.join(
    projectRoot,
    "docs",
    "content-sync-promotions"
  );
  await mkdir(auditDirectory, { recursive: true });
  await writeJson(
    path.join(auditDirectory, `${candidate.fingerprint}.json`),
    {
      schemaVersion: 1,
      promotedAt,
      promotedBy: promotedSummary.promotedBy,
      candidateFingerprint: candidate.fingerprint,
      candidate: path
        .relative(projectRoot, candidate.candidateDirectory)
        .replaceAll("\\", "/"),
      backup: path
        .relative(projectRoot, backupDirectory)
        .replaceAll("\\", "/"),
      diff: candidate.validation.diff,
    }
  );
  console.log(
    JSON.stringify(
      {
        status: "promoted",
        fingerprint: candidate.fingerprint,
        reviewer: promotedSummary.promotedBy,
        products: candidate.products.length,
        content: candidate.content.length,
      },
      null,
      2
    )
  );
}

async function main() {
  const { command, options } = parseArguments(process.argv.slice(2));
  if (command === "stage") return createStage();
  if (command === "validate") return validateStage(options);
  if (command === "promote") return promoteStage(options);
  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
