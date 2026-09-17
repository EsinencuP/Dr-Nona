import snapshotJson from "./data/popularity-snapshot.json";

type PopularitySnapshot = {
  version: 1;
  mode: "fallback" | "ranked";
  source: "crm-completed-orders";
  windowDays: 90;
  generatedAt: string | null;
  expiresAt: string | null;
  sourceDigest: string | null;
  orderedSlugs: string[];
};

const snapshot = snapshotJson as PopularitySnapshot;

export function getPopularityState(now = new Date()) {
  if (snapshot.version !== 1 || snapshot.source !== "crm-completed-orders" || snapshot.windowDays !== 90) {
    throw new Error("Invalid popularity snapshot contract");
  }
  if (snapshot.mode !== "ranked") return { active: false as const, scores: null, generatedAt: null };
  const generatedAt = Date.parse(snapshot.generatedAt ?? "");
  const expiresAt = Date.parse(snapshot.expiresAt ?? "");
  if (
    !Number.isFinite(generatedAt) || !Number.isFinite(expiresAt) ||
    generatedAt >= expiresAt || !snapshot.sourceDigest ||
    new Set(snapshot.orderedSlugs).size !== snapshot.orderedSlugs.length
  ) throw new Error("Invalid approved popularity snapshot");
  if (now.getTime() >= expiresAt || now.getTime() < generatedAt) {
    return { active: false as const, scores: null, generatedAt: null };
  }
  return {
    active: true as const,
    scores: new Map(snapshot.orderedSlugs.map((slug, index) => [slug, index])),
    generatedAt: snapshot.generatedAt,
  };
}
