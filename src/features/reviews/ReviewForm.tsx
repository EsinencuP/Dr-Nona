import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Product } from "../../data";
import { useLocale } from "../../locales/LocaleProvider";
import { Link } from "../../router";
import { getProductTitle } from "../product/productNames";
import { submitReview } from "./review-client";
import { reviewCopy } from "./review-copy";

export function ReviewForm({
  products,
  initialProduct,
}: {
  products: Product[];
  initialProduct: string;
}) {
  const { locale } = useLocale();
  const copy = reviewCopy[locale];
  const [status, setStatus] = useState<"idle" | "sending" | "accepted" | "error" | "rate">("idle");
  const attempt = useRef({ payload: "", key: "" });
  const feedback = useRef<HTMLParagraphElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending" || status === "accepted") return;
    const form = new FormData(event.currentTarget);
    const input = {
      authorName: String(form.get("authorName") || "").trim(),
      body: String(form.get("body") || "").trim(),
      productSlug: String(form.get("productSlug") || "") || null,
      locale,
      consentAccepted: form.get("consentAccepted") === "on",
      website: String(form.get("website") || ""),
    };
    const payload = JSON.stringify(input);
    if (attempt.current.payload !== payload)
      attempt.current = { payload, key: crypto.randomUUID() };
    setStatus("sending");
    try {
      await submitReview(input, attempt.current.key);
      setStatus("accepted");
    } catch (error) {
      setStatus(error instanceof Error && error.message === "RATE_LIMITED" ? "rate" : "error");
    }
    requestAnimationFrame(() => feedback.current?.focus());
  }

  return (
    <section id="write-review" className="review-form-panel" aria-labelledby="review-form-title">
      <h2 id="review-form-title">{copy.write}</h2>
      <p>{copy.formIntro}</p>
      {status === "accepted" ? (
        <>
          <p ref={feedback} tabIndex={-1} role="status">
            {copy.accepted}
          </p>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => {
              attempt.current = { payload: "", key: "" };
              setStatus("idle");
            }}
          >
            {copy.another}
          </button>
        </>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="review-form">
          <fieldset disabled={status === "sending"}>
            <label>
              <span>{copy.name}</span>
              <input
                name="authorName"
                required
                minLength={2}
                maxLength={80}
                autoComplete="given-name"
              />
            </label>
            <div className="review-field">
              <label htmlFor="review-product">{copy.product}</label>
              <select id="review-product" name="productSlug" defaultValue={initialProduct}>
                <option value="">{copy.general}</option>
                {products.map((product) => (
                  <option key={product.slug} value={product.slug}>
                    {getProductTitle(product)}
                  </option>
                ))}
              </select>
            </div>
            <label>
              <span>{copy.body}</span>
              <textarea name="body" required minLength={10} maxLength={3000} rows={6} />
            </label>
            <label className="application-honeypot" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <label className="review-consent">
              <input type="checkbox" name="consentAccepted" required />
              <span>{copy.consent}</span>
            </label>
            <Link to="/privacypolicy">{copy.privacy}</Link>
            <button className="button button--primary" type="submit">
              {status === "sending" ? copy.sending : copy.submit}
            </button>
          </fieldset>
          {(status === "error" || status === "rate") && (
            <p ref={feedback} tabIndex={-1} role="alert">
              {status === "rate" ? copy.rate : copy.error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
