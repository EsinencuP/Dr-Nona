import { createHash } from "node:crypto";
import { z } from "zod";
import {
  PRODUCT_CONTENT_FIELDS,
  evaluateProductDataset,
} from "./product-content-lib.mjs";

const nonEmptyText = z.string().trim().min(1);
const optionalDate = z
  .union([z.string(), z.null()])
  .refine(
    (value) =>
      value === null ||
      value.length === 0 ||
      Number.isFinite(Date.parse(value)),
    "Expected an ISO-compatible date, an empty source date, or null."
  );
const slug = nonEmptyText.regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Expected a lowercase URL-safe slug."
);

export const ProductSyncSchema = z
  .object({
    slug,
    officialName: nonEmptyText,
    shortDescription: z.string(),
    longDescription: z.string(),
    ingredients: z.union([z.string(), z.null()]),
    howToUse: z.union([z.string(), z.null()]),
    sku: z.string(),
    category: nonEmptyText,
    publicationStatus: z.enum(["published", "draft"]),
    editorialStatus: z.enum([
      "ready",
      "missing-required-content",
      "review-required",
    ]),
    collection: nonEmptyText.optional(),
    image: nonEmptyText,
    cardImage: nonEmptyText.optional(),
    catalogScale: z.number().positive().max(2).optional(),
    imageAlt: nonEmptyText,
    sourceUrl: z.string().url(),
    officialSourceUrl: z.union([z.string().url(), z.null()]).optional(),
    releasedAt: optionalDate,
    sourceLastmod: z.string(),
    officialOrder: z.number().int().positive(),
    popularityRank: z.number().int().positive(),
    relatedSlugs: z.array(slug),
  })
  .strict();

const ContentImageSchema = z
  .object({
    src: z.string().url(),
    alt: z.string(),
  })
  .strict();

export const ContentSyncSchema = z
  .object({
    path: nonEmptyText.refine((value) => value.startsWith("/"), {
      message: "Content path must be root-relative.",
    }),
    title: z.string(),
    description: z.string(),
    headings: z.array(z.string()),
    paragraphs: z.array(z.string()),
    images: z.array(ContentImageSchema),
    sourceUrl: z.string().url(),
    sourceLastmod: z.string(),
    error: z.string().optional(),
  })
  .strict()
  .superRefine((record, context) => {
    if (!record.error && record.title.trim().length === 0) {
      context.addIssue({
        code: "custom",
        path: ["title"],
        message: "Successful content records require a title.",
      });
    }
  });

export const SourceSummarySchema = z
  .object({
    source: z.string().url(),
    syncedAt: z.string().refine((value) => Number.isFinite(Date.parse(value))),
    sitemapUrls: z.number().int().nonnegative(),
    defaultLocaleUrls: z.number().int().nonnegative(),
    products: z.number().int().nonnegative(),
    contentRecords: z.number().int().nonnegative(),
    excludedSourceRoutes: z.array(z.string()),
    missingManifestProductRoutes: z.array(z.string().url()),
    promotedAt: z
      .string()
      .refine((value) => Number.isFinite(Date.parse(value)))
      .optional(),
    promotedBy: nonEmptyText.optional(),
    candidateFingerprint: nonEmptyText.optional(),
  })
  .strict();

export const ContentSyncPolicySchema = z
  .object({
    schemaVersion: z.literal(1),
    allowedSourceOrigins: z
      .array(z.string().url())
      .nonempty()
      .refine(
        (origins) => origins.every((origin) => new URL(origin).origin === origin),
        "Allowed origins must not include paths."
      ),
    maxProductCountDrop: z.number().int().nonnegative(),
    maxContentCountDrop: z.number().int().nonnegative(),
    maxContentErrors: z.number().int().nonnegative(),
    requireCompleteNewProducts: z.boolean(),
  })
  .strict();

function issue(code, scope, message, details = {}) {
  return {
    severity: "error",
    code,
    scope,
    message,
    ...details,
  };
}

function warning(code, scope, message, details = {}) {
  return {
    severity: "warning",
    code,
    scope,
    message,
    ...details,
  };
}

function schemaIssues(scope, result) {
  if (result.success) return [];
  return result.error.issues.map((problem) =>
    issue(
      "schema-invalid",
      scope,
      `${problem.path.join(".") || "record"}: ${problem.message}`,
      { path: problem.path }
    )
  );
}

export function isAllowedSourceUrl(value, allowedOrigins) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedOrigins.includes(url.origin);
  } catch {
    return false;
  }
}

function duplicates(records, field, { ignoreEmpty = false } = {}) {
  const seen = new Map();
  const result = [];

  for (const [index, record] of records.entries()) {
    const value = record?.[field];
    if (ignoreEmpty && (!value || !String(value).trim())) continue;
    if (seen.has(value)) {
      result.push({
        value,
        firstIndex: seen.get(value),
        duplicateIndex: index,
      });
    } else {
      seen.set(value, index);
    }
  }
  return result;
}

function recordMap(records, field) {
  return new Map(records.map((record) => [record[field], record]));
}

function changedFields(previous, candidate) {
  const fields = new Set([
    ...Object.keys(previous ?? {}),
    ...Object.keys(candidate ?? {}),
  ]);
  return [...fields]
    .filter(
      (field) =>
        JSON.stringify(previous?.[field]) !== JSON.stringify(candidate?.[field])
    )
    .sort();
}

export function buildContentSyncDiff({
  previousProducts,
  previousContent,
  products,
  content,
}) {
  const previousProductsBySlug = recordMap(previousProducts, "slug");
  const productsBySlug = recordMap(products, "slug");
  const previousContentByPath = recordMap(previousContent, "path");
  const contentByPath = recordMap(content, "path");

  const productAdded = products
    .filter((product) => !previousProductsBySlug.has(product.slug))
    .map((product) => product.slug)
    .sort();
  const productRemoved = previousProducts
    .filter((product) => !productsBySlug.has(product.slug))
    .map((product) => product.slug)
    .sort();
  const productChanged = products
    .filter((product) => previousProductsBySlug.has(product.slug))
    .map((product) => ({
      slug: product.slug,
      fields: changedFields(previousProductsBySlug.get(product.slug), product),
    }))
    .filter(({ fields }) => fields.length);
  const contentAdded = content
    .filter((record) => !previousContentByPath.has(record.path))
    .map((record) => record.path)
    .sort();
  const contentRemoved = previousContent
    .filter((record) => !contentByPath.has(record.path))
    .map((record) => record.path)
    .sort();
  const contentChanged = content
    .filter((record) => previousContentByPath.has(record.path))
    .map((record) => ({
      path: record.path,
      fields: changedFields(previousContentByPath.get(record.path), record),
    }))
    .filter(({ fields }) => fields.length);

  return {
    counts: {
      products: {
        previous: previousProducts.length,
        candidate: products.length,
        delta: products.length - previousProducts.length,
      },
      content: {
        previous: previousContent.length,
        candidate: content.length,
        delta: content.length - previousContent.length,
      },
      contentErrors: content.filter((record) => record.error).length,
    },
    products: {
      added: productAdded,
      removed: productRemoved,
      changed: productChanged,
    },
    content: {
      added: contentAdded,
      removed: contentRemoved,
      changed: contentChanged,
      errors: content
        .filter((record) => record.error)
        .map(({ path, sourceUrl, error }) => ({ path, sourceUrl, error })),
    },
  };
}

export function fingerprintContentCandidate({ products, content, summary }) {
  return createHash("sha256")
    .update(JSON.stringify({ products, content, summary }))
    .digest("hex");
}

export function validateContentSyncCandidate({
  previousProducts,
  previousContent,
  products,
  content,
  summary,
  policy: policyInput,
  externalErrors = [],
}) {
  const policyResult = ContentSyncPolicySchema.safeParse(policyInput);
  if (!policyResult.success) {
    return {
      ok: false,
      errors: schemaIssues("policy", policyResult),
      warnings: [],
      diff: buildContentSyncDiff({
        previousProducts,
        previousContent,
        products,
        content,
      }),
    };
  }
  const policy = policyResult.data;
  const errors = [];
  const warnings = [];
  const productsResult = z.array(ProductSyncSchema).safeParse(products);
  const contentResult = z.array(ContentSyncSchema).safeParse(content);
  const summaryResult = SourceSummarySchema.safeParse(summary);

  errors.push(...schemaIssues("products", productsResult));
  errors.push(...schemaIssues("content", contentResult));
  errors.push(...schemaIssues("summary", summaryResult));
  errors.push(
    ...externalErrors.map((entry) =>
      issue(
        entry.code ?? "fetch-or-parse-error",
        entry.scope ?? "fetch",
        entry.message ?? String(entry),
        entry.details ?? {}
      )
    )
  );

  for (const duplicate of duplicates(products, "slug")) {
    errors.push(
      issue(
        "duplicate-product-slug",
        "products",
        `Duplicate product slug: ${duplicate.value}.`,
        duplicate
      )
    );
  }
  for (const duplicate of duplicates(products, "sku", { ignoreEmpty: true })) {
    errors.push(
      issue(
        "duplicate-product-sku",
        "products",
        `Duplicate product SKU: ${duplicate.value}.`,
        duplicate
      )
    );
  }
  for (const duplicate of duplicates(content, "path")) {
    errors.push(
      issue(
        "duplicate-content-path",
        "content",
        `Duplicate content path: ${duplicate.value}.`,
        duplicate
      )
    );
  }

  const sourceRecords = [
    ...products.map((record) => ({
      scope: `product:${record.slug ?? "unknown"}`,
      value: record.sourceUrl,
    })),
    ...content.map((record) => ({
      scope: `content:${record.path ?? "unknown"}`,
      value: record.sourceUrl,
    })),
    ...products
      .filter((record) => record.officialSourceUrl)
      .map((record) => ({
        scope: `product-reference:${record.slug ?? "unknown"}`,
        value: record.officialSourceUrl,
      })),
    { scope: "summary", value: summary?.source },
  ];
  for (const { scope, value } of sourceRecords) {
    if (!isAllowedSourceUrl(value, policy.allowedSourceOrigins)) {
      errors.push(
        issue(
          "source-origin-not-allowed",
          scope,
          `Source URL is outside the allowlist: ${String(value)}.`
        )
      );
    }
  }

  const productDrop = previousProducts.length - products.length;
  if (productDrop > policy.maxProductCountDrop) {
    errors.push(
      issue(
        "product-count-drop",
        "products",
        `Product count dropped by ${productDrop}; allowed drop is ${policy.maxProductCountDrop}.`
      )
    );
  }
  const contentDrop = previousContent.length - content.length;
  if (contentDrop > policy.maxContentCountDrop) {
    errors.push(
      issue(
        "content-count-drop",
        "content",
        `Content count dropped by ${contentDrop}; allowed drop is ${policy.maxContentCountDrop}.`
      )
    );
  }
  const contentErrors = content.filter((record) => record.error).length;
  if (contentErrors > policy.maxContentErrors) {
    errors.push(
      issue(
        "content-error-threshold",
        "content",
        `Candidate contains ${contentErrors} error record(s); threshold is ${policy.maxContentErrors}.`
      )
    );
  }
  if (summary?.products !== products.length) {
    errors.push(
      issue(
        "summary-product-count-mismatch",
        "summary",
        `Summary says ${summary?.products}; candidate contains ${products.length} products.`
      )
    );
  }
  if (summary?.contentRecords !== content.length) {
    errors.push(
      issue(
        "summary-content-count-mismatch",
        "summary",
        `Summary says ${summary?.contentRecords}; candidate contains ${content.length} content records.`
      )
    );
  }

  const previousProductsBySlug = recordMap(previousProducts, "slug");
  for (const product of products) {
    const previous = previousProductsBySlug.get(product.slug);
    const assessment = evaluateProductDataset([product]);
    errors.push(
      ...assessment.errors.map((message) =>
        issue("product-content-invalid", `product:${product.slug}`, message)
      )
    );

    for (const field of PRODUCT_CONTENT_FIELDS) {
      const previousValue = previous?.[field];
      const candidateValue = product[field];
      if (
        typeof previousValue === "string" &&
        previousValue.trim() &&
        (candidateValue === null ||
          typeof candidateValue !== "string" ||
          !candidateValue.trim())
      ) {
        errors.push(
          issue(
            "required-field-regression",
            `product:${product.slug}`,
            `${field} became empty.`,
            { field }
          )
        );
      }
    }

    const incomplete = assessment.assessments[0]?.issues ?? [];
    if (!previous && policy.requireCompleteNewProducts && incomplete.length) {
      errors.push(
        issue(
          "new-product-incomplete",
          `product:${product.slug}`,
          `New product has ${incomplete.length} completeness issue(s).`
        )
      );
    } else if (incomplete.length) {
      warnings.push(
        warning(
          "known-incomplete-draft",
          `product:${product.slug}`,
          `Draft has ${incomplete.length} completeness issue(s).`
        )
      );
    }
  }

  const diff = buildContentSyncDiff({
    previousProducts,
    previousContent,
    products,
    content,
  });
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    diff,
  };
}
