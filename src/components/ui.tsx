import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { Heart } from "@phosphor-icons/react/Heart";
import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { getProductCopy } from "../claims";
import type { OfficialPage, Product } from "../data";
import { useSelection } from "../features/selection/SelectionContext";
import { useLocale } from "../locales/LocaleProvider";
import { Link } from "../router";
import { ProductImage } from "./ProductImage";

export function splitText(text: string, minLength = 140) {
  if (!text) return [];
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current.length >= minLength) {
      chunks.push(current.trim());
      current = "";
    }
    current += `${sentence.trim()} `;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function formatDate(value: string, locale: "ru" | "ro" = "ru") {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale === "ro" ? "ro-MD" : "ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

const importedPageFallbackTitles: Record<string, string> = {
  "/blog/Mastopathy": "Мастопатия: что нужно знать",
  "/news/happypassover": "С праздником Песах",
  "/news/july-promo": "Июльская акция",
  "/news/ukraine-results-2022": "Итоги 2022 года в Украине",
};

export function getPageTitle(page?: OfficialPage) {
  if (!page) return "";
  return page.title.trim() || page.headings.find((heading) => heading.trim()) || importedPageFallbackTitles[page.path] || "";
}

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.dataset.visible = "true";
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.dataset.visible = "true";
          observer.unobserve(node);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
      <div
        ref={ref}
        className={`reveal ${className}`}
        style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  action,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  text?: string;
  action?: ReactNode;
  align?: "left" | "split";
}) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {(text || action) && (
        <div className="section-heading__aside">
          {text && <p>{text}</p>}
          {action}
        </div>
      )}
    </div>
  );
}

export function ProductCard({
  product,
  compact = false,
  headingLevel = 3,
}: {
  product: Product;
  compact?: boolean;
  headingLevel?: 2 | 3;
}) {
  const { contains, toggle } = useSelection();
  const { t } = useLocale();
  const saved = contains(product.slug);
  const shortDescription = getProductCopy(product, "shortDescription");
  return (
    <article
      className={`product-card ${compact ? "product-card--compact" : ""}`}
      style={{
        "--product-object-scale": product.catalogScale,
        "--product-object-hover-scale": Number(
          (product.catalogScale * 1.012).toFixed(3)
        ),
      } as CSSProperties}
    >
      <div className="product-card__stage">
        <Link to={`/product/${product.slug}`} tabIndex={-1} aria-hidden="true">
          <ProductImage
            className="product-card__image"
            src={product.image}
            alt=""
            width="1600"
            height="1600"
            sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1023px) calc((100vw - 52px) / 2), (max-width: 1380px) calc((100vw - 116px) / 4), 260px"
          />
        </Link>
      </div>
      <div className="product-card__body">
        <div className="product-card__meta">
          <span>{product.category}</span>
        </div>
        {headingLevel === 2 ? (
          <h2>
            <Link to={`/product/${product.slug}`}>{product.officialName}</Link>
          </h2>
        ) : (
          <h3>
            <Link to={`/product/${product.slug}`}>{product.officialName}</Link>
          </h3>
        )}
        <p
          className="product-card__description"
        >
          {shortDescription}
        </p>
        <div className="product-card__actions">
          <Link className="text-link" to={`/product/${product.slug}`}>
            {t.details} <ArrowUpRight aria-hidden="true" />
          </Link>
          <button
            className="save-button"
            type="button"
            aria-label={saved ? t.added : t.add}
            aria-pressed={saved}
            title={saved ? t.added : t.add}
            onClick={() => toggle(product.slug)}
          >
            <Heart aria-hidden="true" weight={saved ? "fill" : "regular"} />
            <span>{saved ? t.added : t.add}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
