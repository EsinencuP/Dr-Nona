import { z } from "zod";

const publicReviewSchema = z.object({
  id: z.string(),
  authorName: z.string(),
  body: z.string(),
  productSlug: z.string().nullable(),
  locale: z.enum(["ru", "ro"]),
  createdAt: z.string().datetime(),
});
const feedSchema = z.object({
  ok: z.literal(true),
  reviews: z.array(publicReviewSchema),
  hasMore: z.boolean(),
});
const acceptedSchema = z.object({ ok: z.literal(true), status: z.literal("PENDING") });
export type PublicReview = z.infer<typeof publicReviewSchema>;
export type ReviewSubmission = {
  authorName: string;
  body: string;
  productSlug: string | null;
  locale: "ru" | "ro";
  consentAccepted: boolean;
  website: string;
};

export async function loadReviews(product: string, page: number, signal: AbortSignal) {
  const query = new URLSearchParams({ page: String(page) });
  if (product) query.set("product", product);
  const response = await fetch(`/api/reviews?${query}`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(12_000)]),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("REVIEWS_UNAVAILABLE");
  return feedSchema.parse(await response.json());
}

export async function submitReview(input: ReviewSubmission, key: string) {
  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(response.status === 429 ? "RATE_LIMITED" : "REVIEW_FAILED");
  acceptedSchema.parse(await response.json());
}
