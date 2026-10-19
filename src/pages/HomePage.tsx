import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { Drop } from "@phosphor-icons/react/Drop";
import { Flask } from "@phosphor-icons/react/Flask";
import { Heart } from "@phosphor-icons/react/Heart";
import { Leaf } from "@phosphor-icons/react/Leaf";
import { TestTube } from "@phosphor-icons/react/TestTube";
import { Pill } from "@phosphor-icons/react/Pill";
import { Atom } from "@phosphor-icons/react/Atom";
import { useState } from "react";
import type { CSSProperties } from "react";
import { getProductCopy } from "../claims";
import { ProductImage } from "../components/ProductImage";
import { getLocalizedProductName, getProductTitle } from "../features/product/productNames";
import { Reveal, SectionHeading, splitText } from "../components/ui";
import type { Product } from "../data";
import homeProducts from "../data/home-products.json";
import { useSelection } from "../features/selection/SelectionContext";
import { useLocale } from "../locales/LocaleProvider";
import { Link } from "../router";

export default function HomePage() {
  const { locale } = useLocale();
  const today = new Date();
  const companyYears = today.getFullYear() - 1994 - Number(today < new Date(today.getFullYear(), 7, 22));
  const yearForm = new Intl.PluralRules(locale).select(companyYears);
  const copy = locale === "ro"
    ? {        heroTagline: "Creat de natură",
        heroLead:
          "Combinăm forța mineralelor Mării Moarte cu cercetarea științifică modernă pentru a crea produse de îngrijire zilnică și frumusețe.",
        heroPrinciples: "Principiile Dr. Nona",
        heroBenefitsHint: "Încă 3 principii — derulați orizontal",        scienceIntro: "Creat de natură. Dezvăluit de știință.",
        scienceFallback:
          "Formula proprie reunește originea Mării Moarte cu abordarea științifică Dr. Nona.",
        formulaStory: "Istoria formulei",
        aboutTitle: "Despre noi",
        aboutIntro:
          "Suntem reprezentanții oficiali ai companiei israeliene Dr. Nona în Moldova, oferind produse originale și o abordare profesionistă pentru fiecare client.",
        aboutMission:
          "Misiunea noastră este să facem produsele originale Dr. Nona accesibile în Moldova, ajutând oamenii să aibă grijă de sănătatea, frumusețea și calitatea vieții lor în fiecare zi.",        editorsChoice: "Recomandarea noastră",
        allProducts: "Toate produsele",
        openProduct: "Vezi produsul",
        saved: "Adăugat",
        add: "Adaugă în selecție",
        moreProducts: "Alte două produse recomandate",
        details: "Detalii",        viewCollection: "Descoperă colecția",        companyHistory: "Istoria companiei",
        historyText:
          "Compania Dr. Nona International a fost fondată la 22 august 1994, pe acoperișul casei doctorului Nona și a lui Mihail Șneerson.",
        continueHistory: "Descoperă istoria",
        years: companyYears === 1 ? "an de istorie" : "de ani de istorie",
      }
    : {        heroTagline: "Сделано природой",
        heroLead:
          "Мы объединяем силу минералов Мёртвого моря и передовые научные разработки, чтобы создавать продукты для ежедневного ухода и красоты.",
        heroPrinciples: "Принципы Dr. Nona",
        heroBenefitsHint: "Ещё 3 принципа — листайте горизонтально",        scienceIntro: "Сделано природой. Раскрыто наукой.",
        scienceFallback:
          "Фирменная формула объединяет происхождение Мёртвого моря и научный подход Dr. Nona.",
        formulaStory: "История формулы",
        aboutTitle: "О нас",
        aboutIntro:
          "Мы являемся официальными представителями израильской компании Dr. Nona в Молдове, предоставляя оригинальную продукцию и профессиональный подход к каждому клиенту.",
        aboutMission:
          "Наша миссия — сделать оригинальную продукцию Dr. Nona доступной в Молдове, помогая людям заботиться о своём здоровье, красоте и качестве жизни каждый день.",        editorsChoice: "Выбор редакции",
        allProducts: "Все продукты",
        openProduct: "Смотреть продукт",
        saved: "Добавлено",
        add: "В подборку",
        moreProducts: "Ещё два продукта",
        details: "Подробнее",        viewCollection: "Смотреть коллекцию",        companyHistory: "История компании",
        historyText:
          "Компания Dr. Nona International была основана 22 августа 1994 года, на крыше дома Доктора Нонны и Михаила Шнеерсона.",
        continueHistory: "Продолжить историю",
        years: yearForm === "one" ? "год истории" : yearForm === "few" ? "года истории" : "лет истории",
      };
  const products = homeProducts[locale] as Product[];
  const productBySlug = new Map(
    products.map((product) => [product.slug, product])
  );
  const { contains, toggle } = useSelection();
  const spotlight =
    productBySlug.get("dynamic-hydrating-cream") ?? products[0];
  const supportingProducts = [
    productBySlug.get("hand-and-nail-treatment"),
    productBySlug.get("gonseen"),
  ].filter((product): product is Product => Boolean(product));
  const promoProduct =
    productBySlug.get("solaris-body-lotion") ?? products[1];
  const lordProducts = [
    productBySlug.get("after-shave-lord"),
    productBySlug.get("lord-deodorant"),
  ].filter((product): product is Product => Boolean(product));
  const spotlightSaved = contains(spotlight.slug);
  const [scienceFocus, setScienceFocus] = useState<"archaea" | "minerals" | "extracts" | "vitamins" | "amino-acids">("minerals");
  const scienceNodes = locale === "ro" ? [
    {
      id: "archaea" as const,
      label: "Arhebacterie",
      description:
        "O componentă naturală unică, provenită din mediul extrem al Mării Moarte.",
      icon: TestTube,
    },
    {
      id: "minerals" as const,
      label: "Mineralele mării",
      description:
        "O bază minerală asociată ecosistemului natural al Mării Moarte.",
      icon: Drop,
    },
    {
      id: "extracts" as const,
      label: "Extracte naturale",
      description:
        "Componentele vegetale completează formulele de îngrijire zilnică.",
      icon: Leaf,
    },
    {
      id: "vitamins" as const,
      label: "Vitamine",
      description: "Vitaminele fac parte din formulele unor produse Dr. Nona, precum Goldseen și Okseen.",
      icon: Pill,
    },
    {
      id: "amino-acids" as const,
      label: "Aminoacizi",
      description: "În formula Phase 9, aminoacizii sunt combinați cu vitamine și minerale.",
      icon: Atom,
    },
  ] : [
    {
      id: "archaea" as const,
      label: "Архебактерия",
      description: "Уникальный природный компонент из экстремальной среды Мёртвого моря.",
      icon: TestTube,
    },
    {
      id: "minerals" as const,
      label: "Минералы моря",
      description: "Минеральная база, связанная с природной экосистемой Мёртвого моря.",
      icon: Drop,
    },
    {
      id: "extracts" as const,
      label: "Природные экстракты",
      description: "Растительные компоненты дополняют формулы ежедневного ухода.",
      icon: Leaf,
    },
    {
      id: "vitamins" as const,
      label: "Витамины",
      description: "Витамины входят в состав отдельных формул Dr. Nona, например Goldseen и Okseen.",
      icon: Pill,
    },
    {
      id: "amino-acids" as const,
      label: "Аминокислоты",
      description: "В составе Phase 9 аминокислоты сочетаются с витаминами и минералами.",
      icon: Atom,
    },
  ];
  const activeScienceNode = scienceNodes.find((node) => node.id === scienceFocus) ?? scienceNodes[1];
  const ActiveScienceIcon = activeScienceNode.icon;
  const formulaParagraph = "";
  const heroBenefits = [
    { icon: Drop, title: locale === "ro" ? "Mineralele Mării Moarte" : "Минералы Мёртвого моря", text: locale === "ro" ? "O sursă naturală unică" : "Уникальный природный источник" },
    { icon: Flask, title: locale === "ro" ? "Cercetare științifică" : "Научные разработки", text: locale === "ro" ? "Formule contemporane" : "Современные формулы" },
    { icon: Leaf, title: locale === "ro" ? "Ingrediente naturale" : "Природные компоненты", text: locale === "ro" ? "Extracte și minerale" : "Экстракты и минералы" },
    { icon: Heart, title: locale === "ro" ? "Grijă pentru dumneavoastră" : "Забота о вас", text: locale === "ro" ? "Îngrijire zilnică" : "Ежедневный уход" },
  ];

  return (
    <>
      <section className="home-hero">
        <div className="home-hero__inner container">
          <div className="hero-copy">
            <h1>
              <span className="hero-title-line hero-title-line--ink">Halo</span>
              <span className="hero-title-line hero-title-line--sea">Complex™</span>
              <small>{copy.heroTagline}</small>
            </h1>
            <p className="hero-lead">
              {copy.heroLead}
            </p>
          </div>
          <div
            className="hero-visual"
            role="img"
            aria-label={locale === "ro" ? "Produse Dr. Nona pe malul Mării Moarte" : "Продукция Dr. Nona на берегу Мёртвого моря"}
          />
        </div>
        <div
          className="hero-benefits container"
          role="region"
          aria-label={copy.heroPrinciples}
          tabIndex={0}
        >
          {heroBenefits.map(({ icon: Icon, title, text }) => (
            <div className="hero-benefit" key={title}>
              <Icon aria-hidden="true" />
              <span><strong>{title}</strong><small>{text}</small></span>
            </div>
          ))}
        </div>
        <p className="hero-benefits__hint container">
          {copy.heroBenefitsHint} <ArrowRight aria-hidden="true" />
        </p>
      </section>

      <section className="science-section" id="halo-science">
        <div className="container science-grid">
          <Reveal className="science-copy">
            <h2>Halo Complex™</h2>
            <p className="science-intro">{copy.scienceIntro}</p>
            <p>
              {formulaParagraph
                ? splitText(formulaParagraph, 260)[0]
                : copy.scienceFallback}
            </p>
            <Link className="button button--light" to="/ourformula">
              {copy.formulaStory} <ArrowRight aria-hidden="true" />
            </Link>
          </Reveal>
          <Reveal className="science-diagram" delay={80}>
            <div className="science-orbit">
              <div className="science-rings" aria-hidden="true">
                <span />
                <span />
                <span />
                <div className="science-core">
                  <b>H</b>
                  <strong>Halo Complex™</strong>
                  <small>{activeScienceNode.label}</small>
                </div>
              </div>
              <div className="science-points">
                {scienceNodes.map(({ id, label, icon: Icon }) => (
                  <button
                    className={scienceFocus === id ? "is-active" : ""}
                    type="button"
                    key={id}
                    aria-pressed={scienceFocus === id}
                    onClick={() => setScienceFocus(id)}
                  >
                    <Icon aria-hidden="true" /><span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="science-focus-panel" aria-live="polite">
              <div className="science-focus-panel__icon" aria-hidden="true">
                <ActiveScienceIcon />
              </div>
              <div>
                <span>{activeScienceNode.label}</span>
                <i aria-hidden="true" />
                <p>{activeScienceNode.description}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="home-about" aria-labelledby="home-about-title">
        <div className="container home-about__inner">
          <Reveal className="home-about__heading">
            <h2 id="home-about-title">{copy.aboutTitle}</h2>
          </Reveal>
          <Reveal className="home-about__body" delay={70}>
            <p>{copy.aboutIntro} {copy.aboutMission}</p>
          </Reveal>
        </div>
      </section>

      <section className="section container home-product-showcase">
        <Reveal>
          <SectionHeading
            title={copy.editorsChoice}
            action={
              <Link className="text-link text-link--large" to="/products">
                {copy.allProducts} <ArrowRight aria-hidden="true" />
              </Link>
            }
            align="split"
          />
        </Reveal>

        <div className="home-product-editorial">
          <Reveal className="home-product-spotlight">
            <article>
              <Link
                className="home-product-spotlight__media"
                to={`/product/${spotlight.slug}`}
                aria-label={`${copy.openProduct}: ${getProductTitle(spotlight)}`}
                style={{
                  "--home-product-scale": Number(
                    (spotlight.catalogScale * 1.18).toFixed(3)
                  ),
                } as CSSProperties}
              >
                <ProductImage
                  src={spotlight.image}
                  alt={spotlight.officialName}
                  width="1254"
                  height="1254"
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 640px) calc(100vw - 28px), (max-width: 960px) 48vw, 620px"
                />
              </Link>
              <div className="home-product-spotlight__body">
                <div className="home-product-spotlight__meta">
                  <small>{spotlight.category}</small>
                </div>
                <h3 lang="en">{getProductTitle(spotlight)}</h3>
                <p>{getLocalizedProductName(spotlight, locale)}</p>
                <div className="home-product-spotlight__actions">
                  <Link className="button button--primary" to={`/product/${spotlight.slug}`}>
                    {copy.openProduct} <ArrowRight aria-hidden="true" />
                  </Link>
                  <button
                    className="save-button"
                    type="button"
                    aria-label={spotlightSaved ? copy.saved : copy.add}
                    aria-pressed={spotlightSaved}
                    onClick={() => toggle(spotlight.slug)}
                  >
                    <Heart
                      aria-hidden="true"
                      weight={spotlightSaved ? "fill" : "regular"}
                    />
                    <span>{spotlightSaved ? copy.saved : copy.add}</span>
                  </button>
                </div>
              </div>
            </article>
          </Reveal>

          <div className="home-product-supporting" aria-label={copy.moreProducts}>
            {supportingProducts.map((product, index) => (
              <Reveal key={product.slug} delay={70 + index * 55}>
                <article
                  className={`home-product-mini${
                    product.slug === "gonseen"
                      ? " home-product-mini--landscape"
                      : ""
                  }`}
                >
                  <Link
                    className="home-product-mini__media"
                    to={`/product/${product.slug}`}
                    tabIndex={-1}
                    aria-hidden="true"
                    style={{
                      "--home-product-scale": Number(
                        (product.catalogScale * 1.15).toFixed(3)
                      ),
                    } as CSSProperties}
                  >
                    <ProductImage
                      src={product.image}
                      alt=""
                      width="1600"
                      height="1600"
                      sizes="(max-width: 640px) 124px, (max-width: 960px) 28vw, 220px"
                    />
                  </Link>
                  <div className="home-product-mini__body">
                    <span>{product.category}</span>
                    <h3 lang="en">
                      <Link to={`/product/${product.slug}`}>
                        {getProductTitle(product)}
                      </Link>
                    </h3>
                    <p className="home-product-mini__name">{getLocalizedProductName(product, locale)}</p>
                    <Link className="text-link" to={`/product/${product.slug}`}>
                      {copy.details} <ArrowUpRight aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="home-campaign-grid">
          <Reveal className="home-promo-banner">
            <article
              style={{
                "--home-promo-scale": Number(
                  (promoProduct.catalogScale * 1.45).toFixed(3)
                ),
                "--home-promo-mobile-scale": Number(
                  (promoProduct.catalogScale * 1.15).toFixed(3)
                ),
              } as CSSProperties}
            >
              <div className="home-promo-banner__stage">
                <ProductImage
                  src={promoProduct.image}
                  alt={promoProduct.officialName}
                  width="1254"
                  height="1254"
                  sizes="(max-width: 640px) calc(100vw - 28px), (max-width: 960px) 48vw, 620px"
                />
              </div>
              <div className="home-promo-banner__content">
                <h3 lang="en">{getProductTitle(promoProduct)}</h3>
                <p>{getLocalizedProductName(promoProduct, locale)}</p>
                <Link className="button button--light" to={`/product/${promoProduct.slug}`}>
                  {copy.openProduct} <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </article>
          </Reveal>

          <Reveal className="home-lord-banner" delay={70}>
            <article>
              <div className="home-lord-banner__visual">
                <picture>
                  <source
                    type="image/avif"
                    srcSet="/collections/lord-collection-480w.avif 480w, /collections/lord-collection-800w.avif 800w, /collections/lord-collection-1200w.avif 1200w"
                    sizes="(max-width: 640px) calc(100vw - 48px), (max-width: 960px) 44vw, 420px"
                  />
                  <source
                    type="image/webp"
                    srcSet="/collections/lord-collection-480w.webp 480w, /collections/lord-collection-800w.webp 800w, /collections/lord-collection-1200w.webp 1200w"
                    sizes="(max-width: 640px) calc(100vw - 48px), (max-width: 960px) 44vw, 420px"
                  />
                  <img
                    src="/collections/lord-collection-800w.webp"
                    alt={
                      locale === "ro"
                        ? "Colecția Lord Dr. Nona: deodorant, parfum și gel de duș"
                        : "Коллекция Lord Dr. Nona: дезодорант, парфюм и гель для душа"
                    }
                    width="1254"
                    height="1254"
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>
              <div className="home-lord-banner__content">
                <h3>Lord</h3>
                {lordProducts[1] &&
                  getProductCopy(lordProducts[1], "shortDescription") && (
                    <p>{getProductCopy(lordProducts[1], "shortDescription")}</p>
                  )}
                <Link className="button button--light" to="/products?q=Lord">
                  {copy.viewCollection} <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      <section className="section container history-preview">
        <Reveal className="history-preview__visual">
          <span className="history-year">1994</span>
          <div className="history-sea" aria-hidden="true" />
          <div className="history-seal"><span>{companyYears}</span><small>{copy.years}</small></div>
        </Reveal>
        <Reveal className="history-preview__copy" delay={90}>
          <h2>{copy.companyHistory}</h2>
          <p>{copy.historyText}</p>
          <Link className="text-link text-link--large" to="/about/our-history">
            {copy.continueHistory} <ArrowRight aria-hidden="true" />
          </Link>
        </Reveal>
      </section>

    </>
  );
}
