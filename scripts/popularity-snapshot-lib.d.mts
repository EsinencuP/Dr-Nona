export const POPULARITY_MIN_ORDERS: 10;
export const POPULARITY_MIN_CLIENTS: 5;

export type PopularityCandidate = {
  version: 1;
  source: "crm-completed-orders";
  status: "ready" | "insufficient";
  windowDays: 90;
  windowStart: string;
  generatedAt: string;
  expiresAt: string;
  eligibleOrders: number;
  distinctClients: number;
  counts: Array<{ slug: string; orderCount: number }>;
  quarantinedSlugs: string[];
};

export type PopularitySnapshot = {
  version: 1;
  mode: "fallback" | "ranked";
  source: "crm-completed-orders";
  windowDays: 90;
  generatedAt: string | null;
  expiresAt: string | null;
  sourceDigest: string | null;
  orderedSlugs: string[];
};

export function preparePopularitySnapshot(
  candidate: PopularityCandidate,
  products: Array<{ slug: string; sku: string; officialOrder: number; publicationStatus: string }>,
  now?: Date,
): PopularitySnapshot | null;

export function validatePopularitySnapshot(
  snapshot: PopularitySnapshot,
  products: Array<{ slug: string; publicationStatus: string }>,
): void;
