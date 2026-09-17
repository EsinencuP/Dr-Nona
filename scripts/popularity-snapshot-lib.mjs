import { createHash } from "node:crypto";

export const POPULARITY_MIN_ORDERS = 10;
export const POPULARITY_MIN_CLIENTS = 5;
const DAY = 24 * 60 * 60 * 1000;

function assert(condition, message) {
  if (!condition) throw new Error(`Popularity snapshot: ${message}`);
}

function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).sort().join("|") === [...keys].sort().join("|");
}

function published(products) {
  return products.filter((product) => product.publicationStatus === "published");
}

export function preparePopularitySnapshot(candidate, products, now = new Date()) {
  const keys = ["version", "source", "status", "windowDays", "windowStart", "generatedAt", "expiresAt", "eligibleOrders", "distinctClients", "counts", "quarantinedSlugs"];
  assert(exactKeys(candidate, keys), "candidate contains missing or unexpected fields");
  assert(candidate.version === 1 && candidate.source === "crm-completed-orders" && candidate.windowDays === 90, "unsupported source contract");
  assert(Array.isArray(candidate.quarantinedSlugs) && candidate.quarantinedSlugs.length === 0, "unknown product slugs require quarantine");
  assert(Number.isSafeInteger(candidate.eligibleOrders) && candidate.eligibleOrders >= 0, "invalid order sample");
  assert(Number.isSafeInteger(candidate.distinctClients) && candidate.distinctClients >= 0 && candidate.distinctClients <= candidate.eligibleOrders, "invalid client sample");
  assert(candidate.status === "ready" || candidate.status === "insufficient", "invalid candidate status");
  const generatedAt = Date.parse(candidate.generatedAt);
  const expiresAt = Date.parse(candidate.expiresAt);
  const windowStart = Date.parse(candidate.windowStart);
  assert(Number.isFinite(generatedAt) && Number.isFinite(expiresAt) && Number.isFinite(windowStart), "invalid dates");
  assert(Math.abs(generatedAt - windowStart - 90 * DAY) < 1_000, "incorrect 90-day window");
  assert(expiresAt > generatedAt && expiresAt - generatedAt <= 7 * DAY, "invalid expiry");
  assert(generatedAt <= now.getTime() && now.getTime() < expiresAt, "candidate is future-dated or stale");
  assert(Array.isArray(candidate.counts), "missing product counts");

  const productsBySlug = new Map(published(products).map((product) => [product.slug, product]));
  const seen = new Set();
  for (const item of candidate.counts) {
    assert(exactKeys(item, ["slug", "orderCount"]), "invalid product count record");
    assert(typeof item.slug === "string" && productsBySlug.has(item.slug) && !seen.has(item.slug), "unknown or duplicate product slug");
    assert(Number.isSafeInteger(item.orderCount) && item.orderCount > 0 && item.orderCount <= candidate.eligibleOrders, "invalid product order count");
    seen.add(item.slug);
  }
  if (candidate.status === "insufficient") return null;
  assert(candidate.eligibleOrders >= POPULARITY_MIN_ORDERS && candidate.distinctClients >= POPULARITY_MIN_CLIENTS, "sample is below publication threshold");

  const counts = new Map(candidate.counts.map((item) => [item.slug, item.orderCount]));
  const orderedSlugs = [...productsBySlug.values()]
    .sort((left, right) =>
      (counts.get(right.slug) ?? 0) - (counts.get(left.slug) ?? 0) ||
      left.officialOrder - right.officialOrder || left.sku.localeCompare(right.sku))
    .map((product) => product.slug);
  return {
    version: 1,
    mode: "ranked",
    source: "crm-completed-orders",
    windowDays: 90,
    generatedAt: candidate.generatedAt,
    expiresAt: candidate.expiresAt,
    sourceDigest: createHash("sha256").update(JSON.stringify(candidate)).digest("hex"),
    orderedSlugs,
  };
}

export function validatePopularitySnapshot(snapshot, products) {
  const keys = ["version", "mode", "source", "windowDays", "generatedAt", "expiresAt", "sourceDigest", "orderedSlugs"];
  assert(exactKeys(snapshot, keys), "approved snapshot has missing or unexpected fields");
  assert(snapshot.version === 1 && snapshot.source === "crm-completed-orders" && snapshot.windowDays === 90, "invalid approved source");
  assert(Array.isArray(snapshot.orderedSlugs), "invalid ranked products");
  if (snapshot.mode === "fallback") {
    assert(snapshot.generatedAt === null && snapshot.expiresAt === null && snapshot.sourceDigest === null && snapshot.orderedSlugs.length === 0, "invalid fallback snapshot");
    return;
  }
  assert(snapshot.mode === "ranked", "invalid snapshot mode");
  assert(typeof snapshot.sourceDigest === "string" && /^[a-f0-9]{64}$/u.test(snapshot.sourceDigest), "invalid candidate digest");
  const generatedAt = Date.parse(snapshot.generatedAt);
  const expiresAt = Date.parse(snapshot.expiresAt);
  assert(Number.isFinite(generatedAt) && Number.isFinite(expiresAt) && expiresAt > generatedAt && expiresAt - generatedAt <= 7 * DAY, "invalid snapshot dates");
  const publishedSlugs = new Set(published(products).map((product) => product.slug));
  assert(snapshot.orderedSlugs.length === publishedSlugs.size, "ranked snapshot must cover all published products");
  assert(new Set(snapshot.orderedSlugs).size === publishedSlugs.size && snapshot.orderedSlugs.every((slug) => publishedSlugs.has(slug)), "ranked snapshot has missing or unknown slugs");
}
