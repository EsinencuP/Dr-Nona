import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { isLocaleRouteSupported } from "../src/locale-routing.mjs";
import { inlineLocaleResources, keysetDifference, leafFields, productFieldStatus, readLocaleMessages } from "./bilingual-parity-lib.mjs";

const read = path => JSON.parse(readFileSync(path, "utf8"));
const products = read("src/data/products.json"), ro = read("src/data/products-ro.json");
const published = read("src/data/products-public.json"), publishedRo = read("src/data/products-ro-public.json");
const review = read("src/data/products-ro-review.json"), claims = read("src/data/claims-registry.json");
const company = read("src/data/company-pages.json");
const formulaRu = read("src/data/formula-content.json"), formulaRo = read("src/data/formula-content-ro.json");
const pages = read("src/data/official-pages.json"), routes = read("src/data/seo-manifest.json").routes;
const sources = read("docs/bilingual/source-verification.json").records;
const repairs = read("docs/bilingual/extraction-repairs.json").repairs;
const messages = { ru: readLocaleMessages("src/locales/ru.ts", "ru"), ro: readLocaleMessages("src/locales/ro.ts", "ro") };
const rows = [], errors = [];
const descriptive = ["shortDescription", "longDescription", "ingredients", "howToUse"];
const add = (entityType, entity, field, ruField, roField, source, status, extra = {}) => rows.push({ entityType, entity, field, ru: ruField ?? null, ro: roField ?? null, source, status, ...extra });
const uiResources = [{ file: "src/locales/ru.ts + src/locales/ro.ts", line: 1, ...messages }, ...inlineLocaleResources()];
for (const resource of uiResources) {
  const diff = keysetDifference(resource.ru, resource.ro), left = leafFields(resource.ru), right = leafFields(resource.ro);
  if (diff.missingRo.length || diff.missingRu.length) errors.push(`${resource.file}:${resource.line}: keyset mismatch ${JSON.stringify(diff)}`);
  for (const key of new Set([...Object.keys(left), ...Object.keys(right)])) {
    const status = !(key in right) ? "MISSING_RO" : !(key in left) ? "MISSING_RU" : "EXACT/PARITY";
    add("ui", `${resource.file}:${resource.line}`, key, left[key], right[key], resource.file, status, { basis: "Paired existing UI resource; technical key coverage, not editorial approval." });
    if (typeof right[key] === "string" && /[А-Яа-яЁё]/u.test(right[key]) && !key.endsWith("expression")) errors.push(`Cyrillic RO UI resource: ${resource.file}:${key}`);
    if (right[key] === "" || left[key] === "") errors.push(`Empty UI resource: ${resource.file}:${key}`);
  }
}
for (const p of products) {
  const r = ro[p.slug], pub = published.find(item => item.slug === p.slug), pubRo = publishedRo[p.slug];
  const source = { ru: p.sourceUrl, ro: r?.sourceUrl, official: p.officialSourceUrl ?? null };
  if (!r || !pubRo) { errors.push(`Missing Romanian product: ${p.slug}`); continue; }
  for (const field of [...descriptive, "category", "imageAlt", "sourceUrl"]) {
    if (!Object.hasOwn(r, field) || !Object.hasOwn(pubRo, field)) errors.push(`Missing Romanian field: ${p.slug}.${field}`);
  }
  add("product", p.slug, "officialName", p.officialName, p.officialName, source, "EXACT/PARITY", { basis: "Shared official trade name; no translated duplicate." });
  add("product", p.slug, "category", p.category, r.category, source, "SEMANTIC_PARITY");
  add("product", p.slug, "imageAlt", p.imageAlt, r.imageAlt, source, "SEMANTIC_PARITY", { humanApproval: "P0-LOCALE metadata/alt approval remains open" });
  for (const field of descriptive) {
    const approval = review.products[p.slug]?.[field] ?? review.defaultStatus;
    if (approval !== "approved" && pubRo[field] != null) errors.push(`Quarantine leak: ${p.slug}.${field}`);
    const blockedRu = claims.some(c => c.scope === "product" && c.contentId === p.slug && c.field === field && c.status !== "approved");
    if (blockedRu && pub?.[field] != null) errors.push(`RU claim leak: ${p.slug}.${field}`);
    add("product", p.slug, field, p[field], r[field], source, productFieldStatus(p[field], r[field], field), {
      approval, requiresEditorialReview: true, publicRu: pub?.[field] ?? null, publicRo: pubRo[field],
      quarantine: approval !== "approved", repaired: repairs.some(item => item.entity === p.slug && item.field === field),
      note: p[field] == null && r[field] == null ? "Neither source dataset supplies this field; applicability is not established." : "Source-language text requires semantic/editorial review; absence or quarantine must not be filled from Russian.",
    });
  }
  for (const key of ["add", "added", "related", "ingredients", "use", "details"]) add("product-ui", p.slug, key, messages.ru[key], messages.ro[key], "src/locales/ru.ts + src/locales/ro.ts", "SEMANTIC_PARITY");
  add("product", p.slug, "relatedSlugs", p.relatedSlugs, p.relatedSlugs, "src/data/products.json", "EXACT/PARITY");
}
for (const slug of Object.keys(ro)) if (!products.some(p => p.slug === slug)) errors.push(`Orphan RO product: ${slug}`);
for (const [path, value] of Object.entries(company.ru)) {
  const localized = company.ro[path];
  if (!localized) errors.push(`Missing company locale: ${path}`);
  for (const field of ["title", "description", "headings", "paragraphs", "sourceUrl"]) {
    if (!Object.hasOwn(localized ?? {}, field)) errors.push(`Missing company field: ${path}.${field}`);
    add("company", path, field, value[field], localized?.[field], { ru: value.sourceUrl, ro: localized?.sourceUrl }, "NEEDS_EDITORIAL_REVIEW", { basis: "Technical coverage present; source URL alone is not evidence of approved translation." });
  }
}
for (const value of formulaRu) {
  const localized = formulaRo.find(item => item.id === value.id);
  if (!localized) errors.push(`Missing formula locale: ${value.id}`);
  for (const field of ["title", "summary", "text"]) add("formula", value.id, field, value[field], localized?.[field], { ru: value.sourceUrl, ro: localized?.sourceUrl }, "NEEDS_EDITORIAL_REVIEW");
}
const routeMap = new Map(routes.map(route => [route.path, route]));
const localeRoutes = routes.filter(route => /^\/ru(?:\/|$)/u.test(route.path));
for (const ruRoute of localeRoutes) {
  const roPath = ruRoute.path.replace(/^\/ru/u, "/ro"), roRoute = routeMap.get(roPath);
  if (!roRoute) errors.push(`Missing RO route: ${roPath}`);
  for (const field of ["path", "pageTitle", "title", "description", "canonicalPath", "locale", "alternates", "ogType", "image", "schema", "breadcrumbs", "indexable", "robots", "kind"]) {
    add("route", ruRoute.path.replace(/^\/ru/u, "") || "/", field, ruRoute[field], roRoute?.[field], "src/data/seo-manifest.json", !roRoute ? "MISSING_RO" : ruRoute[field] == null && roRoute[field] == null ? "NOT_APPLICABLE" : "EXACT/PARITY", { basis: "Metadata structure/route pairing; wording approval evaluated separately.", humanApproval: ["title", "description", "pageTitle"].includes(field) ? "P0-LOCALE remains open" : null });
  }
  if (!roRoute) continue;
  if (roRoute.locale !== "ro" || roRoute.canonicalPath !== roPath) errors.push(`Wrong RO route language/canonical: ${roPath}`);
  if (/[А-Яа-яЁё]/u.test(`${roRoute.title} ${roRoute.description} ${roRoute.pageTitle}`)) errors.push(`Russian metadata at ${roPath}`);
  if (JSON.stringify(ruRoute.alternates) !== JSON.stringify(roRoute.alternates)) errors.push(`Nonreciprocal alternates: ${roPath}`);
  if (roRoute.alternates?.["ro-MD"] !== roPath || roRoute.alternates?.["ru-MD"] !== ruRoute.path) errors.push(`Wrong hreflang: ${roPath}`);
  for (const field of ["title", "description", "image", "ogType"]) if (!roRoute[field]) errors.push(`Missing RO metadata: ${roPath}.${field}`);
}
for (const route of routes.filter(item => /^\/ro(?:\/|$)/u.test(item.path))) if (!routeMap.has(route.path.replace(/^\/ro/u, "/ru"))) errors.push(`Missing reciprocal RU route: ${route.path}`);
for (const page of pages) {
  const localized = company.ro[page.path];
  for (const field of ["title", "description", "headings", "paragraphs", "images", "sourceUrl", "publicationStatus"]) {
    add("official", page.path, field, page[field], localized?.[field] ?? null, page.sourceUrl, localized ? "NEEDS_EDITORIAL_REVIEW" : "NOT_APPLICABLE", { originalLanguage: "ru", shellLocales: ["ru", "ro"], reason: localized ? "Company translation reviewed separately." : "Original-language material; no Romanian translation claimed.", altCoverage: field === "images" ? page.images.filter(image => Boolean(image.alt?.trim())).length : undefined });
  }
  for (const [index, image] of page.images.entries()) {
    add("official-media", page.path, `images.${index}.alt`, image.alt, image.alt, { page: page.sourceUrl, image: image.src }, image.alt?.trim() ? "EXACT/PARITY" : "NEEDS_EDITORIAL_REVIEW", { originalLanguage: "ru", requiresEditorialReview: !image.alt?.trim(), note: "Shared original-language asset, not a Romanian translation. Missing source captions require image-specific review; non-hero article images may not be rendered." });
  }
  if (!isLocaleRouteSupported(page.path) && routeMap.has(`/ro${page.path}`)) errors.push(`Invented translated original route: ${page.path}`);
}
const counts = values => values.reduce((result, value) => ({ ...result, [value]: (result[value] ?? 0) + 1 }), {});
const audit = {
  schemaVersion: 1, date: "2026-09-09", technicalStatus: errors.length ? "BLOCKED" : "PASS", contentStatus: "HUMAN_REVIEW_REQUIRED", approvalGranted: false,
  statusVocabulary: ["EXACT/PARITY", "SEMANTIC_PARITY", "MISSING_RO", "MISSING_RU", "SUSPICIOUS_TRANSLATION", "TRUNCATED", "WRONG_FIELD_MAPPING", "NEEDS_EDITORIAL_REVIEW", "NOT_APPLICABLE"],
  contentEntityTotals: { ru: products.length + pages.length + formulaRu.length, ro: Object.keys(ro).length + Object.keys(company.ro).length + formulaRo.length, definition: "Source/content dataset records: products + official pages (RU), company overlays (RO) + formula chapters. Company RU pages already belong to official records. Includes quarantined records; excludes UI keys and route aliases. Counts do not imply published translation coverage." },
  entityCounts: { products: { ru: products.length, ro: Object.keys(ro).length }, company: { ru: Object.keys(company.ru).length, ro: Object.keys(company.ro).length }, formula: { ru: formulaRu.length, ro: formulaRo.length }, sharedUiKeys: { ru: Object.keys(messages.ru).length, ro: Object.keys(messages.ro).length }, localizedRoutes: { ru: localeRoutes.length, ro: routes.filter(r => /^\/ro(?:\/|$)/u.test(r.path)).length }, officialSourceRecords: pages.length, inlineUiDictionaries: uiResources.length - 1 },
  summary: { rows: rows.length, statuses: counts(rows.map(r => r.status)), repairedSourceFields: repairs.length, quarantinedProducts: products.filter(p => descriptive.some(field => (review.products[p.slug]?.[field] ?? review.defaultStatus) !== "approved")).length, quarantinedFieldSlots: rows.filter(r => r.quarantine).length, quarantinedNonemptyValues: rows.filter(r => r.quarantine && r.ro != null).length, humanReviewProducts: products.length, sourceRequests: sources.length, successfulSourceRequests: sources.filter(s => s.status === 200).length, technicalErrors: errors.length },
  routeInventory: routes.map(route => ({ path: route.path, locale: route.locale ?? "ru", canonical: route.canonicalPath, alternates: route.alternates ?? null, kind: route.kind, source: "src/data/seo-manifest.json", status: route.indexable ? "EXACT/PARITY" : "NOT_APPLICABLE", note: "Route instance inventory, including unprefixed aliases and original-language pages; metadata values are checked during SEO build validation." })),
  errors, rows,
  repairedFindings: repairs.map(repair => ({ entity: repair.entity, field: repair.field, previousStatus: repair.field === "howToUse" ? "TRUNCATED" : "WRONG_FIELD_MAPPING", currentStatus: "NEEDS_EDITORIAL_REVIEW", source: repair.source, approvalGranted: false, publicValue: publishedRo[repair.entity]?.[repair.field] ?? null })),
};
if (process.argv.includes("--write")) {
  mkdirSync("docs/bilingual", { recursive: true });
  writeFileSync("docs/bilingual/parity-audit.json", `${JSON.stringify(audit, null, 2)}\n`);
  const pending = rows.filter(r => r.requiresEditorialReview || r.status === "NEEDS_EDITORIAL_REVIEW" || r.humanApproval);
  writeFileSync("docs/bilingual/editorial-review.json", `${JSON.stringify({ date: audit.date, approvalGranted: false, rows: pending }, null, 2)}\n`);
  const table = products.map(product => {
    const record = ro[product.slug];
    const missing = value => descriptive.filter(field => value[field] == null).join(", ") || "—";
    const issues = rows.filter(row => row.entityType === "product" && row.entity === product.slug && descriptive.includes(row.field)).map(row => `${row.field}: ${row.status}${row.repaired ? " (source mapping repaired; still pending)" : ""}`).join("; ");
    return `| \`${product.slug}\` | ${missing(product)} | ${missing(record)} | ${issues} | [RU](${product.sourceUrl}) / [RO](${record.sourceUrl}) |`;
  });
  writeFileSync("docs/bilingual/EDITORIAL_REVIEW.md", `# RU/RO editorial review queue\n\nDate: ${audit.date}. All 50 products require human review. No approval is granted by this audit. Missing fields are unknown, not automatically inapplicable. A repaired source mapping remains quarantined. TRUNCATED flags include existing preview excerpts and require contextual review; they are not an instruction to publish longer claims.\n\nCompany/formula copy, metadata and alt approval items are additionally listed in [editorial-review.json](editorial-review.json). Source access checks are in [source-verification.json](source-verification.json); HTTP 200 alone is not semantic approval.\n\n| Product | Missing RU source fields | Missing RO source fields | Field decisions required | Sources |\n|---|---|---|---|---|\n${table.join("\n")}\n`);
}
console.log(JSON.stringify({ ...audit.entityCounts, ...audit.summary, errors }, null, 2));
if (errors.length) process.exitCode = 1;
