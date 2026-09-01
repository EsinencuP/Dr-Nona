import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const DETECTORS = [
  {
    type: "medical",
    reason: "diagnosis-treatment-or-disease",
    pattern:
      /(диагност|лечени|излечени|профилактик|заболевани|болезн|лекарствен|медицинск)/iu,
  },
  {
    type: "therapeutic",
    reason: "pain-healing-or-relief",
    pattern:
      /(мышечн|суставн|(?<!\p{L})бол(?:ь|и|ей|ям|ями|ях|ью)(?!\p{L})|заживлен|дезинфиц|облегчени|укус|зуд|трещин|повреждени|регенерац|целебн)/iu,
  },
  {
    type: "health",
    reason: "health-or-body-function",
    pattern:
      /(здоров|долголети|жизненн\p{L}*\s+(?:сил|тонус)|баланс\p{L}*\s+(?:тела|организма)|оздоравл|иммун|антиоксидант|благополуч|старени|моложе|бодрее)/iu,
  },
  {
    type: "cosmetic",
    reason: "cosmetic-efficacy",
    pattern:
      /(обновлени[юя]\s+клет|восстановлени[юя]\s+кож|защищает\s+организм|эффективност[ьи]\s+продукц)/iu,
  },
];

const ROMANIAN_DETECTORS = [
  {
    type: "medical",
    reason: "diagnosis-treatment-or-disease-ro",
    pattern: /(diagnostic|tratament|vindec|preven|boal|afecți|medicament|medical)/iu,
  },
  {
    type: "therapeutic",
    reason: "pain-healing-or-relief-ro",
    pattern: /(durere|dureri|muscular|articular|cicatriz|dezinfect|inflama|mușcătur|mâncărim|fisur|leziun|regener|terapeutic)/iu,
  },
  {
    type: "health",
    reason: "health-or-body-function-ro",
    pattern: /(sănătat|longevitat|vitalitat|echilibrul\s+(?:corpului|organismului)|imunit|antioxidant|îmbătrân|întiner)/iu,
  },
  {
    type: "cosmetic",
    reason: "cosmetic-efficacy-ro",
    pattern: /(nivel\s+celular|restabilirea\s+pielii|protejează\s+organismul|eficiența\s+produsului)/iu,
  },
];

const SENTENCE_SEGMENTER = new Intl.Segmenter("ru", {
  granularity: "sentence",
});
const ROMANIAN_SENTENCE_SEGMENTER = new Intl.Segmenter("ro", {
  granularity: "sentence",
});

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sentences(value, locale = "ru") {
  if (!value?.trim()) return [];
  const segmenter = locale === "ro" ? ROMANIAN_SENTENCE_SEGMENTER : SENTENCE_SEGMENTER;
  return [...segmenter.segment(value)]
    .map(({ segment }) => segment.trim())
    .filter(Boolean);
}

function classify(text, locale = "ru") {
  const detectors = locale === "ro" ? ROMANIAN_DETECTORS : DETECTORS;
  const matches = detectors.filter(({ pattern }) => pattern.test(text));
  if (!matches.length) return null;
  const priority = ["medical", "therapeutic", "health", "cosmetic"];
  const type =
    priority.find((candidate) =>
      matches.some((match) => match.type === candidate)
    ) ?? "health";
  return {
    type,
    reasons: matches.map(({ reason }) => reason),
  };
}

function fingerprint(scope, contentId, field, claimText) {
  return createHash("sha256")
    .update([scope, contentId, field, claimText].join("\u001f"))
    .digest("hex");
}

function candidate({
  scope,
  contentId,
  field,
  claimText,
  sourceUrl,
  sourceLastmod = "",
  locale = "ru",
}) {
  const classification = classify(claimText, locale);
  if (!classification) return null;
  const claimFingerprint = fingerprint(scope, contentId, field, claimText);
  return {
    id: `CLM-${claimFingerprint.slice(0, 10).toUpperCase()}`,
    fingerprint: claimFingerprint,
    scope,
    contentId,
    field,
    claimText,
    claimType: classification.type,
    detectionReasons: classification.reasons,
    sourceUrl,
    sourceLastmod,
    market: "MD",
  };
}

function collectField({
  output,
  scope,
  contentId,
  field,
  value,
  sourceUrl,
  sourceLastmod,
  locale = "ru",
}) {
  for (const claimText of sentences(value, locale)) {
    const item = candidate({
      scope,
      contentId,
      field,
      claimText,
      sourceUrl,
      sourceLastmod,
      locale,
    });
    if (item) output.push(item);
  }
}

export function buildClaimCandidates() {
  const products = readJson("src/data/products.json");
  const romanianProducts = readJson("src/data/products-ro.json");
  const pages = readJson("src/data/official-pages.json");
  const formula = readJson("src/data/formula-content.json");
  const output = [];

  for (const product of products) {
    for (const field of ["shortDescription", "longDescription", "ingredients", "howToUse"]) {
      collectField({
        output,
        scope: "product",
        contentId: product.slug,
        field,
        value: product[field],
        sourceUrl: product.sourceUrl,
        sourceLastmod: product.sourceLastmod,
      });
    }
    const romanian = romanianProducts[product.slug];
    for (const field of ["shortDescription", "longDescription", "ingredients", "howToUse"]) {
      collectField({
        output,
        scope: "product",
        contentId: `ro:${product.slug}`,
        field,
        value: romanian?.[field],
        sourceUrl: romanian?.sourceUrl ?? product.sourceUrl,
        sourceLastmod: product.sourceLastmod,
        locale: "ro",
      });
    }
  }

  for (const page of pages) {
    collectField({
      output,
      scope: "official-page",
      contentId: page.path,
      field: "description",
      value: page.description,
      sourceUrl: page.sourceUrl,
      sourceLastmod: page.sourceLastmod,
    });
    for (const [index, paragraph] of page.paragraphs.entries()) {
      collectField({
        output,
        scope: "official-page",
        contentId: page.path,
        field: `paragraphs.${index}`,
        value: paragraph,
        sourceUrl: page.sourceUrl,
        sourceLastmod: page.sourceLastmod,
      });
    }
  }

  for (const chapter of formula) {
    for (const field of ["summary", "text"]) {
      collectField({
        output,
        scope: "formula",
        contentId: chapter.id,
        field,
        value: chapter[field],
        sourceUrl: chapter.sourceUrl,
      });
    }
  }

  return output.sort((a, b) =>
    [a.scope, a.contentId, a.field, a.claimText].join("\u001f").localeCompare(
      [b.scope, b.contentId, b.field, b.claimText].join("\u001f"),
      "ru"
    )
  );
}

export const allowedClaimStatuses = new Set([
  "approved",
  "rejected",
  "pending",
]);

export function validateClaimRegistry(registry, candidates) {
  const errors = [];
  const candidateByFingerprint = new Map(
    candidates.map((item) => [item.fingerprint, item])
  );
  const registryByFingerprint = new Map();

  for (const claim of registry) {
    if (registryByFingerprint.has(claim.fingerprint)) {
      errors.push(`Duplicate fingerprint: ${claim.fingerprint}`);
    }
    registryByFingerprint.set(claim.fingerprint, claim);

    if (!allowedClaimStatuses.has(claim.status)) {
      errors.push(`${claim.id}: unsupported status ${claim.status}`);
    }
    if (!claim.sourceUrl?.startsWith("https://")) {
      errors.push(`${claim.id}: sourceUrl must be an HTTPS URL`);
    }
    if (claim.market !== "MD") {
      errors.push(`${claim.id}: market must be MD`);
    }
    if (claim.status !== "pending") {
      if (!claim.reviewer?.trim()) {
        errors.push(`${claim.id}: reviewed claim requires reviewer`);
      }
      if (!claim.reviewedAt || Number.isNaN(Date.parse(claim.reviewedAt))) {
        errors.push(`${claim.id}: reviewed claim requires a valid reviewedAt`);
      }
      if (!claim.approvalReference?.trim()) {
        errors.push(`${claim.id}: reviewed claim requires approvalReference`);
      }
    }
  }

  for (const item of candidates) {
    const claim = registryByFingerprint.get(item.fingerprint);
    if (!claim) {
      errors.push(
        `Missing registry record: ${item.scope}/${item.contentId}/${item.field}`
      );
      continue;
    }
    for (const key of [
      "id",
      "scope",
      "contentId",
      "field",
      "claimText",
      "claimType",
      "sourceUrl",
      "sourceLastmod",
      "market",
    ]) {
      if (claim[key] !== item[key]) {
        errors.push(`${claim.id}: ${key} is out of sync with source content`);
      }
    }
  }

  for (const claim of registry) {
    if (!candidateByFingerprint.has(claim.fingerprint)) {
      errors.push(`${claim.id}: stale registry record`);
    }
  }

  return errors;
}
