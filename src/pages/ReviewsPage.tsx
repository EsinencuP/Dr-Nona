import { useEffect, useState } from "react";
import { PageBreadcrumbs } from "../components/PageNavigation";
import { useProductData } from "../data";
import { ReviewForm } from "../features/reviews/ReviewForm";
import { loadReviews } from "../features/reviews/review-client";
import type { PublicReview } from "../features/reviews/review-client";
import { reviewCopy } from "../features/reviews/review-copy";
import { getProductTitle } from "../features/product/productNames";
import { useLocale } from "../locales/LocaleProvider";
import { Link, useSearchParams } from "../router";
import "../styles/reviews.css";

function ReviewFeed() {
  const { locale } = useLocale();
  const copy = reviewCopy[locale];
  const { productBySlug } = useProductData();
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [hasMore, setHasMore] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let refreshing = false;

    async function refresh() {
      if (refreshing || controller.signal.aborted) return;
      refreshing = true;
      clearTimeout(timer);
      try {
        const nextReviews: PublicReview[] = [];
        let more = false;
        // Refresh every opened page so revoking an older review removes it too.
        for (let currentPage = 1; currentPage <= page; currentPage += 1) {
          const result = await loadReviews("", currentPage, controller.signal);
          nextReviews.push(...result.reviews);
          more = result.hasMore;
          if (!more) break;
        }
        if (controller.signal.aborted) return;
        setReviews([...new Map(nextReviews.map((review) => [review.id, review])).values()]);
        setHasMore(more);
        setState("ready");
      } catch {
        if (!controller.signal.aborted) setState("error");
      } finally {
        refreshing = false;
        if (!controller.signal.aborted) timer = setTimeout(refreshWhenVisible, 3_000);
      }
    }

    function refreshWhenVisible() {
      clearTimeout(timer);
      if (document.visibilityState === "visible") void refresh();
      else if (!controller.signal.aborted) timer = setTimeout(refreshWhenVisible, 3_000);
    }

    void refresh();
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      controller.abort();
      clearTimeout(timer);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [page, retry]);
  return (
    <div className="review-feed">
      {reviews.map((review) => {
        const item = review.productSlug ? productBySlug.get(review.productSlug) : undefined;
        return (
          <article className="review-entry" key={review.id}>
            <div className="review-entry__heading">
              <h2>{review.authorName}</h2>
              <time dateTime={review.createdAt}>
                {new Intl.DateTimeFormat(locale === "ro" ? "ro-MD" : "ru-MD", {
                  dateStyle: "long",
                  timeZone: "Europe/Chisinau",
                }).format(new Date(review.createdAt))}
              </time>
            </div>
            {item ? (
              <Link to={`/product/${item.slug}`}>
                {getProductTitle(item)} · {item.sku ? `SKU ${item.sku}` : copy.missingSku}
              </Link>
            ) : (
              <p className="review-entry__subject">{copy.general}</p>
            )}
            <p className="review-entry__body" lang={review.locale}>
              {review.body}
            </p>
          </article>
        );
      })}
      {state === "loading" && <p role="status">{copy.loading}</p>}
      {state === "error" && (
        <div role="alert">
          <p>{copy.unavailable}</p>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => {
              setState("loading");
              setRetry((value) => value + 1);
            }}
          >
            {copy.retry}
          </button>
        </div>
      )}
      {state === "ready" && !reviews.length && <p className="review-empty">{copy.empty}</p>}
      {state === "ready" && hasMore && (
        <button
          className="button button--secondary"
          type="button"
          onClick={() => {
            setState("loading");
            setPage((value) => value + 1);
          }}
        >
          {copy.more}
        </button>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  const { locale } = useLocale();
  const copy = reviewCopy[locale];
  const { products, productBySlug } = useProductData();
  const [params] = useSearchParams();
  const initial = productBySlug.has(params.get("product") || "") ? params.get("product")! : "";
  useEffect(() => {
    if (window.location.hash !== "#write-review") return;
    const frame = requestAnimationFrame(() => {
      document.getElementById("write-review")?.scrollIntoView();
      document
        .querySelector<HTMLInputElement>('#write-review input[name="authorName"]')
        ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <section className="reviews-page container">
      <PageBreadcrumbs current={copy.title} />
      <header className="reviews-header">
        <h1>{copy.title}</h1>
        <a className="button button--primary" href="#write-review">
          {copy.write}
        </a>
      </header>
      <div className="reviews-layout">
        <section aria-label={copy.all}>
          <ReviewFeed />
        </section>
        <ReviewForm products={products} initialProduct={initial} />
      </div>
    </section>
  );
}
