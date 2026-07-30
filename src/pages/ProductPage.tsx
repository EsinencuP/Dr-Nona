import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { BookmarkSimple } from "@phosphor-icons/react/BookmarkSimple";
import { Check } from "@phosphor-icons/react/Check";
import { SealCheck } from "@phosphor-icons/react/SealCheck";
import { useState } from "react";
import {
  ClaimsReviewNotice,
  ProductCard,
  SectionHeading,
  splitText,
} from "../components/ui";
import {
  getProductCopy,
  getProductDisclaimer,
} from "../claims";
import {
  isProductContentFieldApplicable,
  useProductData,
} from "../data";
import { useSelection } from "../features/selection/SelectionContext";
import { useLocale } from "../locales/LocaleProvider";
import { Link, useParams } from "../router";
import NotFoundPage from "./NotFoundPage";

export default function ProductPage() {
  const { slug = "" } = useParams();
  const { productBySlug, getRelatedProducts } = useProductData();
  const product = productBySlug.get(slug);
  const { contains, toggle } = useSelection();
  const { t } = useLocale();
  const [openPanel, setOpenPanel] = useState<"description" | "ingredients" | "use" | null>("ingredients");
  if (!product) return <NotFoundPage />;
  const related = getRelatedProducts(product);
  const saved = contains(product.slug);
  const productShortDescription = getProductCopy(product, "shortDescription");
  const productLongDescription = getProductCopy(product, "longDescription");
  const productSummary = splitText(productLongDescription, 330)[0];
  const productDisclaimer = getProductDisclaimer(product);
  const productSections: Array<{
    key: "description" | "ingredients" | "use";
    label: string;
    content: string;
  }> = [];
  if (isProductContentFieldApplicable(product, "longDescription")) {
    productSections.push({
      key: "description",
      label: "Полное описание",
      content: productLongDescription,
    });
  }
  if (isProductContentFieldApplicable(product, "ingredients")) {
    productSections.push({
      key: "ingredients",
      label: t.ingredients,
      content: product.ingredients,
    });
  }
  if (isProductContentFieldApplicable(product, "howToUse")) {
    productSections.push({
      key: "use",
      label: t.use,
      content: product.howToUse,
    });
  }

  return (
    <div className="product-page">
      <section className="product-detail container">
        <nav className="breadcrumbs" aria-label={t.breadcrumbs}>
          <Link to="/">{t.home}</Link>
          <span aria-hidden="true">/</span>
          <Link to="/products">{t.catalog}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{product.officialName}</span>
        </nav>
        <div className="product-detail__grid">
          <div className="product-stage">
            <div className="product-stage__rings" aria-hidden="true" />
            <span className="product-stage__index">DN · {product.sku || "—"}</span>
            <img
              src={product.cardImage}
              alt={product.imageAlt || product.officialName}
              width="1200"
              height="1200"
              fetchPriority="high"
            />
            <span className="product-stage__caption">{product.category}</span>
          </div>
          <div className="product-info">
            <p className="eyebrow">{product.category}</p>
            <h1
              className={
                product.officialName.length > 60
                  ? "product-title product-title--long"
                  : product.officialName.length > 36
                    ? "product-title product-title--medium"
                    : "product-title"
              }
            >
              {product.officialName}
            </h1>
            {productShortDescription && (
              <p className="product-purpose">{productShortDescription}</p>
            )}
            <ClaimsReviewNotice scope="product" contentId={product.slug} compact />
            {productDisclaimer && (
              <aside
                className="product-disclaimer"
                role="note"
                data-testid="product-disclaimer"
              >
                <SealCheck aria-hidden="true" />
                <div>
                  <strong>{productDisclaimer.title}</strong>
                  <p>{productDisclaimer.text}</p>
                </div>
              </aside>
            )}
            <button
              className="button button--primary product-select-button"
              type="button"
              aria-pressed={saved}
              onClick={() => toggle(product.slug)}
            >
              {saved ? <Check aria-hidden="true" /> : <BookmarkSimple aria-hidden="true" />}
              {saved ? t.added : t.add}
            </button>
            {productSummary && (
              <p className="product-description">{productSummary}</p>
            )}
            <dl className="product-facts">
              <div><dt>{t.category}</dt><dd>{product.category}</dd></div>
              <div><dt>{t.sku}</dt><dd>{product.sku || "—"}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="product-knowledge container">
        <div className="product-knowledge__intro">
          <p className="eyebrow">Подробно о продукте</p>
          <h2>Состав и применение</h2>
          <p>Информация перенесена с официальной страницы продукта Dr. Nona.</p>
        </div>
        <div className="accordion">
          {productSections.map(({ key, label, content }) => {
            const triggerId = `product-${product.slug}-${key}-trigger`;
            const panelId = `product-${product.slug}-${key}-panel`;
            const isOpen = openPanel === key;
            return (
              <div className="accordion-item" key={key}>
                <button
                  id={triggerId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenPanel(isOpen ? null : key)}
                >
                  <span>{label}</span>
                  <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                <div
                  id={panelId}
                  className="accordion-content"
                  role="region"
                  aria-labelledby={triggerId}
                  hidden={!isOpen}
                >
                  <p>
                    {content ||
                      "Описание свойств временно скрыто до завершения проверки для рынка Молдовы."}
                  </p>
                </div>
              </div>
            );
          })}
          <a className="official-source-link" href={product.sourceUrl} target="_blank" rel="noreferrer">
            {t.source}: drnona.com <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="section container related-section">
        <SectionHeading eyebrow="Следующий шаг" title={t.related} />
        <div className="related-grid">
          {related.map((item) => (
            <ProductCard key={item.slug} product={item} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
