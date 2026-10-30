import { BookmarkSimple } from "@phosphor-icons/react/BookmarkSimple";
import { Check } from "@phosphor-icons/react/Check";
import { Drop } from "@phosphor-icons/react/Drop";
import { Leaf } from "@phosphor-icons/react/Leaf";
import { SealCheck } from "@phosphor-icons/react/SealCheck";
import { useEffect } from "react";
import {
  ProductCard,
  SectionHeading,
} from "../components/ui";
import { ProductImage } from "../components/ProductImage";
import { PageBreadcrumbs, ReadingLinks } from "../components/PageNavigation";
import { productImageStyle } from "../features/product/productImagePresentation";
import { getProductTitle } from "../features/product/productNames";
import {
  getProductCopy,
  getProductDisclaimer,
} from "../claims";
import { useProductDetail } from "../features/product/productDetailData";
import { recordProductView } from "../features/contact/utm-capture";
import { ProductSourceText } from "../features/product/ProductSourceText";
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
        selectionHint: "Salvează produsul pentru a-l transmite managerului pentru plasarea comenzii.",
        selectedHint: "Produsul este salvat și va rămâne în comanda ta.",
        openSelection: "Deschide selecția",
        formula: "Despre formula Halo Complex™",
        formulaHint: "Originea și istoria formulei Dr. Nona.",
        order: "Plasează comanda",
        orderHint: "Produsul va fi inclus în formularul comenzii.",
      }
    : {
        overview: "О продукте",
        selectionHint: "Сохраните продукт, чтобы передать его менеджеру для оформления заказа.",
        selectedHint: "Продукт сохранён и останется в вашем заказе.",
        openSelection: "Открыть подборку",
        formula: "О формуле Halo Complex™",
        formulaHint: "Происхождение и история формулы Dr. Nona.",
        order: "Оформить заказ",
        orderHint: "Товар будет передан в форму заказа.",
      };
  if (!product) return <NotFoundPage />;
  const title = getProductTitle(product);
  const saved = contains(product.slug);
  const productLongDescription = getProductCopy(product, "longDescription");
  const productDisclaimer = getProductDisclaimer(product, locale);
  const productIngredients = getProductCopy(product, "ingredients");
  const productHowToUse = getProductCopy(product, "howToUse");
  const categoryPath = `/products?${new URLSearchParams({ category: product.category })}`;

  return (
    <div className="product-page">
      <section className="product-detail container">
        <PageBreadcrumbs current={title} currentLang="en" parents={[
          { to: "/products", label: t.catalog },
          { to: categoryPath, label: product.category },
        ]} />
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
              {productLongDescription && (
                <article className="product-copy-card product-copy-card--overview">
                  <div>
                    <h2>{copy.overview}</h2>
                    <div className="product-source-text" data-testid="full-product-description">
                      <ProductSourceText blocks={product.sourceBlocks} text={productLongDescription} />
                    </div>
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
                <div><dt>{t.category}</dt><dd><Link className="inline-link" to={categoryPath}>{product.category}</Link></dd></div>
              </dl>

            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <ReadingLinks links={[
          { to: "/ourformula", label: copy.formula, description: copy.formulaHint },
          { to: `/contactus?${new URLSearchParams({ products: product.slug })}`, label: copy.order, description: copy.orderHint },
        ]} />
      </div>

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
