export const PRODUCT_CONTENT_FIELDS = [
  "shortDescription",
  "longDescription",
  "ingredients",
  "howToUse",
];

const COMPLETE_PRODUCT_RULE = {
  required: PRODUCT_CONTENT_FIELDS,
  nullable: [],
};

const FRAGRANCE_PRODUCT_RULE = {
  required: ["shortDescription", "longDescription"],
  nullable: ["ingredients", "howToUse"],
};

const MOLDOVA_CATALOG_RULE = {
  required: ["shortDescription", "longDescription"],
  nullable: ["ingredients", "howToUse"],
};

export const CATEGORY_CONTENT_RULES = {
  "Парфюмерия": FRAGRANCE_PRODUCT_RULE,
  "Кремы": MOLDOVA_CATALOG_RULE,
  "Напитки": MOLDOVA_CATALOG_RULE,
  "Пищевые добавки": MOLDOVA_CATALOG_RULE,
  "Уход за лицом": COMPLETE_PRODUCT_RULE,
  "Дезодоранты": COMPLETE_PRODUCT_RULE,
  "Уход за телом": COMPLETE_PRODUCT_RULE,
  "Фитокомплексы": COMPLETE_PRODUCT_RULE,
  "Гигиена": MOLDOVA_CATALOG_RULE,
  "Уход за руками": COMPLETE_PRODUCT_RULE,
};

export function assessProductContent(product) {
  const rule = CATEGORY_CONTENT_RULES[product.category];
  const issues = [];
  const nullFields = [];

  if (!rule) {
    issues.push({
      code: "missing-category-rule",
      field: "category",
      message: `No content rule is defined for category "${product.category}".`,
    });
  }

  for (const field of PRODUCT_CONTENT_FIELDS) {
    const value = product[field];
    if (value === null) {
      nullFields.push(field);
      if (!rule?.nullable.includes(field)) {
        issues.push({
          code: "invalid-null",
          field,
          message: `${field} is not nullable for ${product.category}.`,
        });
      }
      continue;
    }

    if (typeof value !== "string") {
      issues.push({
        code: "invalid-type",
        field,
        message: `${field} must be a string or an explicitly allowed null.`,
      });
      continue;
    }

    if (rule?.required.includes(field) && value.trim().length === 0) {
      issues.push({
        code: "missing-required-content",
        field,
        message: `${field} is required for ${product.category}.`,
      });
    }
  }

  return {
    slug: product.slug,
    category: product.category,
    publicationStatus: product.publicationStatus,
    editorialStatus: product.editorialStatus,
    issues,
    missingFields: issues
      .filter((issue) => issue.code === "missing-required-content")
      .map((issue) => issue.field),
    nullFields,
    complete: issues.length === 0,
  };
}

export function evaluateProductDataset(products) {
  const assessments = products.map(assessProductContent);
  const errors = [];

  for (const [index, product] of products.entries()) {
    const assessment = assessments[index];
    if (
      product.releasedAt !== null &&
      (typeof product.releasedAt !== "string" ||
        !Number.isFinite(Date.parse(product.releasedAt)))
    ) {
      errors.push(
        `${product.slug}: releasedAt must be a valid approved date or null.`
      );
    }
    if (!["published", "draft"].includes(product.publicationStatus)) {
      errors.push(
        `${product.slug}: publicationStatus must be published or draft.`
      );
    }
    if (
      !["ready", "missing-required-content", "review-required"].includes(
        product.editorialStatus
      )
    ) {
      errors.push(`${product.slug}: unsupported editorialStatus.`);
    }
    if (product.publicationStatus === "published" && !assessment.complete) {
      errors.push(
        `${product.slug}: published product has ${assessment.issues.length} content issue(s).`
      );
    }
    if (
      product.publicationStatus === "published" &&
      product.editorialStatus !== "ready"
    ) {
      errors.push(
        `${product.slug}: published product must have editorialStatus ready.`
      );
    }
    if (
      !assessment.complete &&
      product.editorialStatus !== "missing-required-content"
    ) {
      errors.push(
        `${product.slug}: incomplete product must have editorialStatus missing-required-content.`
      );
    }
  }

  return {
    assessments,
    errors,
    total: products.length,
    published: products.filter(
      (product) => product.publicationStatus === "published"
    ).length,
    drafts: products.filter((product) => product.publicationStatus === "draft")
      .length,
    complete: assessments.filter((assessment) => assessment.complete).length,
    incomplete: assessments.filter((assessment) => !assessment.complete)
      .length,
  };
}
