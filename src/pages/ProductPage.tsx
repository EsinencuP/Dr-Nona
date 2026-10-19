import { BookmarkSimple } from "@phosphor-icons/react/BookmarkSimple";
import { Check } from "@phosphor-icons/react/Check";
import { Drop } from "@phosphor-icons/react/Drop";
import { Leaf } from "@phosphor-icons/react/Leaf";
import { SealCheck } from "@phosphor-icons/react/SealCheck";
import { useEffect } from "react";
import {
  ProductCard,
  SectionHeading,
  splitText,
} from "../components/ui";
import { ProductImage } from "../components/ProductImage";
import { withoutExternalReferences } from "../components/contentText";
import { productImageStyle } from "../features/product/productImagePresentation";
import { getProductTitle } from "../features/product/productNames";
import {
  getProductCopy,
  getProductDisclaimer,
} from "../claims";
import { useProductDetail } from "../features/product/productDetailData";
import { recordProductView } from "../features/contact/utm-capture";
import { buildProductOverview } from "../features/product/productPresentation";
import { useSelection } from "../features/selection/SelectionContext";
import { useLocale } from "../locales/LocaleProvider";
import { Link, useParams } from "../router";
import NotFoundPage from "./NotFoundPage";

export default function ProductPage() {
  const { slug = "" } = useParams();
  const { product, related } = useProductDetail(slug);
  const { contains, toggle } = useSelection();
  const { locale, t } = useLocale();
  useEffect(() => {
    if (product) recordProductView(product.slug);
  }, [product]);
  const copy = locale === "ro"
    ? {
        overview: "Despre produs",
        selectionHint: "Salvează produsul pentru a-l transmite consultantului împreună cu solicitarea ta.",
        selectedHint: "Produsul este salvat și va rămâne în contextul solicitării tale.",
        openSelection: "Deschide selecția",      }
    : {
        overview: "О продукте",
        selectionHint: "Сохраните продукт, чтобы передать его консультанту вместе с вашей заявкой.",
        selectedHint: "Продукт сохранён и останется в контексте вашей заявки.",
        openSelection: "Открыть подборку",      };
  if (!product) return <NotFoundPage />;
  const title = getProductTitle(product);
  const saved = contains(product.slug);
  const productLongDescription = withoutExternalReferences(getProductCopy(product, "longDescription"));
  const productDisclaimer = getProductDisclaimer(product, locale);
  const productIngredients = withoutExternalReferences(getProductCopy(product, "ingredients"));
  const productHowToUse = withoutExternalReferences(getProductCopy(product, "howToUse"));
  const productOverview = buildProductOverview({ longDescription: productLongDescription });
  const overviewParagraphs = splitText(productOverview, 300);

  return (
    <div className="product-page">
      <section className="product-detail container">
        <nav className="breadcrumbs" aria-label={t.breadcrumbs}>
          <Link to="/">{t.home}</Link>
          <span aria-hidden="true">/</span>
          <Link to="/products">{t.catalog}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" lang="en">{title}</span>
        </nav>
        <div className="product-detail__grid">
          <div className="product-info">
            <header className="product-identity">
              <h1
                lang="en"
                className={
                  title.length > 60
                    ? "product-title product-title--long"
                    : title.length > 36
                      ? "product-title product-title--medium"
                      : "product-title"
                }
              >
                {title}
              </h1>
            </header>
            <figure className="product-stage" style={productImageStyle(product.slug)}>
              <div className="product-stage__media">
                <ProductImage
                  src={product.image}
                  alt={product.imageAlt || product.officialName}
                  width="1200"
                  height="1200"
                  loading="eager"
                  fetchPriority="high"
                  sizes="(max-width: 960px) 320px, 560px"
                />
              </div>
            </figure>
            <div className="product-knowledge__content">
              {overviewParagraphs.length > 0 && (
                <article className="product-copy-card product-copy-card--overview">
                  <div>
                    <h2>{copy.overview}</h2>
                    {overviewParagraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </article>
              )}
              <div className="product-specification-grid">
                {productIngredients && (
                  <article className="product-copy-card">
                    <Leaf aria-hidden="true" />
                    <div>
                      <h2>{t.ingredients}</h2>
                      <p>{productIngredients}</p>
                    </div>
                  </article>
                )}
                {productHowToUse && (
                  <article className="product-copy-card">
                    <Drop aria-hidden="true" />
                    <div>
                      <h2>{t.use}</h2>
                      <p>{productHowToUse}</p>
                    </div>
                  </article>
                )}
              </div>
            </div>
            <div className="product-decision">
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
              <div className="product-action-panel">
                <button
                  className="button button--primary product-select-button"
                  type="button"
                  aria-pressed={saved}
                  onClick={() => toggle(product.slug)}
                >
                  {saved ? <Check aria-hidden="true" /> : <BookmarkSimple aria-hidden="true" />}
                  {saved ? t.added : t.add}
                </button>
                <div>
                  <p aria-live="polite">{saved ? copy.selectedHint : copy.selectionHint}</p>
                  {saved && <Link to="/selection">{copy.openSelection} →</Link>}
                </div>
              </div>
              <dl className="product-facts">
                <div><dt>{t.sku}</dt><dd>{product.sku || "NV"}</dd></div>
                <div><dt>{t.category}</dt><dd>{product.category}</dd></div>
              </dl>

            </div>
          </div>
        </div>
      </section>

      <section className="section container related-section">
        <SectionHeading title={t.related} />
        <div className="related-grid">
          {related.map((item) => (
            <ProductCard key={item.slug} product={item} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
