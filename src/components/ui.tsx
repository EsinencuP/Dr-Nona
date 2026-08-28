import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { Heart } from "@phosphor-icons/react/Heart";
import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { getProductCopy } from "../claims";
import type { OfficialPage, Product } from "../data";
import { useSelection } from "../features/selection/SelectionContext";
import { useLocale } from "../locales/LocaleProvider";
import { Link } from "../router";

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

export function formatDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ru-RU", {
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

const neutralProductDescriptions: Record<string, string> = {
  "Кремы": "Крем для ежедневного ухода за кожей.",
  "Напитки": "Напиток из ассортимента Dr. Nona.",
  "Пищевые добавки": "Пищевая добавка из ассортимента Dr. Nona.",
  "Уход за лицом": "Ежедневный уход за кожей лица.",
  "Уход за телом": "Ежедневный уход за кожей тела.",
  "Уход за руками": "Ежедневный уход за руками и ногтями.",
  "Фитокомплексы": "Травяной напиток в индивидуальных пакетиках.",
  "Гигиена": "Компактный формат для очищения кожи.",
  "Дезодоранты": "Дезодорант-антиперспирант для ежедневного использования.",
  "Парфюмерия": "Аромат из парфюмерной коллекции Dr. Nona.",
};

export function ProductCard({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const { contains, toggle } = useSelection();
  const { t } = useLocale();
  const saved = contains(product.slug);
  const shortDescription =
    getProductCopy(product, "shortDescription") ||
    neutralProductDescriptions[product.category] ||
    "Продукт для ежедневного ухода.";
  return (
    <article className={`product-card ${compact ? "product-card--compact" : ""}`}>
      <div className="product-card__stage">
        <Link to={`/product/${product.slug}`} tabIndex={-1} aria-hidden="true">
          <img
            className="product-card__image"
            src={product.image}
            alt=""
            width="1600"
            height="1600"
            loading="lazy"
            decoding="async"
          />
        </Link>
      </div>
      <div className="product-card__body">
        <div className="product-card__meta">
          <span>{product.category}</span>
        </div>
        <h3>
          <Link to={`/product/${product.slug}`}>{product.officialName}</Link>
        </h3>
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
