import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { BookmarkSimple } from "@phosphor-icons/react/BookmarkSimple";
import { Check } from "@phosphor-icons/react/Check";
import { Drop } from "@phosphor-icons/react/Drop";
import { Leaf } from "@phosphor-icons/react/Leaf";
import { SealCheck } from "@phosphor-icons/react/SealCheck";
import {
  ProductCard,
  SectionHeading,
  splitText,
} from "../components/ui";
import { ProductImage } from "../components/ProductImage";
import {
  getProductCopy,
  getProductDisclaimer,
} from "../claims";
import { useProductData } from "../data";
import {
  buildProductOverview,
  summarizeProductField,
} from "../features/product/productPresentation";
import { useSelection } from "../features/selection/SelectionContext";
import { useLocale } from "../locales/LocaleProvider";
import { Link, useParams } from "../router";
import NotFoundPage from "./NotFoundPage";

export default function ProductPage() {
  const { slug = "" } = useParams();
  const { productBySlug, getRelatedProducts } = useProductData();
  const product = productBySlug.get(slug);
  const { contains, toggle } = useSelection();
  const { locale, t } = useLocale();
  const copy = locale === "ro"
    ? {
        overview: "Despre produs",
        detailEyebrow: "Informații despre produs",
        detailTitle: "Descriere, compoziție și utilizare",
        detailIntro:
          "Informațiile disponibile sunt grupate într-un singur loc, pentru o comparare rapidă și o alegere mai clară.",
        formulaBasis: "Baza formulei",
        usageSummary: "Cum se utilizează",
        selectionHint: "Salvează produsul pentru a-l transmite consultantului împreună cu solicitarea ta.",
        selectedHint: "Produsul este salvat și va rămâne în contextul solicitării tale.",
        openSelection: "Deschide selecția",
        imageCaption: "Imaginea produsului",
        additionalSource: "Informații suplimentare",
        nextStep: "Pasul următor",
      }
    : {
        overview: "О продукте",
        detailEyebrow: "Информация о продукте",
        detailTitle: "Описание, состав и применение",
        detailIntro:
          "Доступные сведения собраны в одном месте, чтобы продукт было проще изучить и сравнить.",
        formulaBasis: "Основа формулы",
        usageSummary: "Как использовать",
        selectionHint: "Сохраните продукт, чтобы передать его консультанту вместе с вашей заявкой.",
        selectedHint: "Продукт сохранён и останется в контексте вашей заявки.",
        openSelection: "Открыть подборку",
        imageCaption: "Изображение продукта",
        additionalSource: "Дополнительные данные",
        nextStep: "Следующий шаг",
      };
  if (!product) return <NotFoundPage />;
  const related = getRelatedProducts(product);
  const saved = contains(product.slug);
  const productShortDescription = getProductCopy(product, "shortDescription");
  const productLongDescription = getProductCopy(product, "longDescription");
  const productDisclaimer = getProductDisclaimer(product, locale);
  const productIngredients = getProductCopy(product, "ingredients");
  const productHowToUse = getProductCopy(product, "howToUse");
  const productOverview = buildProductOverview(
    {
      officialName: product.officialName,
      category: product.category,
      longDescription: productLongDescription,
      ingredients: productIngredients,
      howToUse: productHowToUse,
    },
    locale
  );
  const overviewParagraphs = splitText(productOverview, 300);
  const productSummary = summarizeProductField(productOverview, 240);
  const ingredientSummary = summarizeProductField(productIngredients);
  const usageSummary = summarizeProductField(productHowToUse);

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
          <figure className="product-stage">
            <ProductImage
              src={product.image}
              alt={product.imageAlt || product.officialName}
              width="1200"
              height="1200"
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 960px) calc(100vw - 36px), 46vw"
            />
            <figcaption className="product-stage__caption">
              {copy.imageCaption} · Dr. Nona
            </figcaption>
          </figure>
          <div className="product-info">
            <div className="product-info__kicker">
              <p className="eyebrow">{product.category}</p>
              <span>Dr. Nona Moldova</span>
            </div>
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
            <p className="product-description">{productSummary}</p>
            {(ingredientSummary || usageSummary) && (
              <div className="product-highlights" role="list" aria-label={copy.detailEyebrow}>
                {ingredientSummary && (
                  <div className="product-highlight" role="listitem">
                    <Leaf aria-hidden="true" />
                    <div>
                      <strong>{copy.formulaBasis}</strong>
                      <p>{ingredientSummary}</p>
                    </div>
                  </div>
                )}
                {usageSummary && (
                  <div className="product-highlight" role="listitem">
                    <Drop aria-hidden="true" />
                    <div>
                      <strong>{copy.usageSummary}</strong>
                      <p>{usageSummary}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
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
      </section>

      <section className="product-knowledge container">
        <div className="product-knowledge__intro">
          <p className="eyebrow">{copy.detailEyebrow}</p>
          <h2>{copy.detailTitle}</h2>
          <p>{copy.detailIntro}</p>
        </div>
        <div className="product-knowledge__content">
          <article className="product-copy-card product-copy-card--overview">
            <span className="product-copy-card__index" aria-hidden="true">01</span>
            <div>
              <h3>{copy.overview}</h3>
              {overviewParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
          <div className="product-specification-grid">
            {productIngredients && (
              <article className="product-copy-card">
                <Leaf aria-hidden="true" />
                <div>
                  <h3>{t.ingredients}</h3>
                  <p>{productIngredients}</p>
                </div>
              </article>
            )}
            {productHowToUse && (
              <article className="product-copy-card">
                <Drop aria-hidden="true" />
                <div>
                  <h3>{t.use}</h3>
                  <p>{productHowToUse}</p>
                </div>
              </article>
            )}
          </div>
          <div className="product-source-links">
            <a className="official-source-link" href={product.sourceUrl} target="_blank" rel="noreferrer">
              {t.source}: drnona.md <ArrowUpRight aria-hidden="true" />
            </a>
            {product.officialSourceUrl && (
              <a className="official-source-link" href={product.officialSourceUrl} target="_blank" rel="noreferrer">
                {copy.additionalSource}: drnona.com <ArrowUpRight aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="section container related-section">
        <SectionHeading eyebrow={copy.nextStep} title={t.related} />
        <div className="related-grid">
          {related.map((item) => (
            <ProductCard key={item.slug} product={item} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
