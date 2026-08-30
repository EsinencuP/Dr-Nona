import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { Drop } from "@phosphor-icons/react/Drop";
import { Flask } from "@phosphor-icons/react/Flask";
import { Heart } from "@phosphor-icons/react/Heart";
import { Leaf } from "@phosphor-icons/react/Leaf";
import { TestTube } from "@phosphor-icons/react/TestTube";
import { useState } from "react";
import { getProductCopy } from "../claims";
import { ArticleCard } from "../components/ArticleCard";
import { ProductImage } from "../components/ProductImage";
import { Reveal, SectionHeading, splitText } from "../components/ui";
import type { OfficialPage, Product } from "../data";
import runtimeContent from "../data/runtime-content.json";
import { useSelection } from "../features/selection/SelectionContext";
import { Link } from "../router";

export default function HomePage() {
  const products = runtimeContent.home.products as Product[];
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
  const articles = runtimeContent.home.editorial as OfficialPage[];
  const [scienceFocus, setScienceFocus] = useState<"archaea" | "minerals" | "extracts">("minerals");
  const scienceNodes = [
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
  ];
  const activeScienceNode = scienceNodes.find((node) => node.id === scienceFocus) ?? scienceNodes[1];
  const ActiveScienceIcon = activeScienceNode.icon;
  const formulaParagraph = "";
  const heroBenefits = [
    { icon: Drop, title: "Минералы Мёртвого моря", text: "Уникальный природный источник" },
    { icon: Flask, title: "Научные разработки", text: "Современные формулы" },
    { icon: Leaf, title: "Природные компоненты", text: "Экстракты и минералы" },
    { icon: Heart, title: "Забота о вас", text: "Ежедневный уход" },
  ];

  return (
    <>
      <section className="home-hero">
        <div className="home-hero__inner container">
          <div className="hero-copy">
            <p className="eyebrow">Мёртвое море · Наука · Dr. Nona</p>
            <h1>
              <span className="hero-title-line hero-title-line--ink">Halo</span>
              <span className="hero-title-line hero-title-line--sea">Complex™</span>
              <small>Сделано природой</small>
            </h1>
            <p className="hero-lead">
              Мы объединяем силу минералов Мёртвого моря и передовые научные разработки,
              чтобы создавать продукты для ежедневного ухода и красоты.
            </p>
          </div>
          <div
            className="hero-visual"
            role="img"
            aria-label="Halo Night Cream в пейзаже Мёртвого моря"
          />
        </div>
        <div
          className="hero-benefits container"
          role="region"
          aria-label="Принципы Dr. Nona"
          tabIndex={0}
        >
          {heroBenefits.map(({ icon: Icon, title, text }) => (
            <div className="hero-benefit" key={title}>
              <Icon aria-hidden="true" />
              <span><strong>{title}</strong><small>{text}</small></span>
            </div>
          ))}
        </div>
      </section>

      <section className="science-section" id="halo-science">
        <div className="container science-grid">
          <Reveal className="science-copy">
            <p className="eyebrow eyebrow--light">Наука</p>
            <h2>Halo Complex™</h2>
            <p className="science-intro">Сделано природой. Раскрыто наукой.</p>
            <p>
              {formulaParagraph
                ? splitText(formulaParagraph, 260)[0]
                : "Фирменная формула объединяет происхождение Мёртвого моря и научный подход Dr. Nona."}
            </p>
            <Link className="button button--light" to="/ourformula">
              История формулы <ArrowRight aria-hidden="true" />
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

      <section className="section container home-product-showcase">
        <Reveal>
          <SectionHeading
            eyebrow="Продукты"
            title="Выбор редакции"
            action={
              <Link className="text-link text-link--large" to="/products">
                Все продукты <ArrowRight aria-hidden="true" />
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
                aria-label={`Открыть ${spotlight.officialName}`}
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
                  <span>Выбор редакции</span>
                  <small>{spotlight.category}</small>
                </div>
                <h3>{spotlight.officialName}</h3>
                {getProductCopy(spotlight, "shortDescription") && (
                  <p>{getProductCopy(spotlight, "shortDescription")}</p>
                )}
                <div className="home-product-spotlight__actions">
                  <Link className="button button--primary" to={`/product/${spotlight.slug}`}>
                    Смотреть продукт <ArrowRight aria-hidden="true" />
                  </Link>
                  <button
                    className="save-button"
                    type="button"
                    aria-label={spotlightSaved ? "Добавлено" : "В подборку"}
                    aria-pressed={spotlightSaved}
                    onClick={() => toggle(spotlight.slug)}
                  >
                    <Heart
                      aria-hidden="true"
                      weight={spotlightSaved ? "fill" : "regular"}
                    />
                    <span>{spotlightSaved ? "Добавлено" : "В подборку"}</span>
                  </button>
                </div>
              </div>
            </article>
          </Reveal>

          <div className="home-product-supporting" aria-label="Ещё два продукта">
            {supportingProducts.map((product, index) => (
              <Reveal key={product.slug} delay={70 + index * 55}>
                <article className="home-product-mini">
                  <Link
                    className="home-product-mini__media"
                    to={`/product/${product.slug}`}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <ProductImage
                      src={product.image}
                      alt=""
                      width="1600"
                      height="1600"
                      sizes="(max-width: 640px) 108px, (max-width: 960px) 28vw, 220px"
                    />
                  </Link>
                  <div className="home-product-mini__body">
                    <span>{product.category}</span>
                    <h3>
                      <Link to={`/product/${product.slug}`}>
                        {product.officialName}
                      </Link>
                    </h3>
                    <Link className="text-link" to={`/product/${product.slug}`}>
                      Подробнее <ArrowUpRight aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="home-campaign-grid">
          <Reveal className="home-promo-banner">
            <article>
              <ProductImage
                src={promoProduct.image}
                alt={promoProduct.officialName}
                width="1254"
                height="1254"
                sizes="(max-width: 640px) calc(100vw - 28px), (max-width: 960px) 48vw, 620px"
              />
              <div className="home-promo-banner__content">
                <span>Промо-фокус</span>
                <h3>{promoProduct.officialName}</h3>
                {getProductCopy(promoProduct, "shortDescription") && (
                  <p>{getProductCopy(promoProduct, "shortDescription")}</p>
                )}
                <Link className="button button--light" to={`/product/${promoProduct.slug}`}>
                  Открыть продукт <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </article>
          </Reveal>

          <Reveal className="home-lord-banner" delay={70}>
            <article>
              <div className="home-lord-banner__visual" aria-hidden="true">
                {lordProducts.map((product) => (
                  <ProductImage
                    key={product.slug}
                    src={product.image}
                    alt=""
                    width="1254"
                    height="1254"
                    sizes="(max-width: 640px) 60vw, (max-width: 960px) 30vw, 360px"
                  />
                ))}
              </div>
              <div className="home-lord-banner__content">
                <span>Коллекция</span>
                <h3>Lord</h3>
                {lordProducts[1] &&
                  getProductCopy(lordProducts[1], "shortDescription") && (
                    <p>{getProductCopy(lordProducts[1], "shortDescription")}</p>
                  )}
                <Link className="button button--light" to="/products?q=Lord">
                  Смотреть коллекцию <ArrowRight aria-hidden="true" />
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
          <div className="history-seal"><span>30</span><small>лет истории</small></div>
        </Reveal>
        <Reveal className="history-preview__copy" delay={90}>
          <p className="eyebrow">История</p>
          <h2>История компании</h2>
          <p>
            Компания Dr. Nona International была основана 22 августа 1994
            года, на крыше дома Доктора Нонны и Михаила Шнеерсона.
          </p>
          <Link className="text-link text-link--large" to="/about/our-history">
            Продолжить историю <ArrowRight aria-hidden="true" />
          </Link>
        </Reveal>
      </section>

      <section className="section editorial-preview">
        <div className="container">
          <Reveal>
            <SectionHeading
              eyebrow="Знания"
              title="Блог и новости"
              action={
                <Link className="text-link text-link--large" to="/editorial">
                  Читать всё <ArrowRight aria-hidden="true" />
                </Link>
              }
              align="split"
            />
          </Reveal>
          <div className="editorial-grid">
            {articles.map((article, index) => (
              <Reveal key={article.path} delay={index * 55}>
                <ArticleCard page={article} feature={index === 0} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
