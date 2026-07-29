import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { BookmarkSimple } from "@phosphor-icons/react/BookmarkSimple";
import { CalendarBlank } from "@phosphor-icons/react/CalendarBlank";
import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { Check } from "@phosphor-icons/react/Check";
import { Drop } from "@phosphor-icons/react/Drop";
import { EnvelopeSimple } from "@phosphor-icons/react/EnvelopeSimple";
import { Flask } from "@phosphor-icons/react/Flask";
import { Heart } from "@phosphor-icons/react/Heart";
import { Leaf } from "@phosphor-icons/react/Leaf";
import { List } from "@phosphor-icons/react/List";
import { MagnifyingGlass } from "@phosphor-icons/react/MagnifyingGlass";
import { MapPin } from "@phosphor-icons/react/MapPin";
import { Phone } from "@phosphor-icons/react/Phone";
import { SealCheck } from "@phosphor-icons/react/SealCheck";
import { TelegramLogo } from "@phosphor-icons/react/TelegramLogo";
import { TestTube } from "@phosphor-icons/react/TestTube";
import { X } from "@phosphor-icons/react/X";
import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useParams,
  useSearchParams,
} from "./router";
import {
  categories,
  getEditorial,
  getRelatedProducts,
  pageByPath,
  productBySlug,
  products,
  type OfficialPage,
  type Product,
} from "./data";

type Locale = "ru" | "ro";

const ui = {
  ru: {
    catalog: "Каталог",
    about: "О компании",
    formula: "Halo Complex™",
    editorial: "Блог / Новости",
    selection: "Подборка",
    allProducts: "Все продукты",
    details: "Подробнее",
    add: "В подборку",
    added: "Добавлено",
    search: "Поиск по названию",
    allCategories: "Все категории",
    sortPopular: "По популярности",
    sortAZ: "По алфавиту А—Я",
    sortZA: "По алфавиту Я—А",
    sortNewest: "Сначала новые",
    productsFound: "продуктов",
    empty: "По этим параметрам ничего не найдено.",
    reset: "Сбросить фильтры",
    source: "Источник",
    ingredients: "Состав",
    use: "Способ применения",
    related: "Дополнить уход",
    category: "Категория",
    sku: "Артикул",
    menu: "Открыть меню",
    close: "Закрыть меню",
  },
  ro: {
    catalog: "Catalog",
    about: "Despre companie",
    formula: "Halo Complex™",
    editorial: "Blog / Noutăți",
    selection: "Selecție",
    allProducts: "Toate produsele",
    details: "Detalii",
    add: "Adaugă",
    added: "Adăugat",
    search: "Caută după nume",
    allCategories: "Toate categoriile",
    sortPopular: "După popularitate",
    sortAZ: "Alfabetic A—Z",
    sortZA: "Alfabetic Z—A",
    sortNewest: "Cele mai noi",
    productsFound: "produse",
    empty: "Nu am găsit produse pentru aceste criterii.",
    reset: "Resetează filtrele",
    source: "Sursă",
    ingredients: "Ingrediente",
    use: "Mod de utilizare",
    related: "Completează ritualul",
    category: "Categorie",
    sku: "Cod",
    menu: "Deschide meniul",
    close: "Închide meniul",
  },
} as const;

type SelectionContextValue = {
  selected: string[];
  toggle: (slug: string) => void;
  contains: (slug: string) => boolean;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);
const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
}>({ locale: "ru", setLocale: () => undefined });

function useSelection() {
  const value = useContext(SelectionContext);
  if (!value) throw new Error("SelectionContext is unavailable");
  return value;
}

function useLocale() {
  const { locale } = useContext(LocaleContext);
  return { locale, t: ui[locale] };
}

function splitText(text: string, minLength = 140) {
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

function formatDate(value: string, locale: Locale = "ru") {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "ru-RU", {
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

function getPageTitle(page?: OfficialPage) {
  if (!page) return "";
  return page.title.trim() || page.headings.find((heading) => heading.trim()) || importedPageFallbackTitles[page.path] || "";
}

function ScrollRestoration() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const main = document.querySelector<HTMLElement>("#main-content");
    main?.focus({ preventScroll: true });
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute("content", "#f7fbfc");
    const productSlug = location.pathname.startsWith("/product/")
      ? location.pathname.split("/").pop()
      : "";
    const title =
      (productSlug && productBySlug.get(productSlug)?.officialName) ||
      getPageTitle(pageByPath.get(location.pathname)) ||
      (location.pathname === "/products" ? "Каталог" : "") ||
      (location.pathname === "/selection" ? "Подборка" : "") ||
      (location.pathname === "/editorial" ? "Блог и новости" : "") ||
      "Dr. Nona Moldova";
    document.title = title === "Dr. Nona Moldova" ? title : `${title} — Dr. Nona Moldova`;
  }, [location.pathname]);
  return null;
}

function Reveal({
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

function BrandMark({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link
      aria-label="Dr. Nona Moldova — главная"
      className={`brand-mark ${inverted ? "brand-mark--light" : ""}`}
      to="/"
    >
      <img
        className="brand-mark__logo"
        src="/brand/dr-nona-logo.png"
        alt="Dr. Nona"
        width="920"
        height="293"
        loading={inverted ? "lazy" : "eager"}
        decoding="async"
        fetchPriority={inverted ? "auto" : "high"}
      />
      <span className="brand-mark__market">Moldova</span>
    </Link>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { selected } = useSelection();
  const { locale, setLocale } = useContext(LocaleContext);
  const { t } = useLocale();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  const nav = [
    ["/products", t.catalog],
    ["/about", t.about],
    ["/ourformula", t.formula],
    ["/editorial", t.editorial],
  ];

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Перейти к содержанию
      </a>
      <div className="header-shell">
        <BrandMark />
        <nav className="desktop-nav" aria-label="Основная навигация">
          {nav.map(([to, label]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <div className="locale-switch" aria-label="Язык интерфейса">
            {(["ru", "ro"] as Locale[]).map((item) => (
              <button
                key={item}
                aria-pressed={locale === item}
                onClick={() => setLocale(item)}
                type="button"
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
          <Link className="selection-link" to="/selection" aria-label={`${t.selection}: ${selected.length}`}>
            <BookmarkSimple aria-hidden="true" weight={selected.length ? "fill" : "regular"} />
            <span>{t.selection}</span>
            <b>{selected.length}</b>
          </Link>
          <button
            className="mobile-menu-button"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? t.close : t.menu}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <List aria-hidden="true" />}
          </button>
        </div>
      </div>
      <div
        id="mobile-navigation"
        className={`mobile-panel ${open ? "is-open" : ""}`}
        aria-hidden={!open}
        hidden={!open}
      >
        <nav aria-label="Мобильная навигация">
          {nav.map(([to, label]) => (
            <NavLink key={to} to={to}>
              <span>{label}</span>
              <ArrowUpRight aria-hidden="true" />
            </NavLink>
          ))}
          <NavLink to="/selection">
            <span>{t.selection}</span>
            <b>{selected.length}</b>
          </NavLink>
        </nav>
        <div className="mobile-locale-switch" aria-label="Язык интерфейса">
          <span>Язык интерфейса</span>
          <div className="locale-switch">
            {(["ru", "ro"] as Locale[]).map((item) => (
              <button
                key={item}
                aria-pressed={locale === item}
                onClick={() => setLocale(item)}
                type="button"
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-orbit" aria-hidden="true" />
      <div className="footer-grid">
        <div className="footer-brand">
          <BrandMark inverted />
          <p>
            Каталог продукции Dr. Nona и история формулы Halo Complex™ для
            аудитории Молдовы.
          </p>
        </div>
        <div>
          <p className="footer-title">Разделы</p>
          <Link to="/products">Каталог</Link>
          <Link to="/about">О компании</Link>
          <Link to="/ourformula">Halo Complex™</Link>
          <Link to="/editorial">Блог / Новости</Link>
        </div>
        <div>
          <p className="footer-title">Информация</p>
          <Link to="/contactus">Контакты</Link>
          <Link to="/warehouses">Филиалы</Link>
          <Link to="/certificates">Сертификаты</Link>
          <Link to="/faq">Вопросы и ответы</Link>
        </div>
        <div>
          <p className="footer-title">Связь</p>
          <a href="tel:+97239516999">
            <Phone aria-hidden="true" /> +972-3-9516999
          </a>
          <a href="mailto:shopinfo@drnona.com">
            <EnvelopeSimple aria-hidden="true" /> shopinfo@drnona.com
          </a>
          <span className="footer-contact-pending">
            <TelegramLogo aria-hidden="true" /> Telegram · подключается
          </span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Dr. Nona Moldova</span>
        <div>
          <Link to="/termsofuse">Условия использования</Link>
          <Link to="/privacypolicy">Политика конфиденциальности</Link>
          <Link to="/accessibility-statement">Доступность</Link>
        </div>
      </div>
    </footer>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}

function SectionHeading({
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

function ProductCard({
  product,
  compact = false,
  catalogImage = false,
}: {
  product: Product;
  compact?: boolean;
  catalogImage?: boolean;
}) {
  const { contains, toggle } = useSelection();
  const { t } = useLocale();
  const saved = contains(product.slug);
  return (
    <article className={`product-card ${compact ? "product-card--compact" : ""}`}>
      <div className="product-card__stage">
        <Link to={`/product/${product.slug}`} tabIndex={-1} aria-hidden="true">
          <img
            className={`product-card__image ${
              catalogImage ? "product-card__image--catalog" : "product-card__image--editorial"
            }`}
            src={catalogImage ? product.image : product.cardImage}
            alt=""
            width="1254"
            height="1254"
            loading="lazy"
            decoding="async"
            style={
              catalogImage
                ? ({ "--product-object-scale": product.catalogScale } as CSSProperties)
                : undefined
            }
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
          aria-hidden={product.shortDescription ? undefined : true}
        >
          {product.shortDescription || "\u00A0"}
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

function HomePage() {
  const about = pageByPath.get("/about");
  const formula = pageByPath.get("/ourformula");
  const { contains, toggle } = useSelection();
  const spotlight =
    productBySlug.get("dynamic-hydrating-cream") ?? products[0];
  const supportingProducts = [
    productBySlug.get("facial-solaris"),
    productBySlug.get("halo-gonseen-vitalitea"),
  ].filter((product): product is Product => Boolean(product));
  const promoProduct =
    productBySlug.get("solaris-body-lotion") ?? products[1];
  const lordProducts = [
    productBySlug.get("after-shave-lord"),
    productBySlug.get("lord-deodorant"),
  ].filter((product): product is Product => Boolean(product));
  const spotlightSaved = contains(spotlight.slug);
  const articles = [...getEditorial("news").slice(0, 2), ...getEditorial("blog").slice(0, 1)];
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
  const heroBenefits = [
    { icon: Drop, title: "Минералы Мёртвого моря", text: "Уникальный природный источник" },
    { icon: Flask, title: "Научные разработки", text: "Современные формулы" },
    { icon: Leaf, title: "Природные компоненты", text: "Экстракты и минералы" },
    { icon: Heart, title: "Забота о вас", text: "Красота и долголетие" },
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
              чтобы создавать продукты для здоровья, красоты и долголетия.
            </p>
            <div className="hero-actions">
              <Link className="button button--primary" to="/products">
                Открыть каталог <ArrowRight aria-hidden="true" />
              </Link>
              <Link className="button button--quiet" to="/ourformula">
                Исследовать формулу
              </Link>
            </div>
          </div>
          <div
            className="hero-visual"
            role="img"
            aria-label="Halo Night Cream в пейзаже Мёртвого моря"
          />
        </div>
        <div className="hero-benefits container" aria-label="Принципы Dr. Nona">
          {heroBenefits.map(({ icon: Icon, title, text }) => (
            <div className="hero-benefit" key={title}>
              <Icon aria-hidden="true" />
              <span><strong>{title}</strong><small>{text}</small></span>
            </div>
          ))}
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
                <img
                  src={spotlight.cardImage}
                  alt={spotlight.officialName}
                  width="1254"
                  height="1254"
                  decoding="async"
                />
              </Link>
              <div className="home-product-spotlight__body">
                <div className="home-product-spotlight__meta">
                  <span>Выбор редакции</span>
                  <small>{spotlight.category}</small>
                </div>
                <h3>{spotlight.officialName}</h3>
                <p>{spotlight.shortDescription}</p>
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
                    <img
                      src={product.image}
                      alt=""
                      width="1254"
                      height="1254"
                      loading="lazy"
                      decoding="async"
                      style={
                        {
                          "--product-object-scale": product.catalogScale,
                        } as CSSProperties
                      }
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
              <img
                src={promoProduct.cardImage}
                alt={promoProduct.officialName}
                width="1254"
                height="1254"
                loading="lazy"
                decoding="async"
              />
              <div className="home-promo-banner__content">
                <span>Промо-фокус</span>
                <h3>{promoProduct.officialName}</h3>
                <p>{promoProduct.shortDescription}</p>
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
                  <img
                    key={product.slug}
                    src={product.cardImage}
                    alt=""
                    width="1254"
                    height="1254"
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
              <div className="home-lord-banner__content">
                <span>Коллекция</span>
                <h3>Lord</h3>
                <p>{lordProducts[1]?.shortDescription}</p>
                <Link className="button button--light" to="/products?q=Lord">
                  Смотреть коллекцию <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      <section className="science-section" id="halo-science">
        <div className="container science-grid">
          <Reveal className="science-copy">
            <p className="eyebrow eyebrow--light">Наука</p>
            <h2>Halo Complex™</h2>
            <p className="science-intro">Сделано природой. Раскрыто наукой.</p>
            <p>{formula?.paragraphs[0] ? splitText(formula.paragraphs[0], 260)[0] : ""}</p>
            <Link className="button button--light" to="/ourformula">
              История формулы <ArrowRight aria-hidden="true" />
            </Link>
          </Reveal>
          <Reveal className="science-diagram" delay={80}>
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
            {pageByPath.get("/about/our-history")?.paragraphs[0]
              ? splitText(pageByPath.get("/about/our-history")!.paragraphs[0], 230)[0]
              : ""}
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

function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const { t } = useLocale();
  const query = params.get("q") ?? "";
  const category = params.get("category") ?? "all";
  const sort = params.get("sort") ?? "popular";
  const [filtersOpen, setFiltersOpen] = useState(false);

  const result = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ru");
    return products
      .filter(
        (product) =>
          (category === "all" || product.category === category) &&
          (!needle ||
            product.officialName.toLocaleLowerCase("ru").includes(needle) ||
            product.shortDescription.toLocaleLowerCase("ru").includes(needle))
      )
      .sort((a, b) => {
        if (sort === "az") return a.officialName.localeCompare(b.officialName);
        if (sort === "za") return b.officialName.localeCompare(a.officialName);
        if (sort === "newest")
          return new Date(b.sourceLastmod).getTime() - new Date(a.sourceLastmod).getTime();
        return a.popularityRank - b.popularityRank;
      });
  }, [category, query, sort]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <section className="catalog-page container">
      <div className="page-intro page-intro--catalog">
        <div>
          <p className="eyebrow">Каталог · {products.length} продуктов</p>
          <h1>Каталог <em>Dr. Nona</em></h1>
        </div>
        <p>
          Продукты Dr. Nona для ежедневного ухода, здоровья и благополучия.
        </p>
      </div>

      <button
        className="mobile-filters-toggle"
        type="button"
        aria-expanded={filtersOpen}
        onClick={() => setFiltersOpen((value) => !value)}
      >
        <List aria-hidden="true" /> Фильтры и сортировка
      </button>

      <div className={`catalog-toolbar ${filtersOpen ? "is-open" : ""}`}>
        <label className="search-field">
          <MagnifyingGlass aria-hidden="true" />
          <span className="sr-only">{t.search}</span>
          <input
            value={query}
            onChange={(event) => update("q", event.target.value)}
            placeholder={t.search}
            type="search"
            name="catalog-search"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button type="button" onClick={() => update("q", "")} aria-label="Очистить поиск">
              <X aria-hidden="true" />
            </button>
          )}
        </label>
        <label className="select-field">
          <span className="sr-only">{t.allCategories}</span>
          <select name="category" value={category} onChange={(event) => update("category", event.target.value)}>
            <option value="all">{t.allCategories}</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <CaretDown aria-hidden="true" />
        </label>
        <label className="select-field">
          <span className="sr-only">Сортировка</span>
          <select name="sort" value={sort} onChange={(event) => update("sort", event.target.value)}>
            <option value="popular">{t.sortPopular}</option>
            <option value="newest">{t.sortNewest}</option>
            <option value="az">{t.sortAZ}</option>
            <option value="za">{t.sortZA}</option>
          </select>
          <CaretDown aria-hidden="true" />
        </label>
      </div>

      <div className="catalog-status" aria-live="polite">
        <span>{result.length} {t.productsFound}</span>
        {(query || category !== "all" || sort !== "popular") && (
          <button type="button" onClick={() => setParams({})}>{t.reset}</button>
        )}
      </div>

      {result.length ? (
        <div className="catalog-grid">
          {result.map((product) => (
            <ProductCard key={product.slug} product={product} catalogImage />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <MagnifyingGlass aria-hidden="true" />
          <h2>{t.empty}</h2>
          <button className="button button--primary" type="button" onClick={() => setParams({})}>
            {t.reset}
          </button>
        </div>
      )}
    </section>
  );
}

function ProductPage() {
  const { slug = "" } = useParams();
  const product = productBySlug.get(slug);
  const { contains, toggle } = useSelection();
  const { t } = useLocale();
  const [openPanel, setOpenPanel] = useState<"description" | "ingredients" | "use" | null>("ingredients");
  if (!product) return <NotFoundPage />;
  const related = getRelatedProducts(product);
  const saved = contains(product.slug);
  const productSummary = splitText(product.longDescription, 330)[0];

  return (
    <div className="product-page">
      <section className="product-detail container">
        <nav className="breadcrumbs" aria-label="Хлебные крошки">
          <Link to="/">Главная</Link><span>/</span>
          <Link to="/products">Каталог</Link><span>/</span>
          <span>{product.officialName}</span>
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
            {product.shortDescription && <p className="product-purpose">{product.shortDescription}</p>}
            <button
              className="button button--primary product-select-button"
              type="button"
              aria-pressed={saved}
              onClick={() => toggle(product.slug)}
            >
              {saved ? <Check aria-hidden="true" /> : <BookmarkSimple aria-hidden="true" />}
              {saved ? t.added : t.add}
            </button>
            <p className="product-description">{productSummary}</p>
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
          {[
            ["description", "Полное описание", product.longDescription],
            ["ingredients", t.ingredients, product.ingredients],
            ["use", t.use, product.howToUse],
          ].map(([key, label, content]) => (
            <div className="accordion-item" key={key}>
              <button
                type="button"
                aria-expanded={openPanel === key}
                onClick={() => setOpenPanel(openPanel === key ? null : key as "description" | "ingredients" | "use")}
              >
                <span>{label}</span><span>{openPanel === key ? "−" : "+"}</span>
              </button>
              <div className="accordion-content" hidden={openPanel !== key}>
                <p>{content || "Информация не указана на официальной странице продукта."}</p>
              </div>
            </div>
          ))}
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

const aboutLinks = [
  ["/about/company", "Компания"],
  ["/about/our-history", "История"],
  ["/about/founders", "Основатели"],
  ["/about/science", "Наука и технология"],
];

function AboutChapterIcon({ path }: { path: string }) {
  if (path.includes("our-history")) return <CalendarBlank aria-hidden="true" />;
  if (path.includes("founders")) return <Heart aria-hidden="true" />;
  if (path.includes("science")) return <Flask aria-hidden="true" />;
  return <SealCheck aria-hidden="true" />;
}

function AboutNavigation() {
  return (
    <nav className="about-nav" aria-label="Разделы о компании">
      {aboutLinks.map(([path, label]) => (
        <NavLink key={path} to={path}>
          <span>{label}</span>
          <ArrowRight aria-hidden="true" />
        </NavLink>
      ))}
    </nav>
  );
}

function AboutLandingPage() {
  const page = pageByPath.get("/about");
  const text = page?.paragraphs[0] ?? "";
  const companyExcerpt = splitText(
    pageByPath.get("/about/company")?.paragraphs[0] ?? "",
    210
  )[0];
  const chapters = aboutLinks.map(([path, label], index) => {
    const chapter = pageByPath.get(path);
    return {
      path,
      label,
      image: page?.images[index]
        ? {
            ...page.images[index],
            src: page.images[index].src.replace(
              "f_jpeg,w_300,h_300",
              "f_auto,q_auto,w_900"
            ),
          }
        : undefined,
      excerpt: splitText(chapter?.paragraphs[0] ?? "", 185)[0],
    };
  });
  return (
    <div className="about-page">
      <section className="about-overview">
        <div className="about-overview__inner container">
          <div className="about-overview__heading">
            <p className="eyebrow">Dr. Nona International · с 1994 года</p>
            <h1>Наше <em>видение</em></h1>
          </div>
          <div className="about-overview__statement">
            <span aria-hidden="true">DN</span>
            <p>{splitText(text, 430)[0]}</p>
          </div>
          <dl className="about-facts" aria-label="Dr. Nona в цифрах">
            <div>
              <dt>1994</dt>
              <dd>год основания</dd>
            </div>
            <div>
              <dt>40+</dt>
              <dd>стран мира</dd>
            </div>
            <div>
              <dt>300 000+</dt>
              <dd>дистрибьюторов</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="about-chapters container" aria-labelledby="about-chapters-title">
        <header className="about-chapters__heading">
          <div>
            <p className="eyebrow">О компании · четыре главы</p>
            <h2 id="about-chapters-title">Компания Dr. Nona</h2>
          </div>
          <p>{companyExcerpt}</p>
        </header>
        <div className="about-chapter-grid">
          {chapters.map((chapter, index) => (
            <Reveal
              key={chapter.path}
              className={`about-chapter about-chapter--${index + 1}`}
              delay={index * 55}
            >
              <Link to={chapter.path}>
                <div className="about-chapter__media">
                  {chapter.image?.src && (
                    <img
                      src={chapter.image.src}
                      alt={chapter.image.alt || chapter.label}
                      width="720"
                      height="560"
                      loading={index > 1 ? "lazy" : "eager"}
                      decoding="async"
                    />
                  )}
                </div>
                <div className="about-chapter__body">
                  <div className="about-chapter__meta">
                    <AboutChapterIcon path={chapter.path} />
                  </div>
                  <h3>{chapter.label}</h3>
                  <p>{chapter.excerpt}</p>
                  <span className="about-chapter__link">
                    Открыть раздел <ArrowRight aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="about-principles">
        <div className="container">
          <p className="eyebrow">Принципы Dr. Nona</p>
          <div className="about-principles__content">
            <blockquote>
              Вера в поразительную мудрость природы, непрерывный творческий
              поиск, приверженность бескомпромиссному качеству.
            </blockquote>
            <Link className="button button--light" to="/about/company">
              О компании <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function HistoryPage() {
  const page = pageByPath.get("/about/our-history");
  const title = getPageTitle(page);
  const chapters = splitText(page?.paragraphs[0] ?? "", 520);
  const years = ["1994", "1998", "1999", "2008", "Сегодня"];
  return (
    <section className="history-page container">
      <div className="page-intro">
        <div><p className="eyebrow">О компании · История</p><h1>{title}</h1></div>
        <AboutNavigation />
      </div>
      <div className="timeline">
        <svg className="timeline-line" viewBox="0 0 80 1000" aria-hidden="true" preserveAspectRatio="none">
          <path d="M40 0 C5 110, 74 200, 34 300 S12 505, 48 610 S70 815, 38 1000" />
        </svg>
        {chapters.map((chapter, index) => (
          <Reveal key={chapter.slice(0, 40)} className={`timeline-entry timeline-entry--${index % 2 ? "right" : "left"}`}>
            <span className="timeline-year">{years[index] ?? "Этап истории"}</span>
            <p>{chapter}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function AboutContentPage({ path }: { path: string }) {
  const page = pageByPath.get(path);
  if (!page) return <NotFoundPage />;
  const title = getPageTitle(page);
  const paragraphs = page.paragraphs.flatMap((paragraph) => splitText(paragraph, 280));
  return (
    <section className="about-content container">
      <div className="page-intro">
        <div><p className="eyebrow">О компании</p><h1>{title}</h1></div>
        <AboutNavigation />
      </div>
      <div className="about-content__layout">
        <aside>
          <div className="about-symbol">
            {path.includes("science") ? <Flask aria-hidden="true" /> : <SealCheck aria-hidden="true" />}
          </div>
          <p>Dr. Nona International</p>
          <a href={page.sourceUrl} target="_blank" rel="noreferrer">
            Официальный источник <ArrowUpRight aria-hidden="true" />
          </a>
        </aside>
        <div className="prose">
          {paragraphs.map((paragraph, index) => (
            <Reveal key={`${index}-${paragraph.slice(0, 20)}`} delay={(index % 3) * 40}>
              <p className={index === 0 ? "prose-lead" : ""}>{paragraph}</p>
            </Reveal>
          ))}
          {page.images.length > 0 && (
            <div className="official-media-grid" aria-label={`Изображения: ${title}`}>
              {page.images.map((image, index) => (
                <img
                  key={`${image.src}-${index}`}
                  src={image.src}
                  alt={image.alt || title}
                  width="800"
                  height="640"
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FormulaPage() {
  const page = pageByPath.get("/ourformula");
  const formulaChapters = [
    {
      title: "Архебактерия",
      icon: TestTube,
      summary: "Древнейшая форма жизни из экстремальной среды Мёртвого моря.",
      text: "В основу формулы Halo Complex™ входят производные архебактерии — древнейшей формы жизни, способной существовать в экстремальных условиях Мёртвого моря. Её уникальная структура является источником белков, аминокислот и антиоксидантов.",
    },
    {
      title: "Мёртвое море",
      icon: Drop,
      summary: "Целебные свойства моря усиливают эксклюзивную формулу.",
      text: "Сочетание эксклюзивной формулы Halo Complex™ и целебных свойств Мёртвого моря повышает эффективность продукции Dr. Nona, помогает защищать организм от воздействия окружающей среды и способствует регенерации кожи.",
    },
    {
      title: "Новое поколение",
      icon: Leaf,
      summary: "Природная сила, превращённая в продукты ежедневного ухода.",
      text: "Продукты нового поколения сочетают живительную силу архебактерии с целебными свойствами Мёртвого моря. Сегодня формула используется в косметике, парфюмерии и пищевых добавках Dr. Nona.",
    },
  ];
  return (
    <>
      <section className="formula-hero">
        <div className="container formula-hero__grid">
          <div className="formula-hero__copy">
            <p className="eyebrow eyebrow--light">Эксклюзивная формула</p>
            <h1>Halo <em>Complex™</em></h1>
            <p className="formula-hero__lead">
              {page?.description || "Сделано природой"}. Раскрыто наукой.
            </p>
            <p className="formula-hero__summary">
              Инновационная формула основана на свойствах архебактерии и
              минералах Мёртвого моря.
            </p>
          </div>
          <div className="formula-pillars" aria-label="Основа Halo Complex">
            {formulaChapters.map(({ title, icon: Icon, summary }) => (
              <article className="formula-pillar" key={title}>
                <span className="formula-pillar__icon" aria-hidden="true"><Icon /></span>
                <div>
                  <h2>{title}</h2>
                  <p>{summary}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="formula-story container">
        <div className="formula-story__content">
          {formulaChapters.map(({ title, icon: Icon, text }) => (
            <Reveal key={title} className="formula-chapter">
              <div className="formula-chapter__icon">
                <Icon aria-hidden="true" />
              </div>
              <div>
                <p className="eyebrow">{title}</p>
                <p>{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="formula-products section container">
        <SectionHeading eyebrow="Формула в действии" title="Продукты на основе Halo Complex™" />
        <div className="related-grid">
          {products.slice(8, 12).map((product) => (
            <ProductCard key={product.slug} product={product} compact catalogImage />
          ))}
        </div>
      </section>
    </>
  );
}

function articlePath(page: OfficialPage) {
  return page.path;
}

function ArticleCard({ page, feature = false }: { page: OfficialPage; feature?: boolean }) {
  const { locale } = useLocale();
  const kind = page.path.startsWith("/news") ? "Новости" : "Блог";
  const title = getPageTitle(page);
  return (
    <article className={`article-card ${feature ? "article-card--feature" : ""}`}>
      <div className="article-card__visual">
        {page.images[0]?.src ? (
          <img
            src={page.images[0].src}
            alt={page.images[0].alt || ""}
            width="1200"
            height="400"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="article-card__fallback" aria-hidden="true"><span>DN</span></div>
        )}
        <span className="article-card__kind">{kind}</span>
      </div>
      <div className="article-card__body">
        <p><CalendarBlank aria-hidden="true" /> {formatDate(page.sourceLastmod, locale)}</p>
        <h3><Link to={articlePath(page)}>{title}</Link></h3>
        {page.description && <span>{page.description}</span>}
        <Link className="text-link" to={articlePath(page)}>
          Читать <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function EditorialHubPage({ kind }: { kind?: "blog" | "news" }) {
  const blog = getEditorial("blog");
  const news = getEditorial("news");
  const items = kind === "blog" ? blog : kind === "news" ? news : [...news.slice(0, 8), ...blog.slice(0, 8)];
  return (
    <section className="editorial-page container">
      <div className="page-intro page-intro--editorial">
        <div><p className="eyebrow">Знания и события</p><h1>{kind === "blog" ? "Блог" : kind === "news" ? "Новости" : "Блог / Новости"}</h1></div>
        <nav className="editorial-switch" aria-label="Тип публикаций">
          <NavLink to="/editorial">Все</NavLink>
          <NavLink to="/blog">Блог</NavLink>
          <NavLink to="/news">Новости</NavLink>
        </nav>
      </div>
      <div className="editorial-list">
        {items.map((page, index) => <ArticleCard key={page.path} page={page} feature={index === 0} />)}
      </div>
    </section>
  );
}

function ArticlePage() {
  const location = useLocation();
  const { locale } = useLocale();
  const page = pageByPath.get(location.pathname);
  if (!page) return <NotFoundPage />;
  const title = getPageTitle(page);
  const body = page.paragraphs.flatMap((item) => splitText(item, 240));
  return (
    <article className="article-page container">
      <div className="article-page__header">
        <p className="eyebrow">{page.path.startsWith("/news") ? "Новости" : "Блог"} · {formatDate(page.sourceLastmod, locale)}</p>
        <h1>{title}</h1>
        {page.description && <p>{page.description}</p>}
      </div>
      {page.images[0]?.src && (
        <img
          className="article-page__hero"
          src={page.images[0].src}
          alt={page.images[0].alt || ""}
          width="1200"
          height="600"
          fetchPriority="high"
        />
      )}
      <div className="article-page__layout">
        <aside><span>Dr. Nona</span><a href={page.sourceUrl} target="_blank" rel="noreferrer">Оригинал <ArrowUpRight aria-hidden="true" /></a></aside>
        <div className="prose">
          {body.length ? body.map((paragraph, index) => <p className={index === 0 ? "prose-lead" : ""} key={`${index}-${paragraph.slice(0, 10)}`}>{paragraph}</p>) : (
            <p>Полный материал доступен на официальном сайте Dr. Nona.</p>
          )}
        </div>
      </div>
    </article>
  );
}

function GenericOfficialPage() {
  const location = useLocation();
  const page = pageByPath.get(location.pathname);
  if (!page) return <NotFoundPage />;
  const title = getPageTitle(page);
  const body = page.paragraphs.flatMap((item) => splitText(item, 260));
  return (
    <section className="official-page container">
      <div className="official-page__header">
        <p className="eyebrow">Dr. Nona · Информация</p>
        <h1>{title}</h1>
        {page.description && <p>{page.description}</p>}
      </div>
      <div className="official-page__content">
        <aside>
          <MapPin aria-hidden="true" />
          <p>Официальная информация Dr. Nona International</p>
          <a href={page.sourceUrl} target="_blank" rel="noreferrer">Открыть источник <ArrowUpRight aria-hidden="true" /></a>
        </aside>
        <div className="prose">
          {page.headings.slice(1).map((heading) => <h2 key={heading}>{heading}</h2>)}
          {body.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>)}
          {page.images.length > 0 && (
            <div className="official-media-grid" aria-label={`Изображения: ${title}`}>
              {page.images.map((image, index) => (
                <img
                  key={`${image.src}-${index}`}
                  src={image.src}
                  alt={image.alt || title}
                  width="800"
                  height="640"
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
          )}
          {!body.length && page.headings.length <= 1 && (
            <a className="button button--quiet" href={page.sourceUrl} target="_blank" rel="noreferrer">
              Открыть официальную страницу <ArrowUpRight aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

const russianCertificates = [
  ["Sample Kit", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/sample-kit.jpg"],
  ["Halo Multi Mouthwash", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/mouthwash.jpg"],
  ["Halo Mineral Shampoo", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/frequent-use-tonic-shampoo.jpg"],
  ["Halo Mineral Hair Conditioner", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/conditioner.jpg"],
  ["Halo Shower Gel", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/halo-gel.jpg"],
  ["ARD Complex", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/ard-complex.jpg"],
  ["SHP Day Time Body Lotion", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/shp-day-time-body-lotion-lc.jpg"],
  ["SHP Night Time face Lotion", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/shp-night-time-face-cream-lc.jpg"],
  ["SHP Day Time Face Lotion", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/shp-day-time-face-cream-lc.jpg"],
  ["Halo Solid Perfume Kiwi", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/halo-solid-perfume-kiwi.jpg"],
  ["Halo Pure Unisex Deodorant Stick", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/halo-pure-unisex-deodorant-stick.jpg"],
  ["Halo Mineral Lipstick", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/lipstick-new.jpg"],
  ["Lipstick Novaya", ""],
  ["Halo Eye Care Balm", ""],
  ["Halo Solaris Body Lotion", ""],
  ["Halo Solaris Facial Cream", ""],
  ["Halo Bath Salts Quartet", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/a-quartet-of-bath-salts.jpg"],
  ["Halo Dynamic Cream", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/dynamic-hydrating-cream.jpg"],
  ["Halo Recovering Mud Mask", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/beauty-mask-for-face.jpg"],
  ["Halo Night Cream", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/night-cream.jpg"],
  ["Halo Face Milk", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/face-milk.jpg"],
  ["Halo Hand & Nail Cream", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/hand-and-nail-treatment.jpg"],
  ["Halo Dead Sea Water Compressed Wipes", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/dead-sea-water-compresses.jpg"],
  ["Halo Anti Aging Serum", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/halo-anti-aging-serum.jpg"],
  ["Lord - Halo Deodorant Antiperspirant", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/halo-deodorant-lord.jpg"],
  ["Lady - Halo Deodorant Antiperspirant", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/halo-deodorant-lady.jpg"],
  ["Halo Shea Body Butter", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/halo-shea-body-butter.jpg"],
  ["Halo Shenseen Mouth Toothpaste", "https://res.cloudinary.com/drnona-com/image/upload/c_thumb,f_auto,h_300,w_300/v1/pdf/ru/halo-shenseen-mouth-toothpaste.jpg"],
] as const;

function CertificatesPage() {
  const [country, setCountry] = useState("Russia");
  const page = pageByPath.get("/certificates");
  return (
    <section className="official-page container">
      <div className="official-page__header official-page__header--split">
        <div><p className="eyebrow">Dr. Nona · Документы</p><h1>Сертификаты</h1></div>
        <label className="certificate-country">
          <span>Выберите страну</span>
          <select name="certificate-country" value={country} onChange={(event) => setCountry(event.target.value)}>
            <option>Russia</option>
            <option>Israel</option>
            <option>Ukraine</option>
          </select>
        </label>
      </div>
      {country === "Russia" ? (
        <div className="certificate-grid">
          {russianCertificates.map(([name, image]) => (
            <article key={name}>
              {image ? (
                <img src={image} alt={name} width="300" height="300" loading="lazy" decoding="async" />
              ) : (
                <div className="certificate-placeholder" aria-hidden="true"><SealCheck /></div>
              )}
              <h2>{name}</h2>
            </article>
          ))}
        </div>
      ) : (
        <div className="certificate-empty">
          <SealCheck aria-hidden="true" />
          <h2>{country}</h2>
          <p>Список документов доступен в официальном источнике.</p>
          <a className="button button--primary" href={page?.sourceUrl} target="_blank" rel="noreferrer">
            Открыть официальный источник <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      )}
    </section>
  );
}

function ContactPage() {
  const [status, setStatus] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Интерфейс формы готов. Отправка будет подключена после утверждения молдавского получателя.");
  };
  return (
    <section className="contact-page container">
      <div className="official-page__header">
        <p className="eyebrow">Dr. Nona · Контакты</p>
        <h1>Будь на связи</h1>
      </div>
      <div className="contact-layout">
        <form className="contact-form" onSubmit={submit}>
          <label><span>Имя <b>Обязательное поле*</b></span><input name="given-name" autoComplete="given-name" required /></label>
          <label><span>Фамилия <b>Обязательное поле*</b></span><input name="family-name" autoComplete="family-name" required /></label>
          <label><span>ID Дистрибьютора</span><input name="distributor-id" inputMode="numeric" autoComplete="off" /></label>
          <label><span>Эл. Адрес <b>Обязательное поле*</b></span><input name="email" type="email" autoComplete="email" spellCheck={false} required /></label>
          <label className="contact-form__message"><span>Сообщение <b>Обязательное поле*</b></span><textarea name="message" autoComplete="off" required /></label>
          <button className="button button--primary" type="submit">Отправить <ArrowRight aria-hidden="true" /></button>
          <p className="contact-form__status" role="status" aria-live="polite">{status}</p>
        </form>
        <aside className="contact-card">
          <MapPin aria-hidden="true" />
          <h2>Наш адрес</h2>
          <p>DR. NONA INTERNATIONAL LTD<br />ул. Адом 23,<br />Промышленная зона Канот,<br />Израиль</p>
          <a href="tel:+97239516999"><Phone aria-hidden="true" /> +972-3-9516999</a>
          <a href="mailto:shopinfo@drnona.com"><EnvelopeSimple aria-hidden="true" /> shopinfo@drnona.com</a>
          <span className="footer-contact-pending"><TelegramLogo aria-hidden="true" /> Telegram · ожидает Moldova-контакт</span>
        </aside>
      </div>
    </section>
  );
}

function SelectionPage() {
  const { selected, toggle } = useSelection();
  const chosen = selected.map((slug) => productBySlug.get(slug)).filter((item): item is Product => Boolean(item));
  return (
    <section className="selection-page container">
      <div className="page-intro">
        <div><p className="eyebrow">Личная подборка</p><h1>Выбранные продукты</h1></div>
        <p>Сохраните интересующие позиции и используйте список при консультации.</p>
      </div>
      {chosen.length ? (
        <>
          <div className="selection-list">
            {chosen.map((product) => (
              <article key={product.slug}>
                <img src={product.image} alt="" width="900" height="900" loading="lazy" decoding="async" />
                <div><small>{product.category}</small><h2><Link to={`/product/${product.slug}`}>{product.officialName}</Link></h2></div>
                <button type="button" onClick={() => toggle(product.slug)} aria-label={`Удалить ${product.officialName}`}><X aria-hidden="true" /></button>
              </article>
            ))}
          </div>
          <div className="selection-contact">
            <div><p className="eyebrow eyebrow--light">Следующий шаг</p><h2>Обсудить подборку с консультантом</h2></div>
            <div>
              <button className="button button--light" type="button" disabled title="Контакт Telegram будет добавлен"><TelegramLogo aria-hidden="true" /> Telegram</button>
              <a className="button button--outline-light" href="mailto:drnona@drnona.com"><EnvelopeSimple aria-hidden="true" /> Написать на почту</a>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <BookmarkSimple aria-hidden="true" />
          <h2>В подборке пока нет продуктов</h2>
          <p>Добавляйте продукты из каталога — они останутся здесь.</p>
          <Link className="button button--primary" to="/products">Открыть каталог</Link>
        </div>
      )}
    </section>
  );
}

function NotFoundPage() {
  return (
    <section className="not-found container">
      <span>404</span>
      <h1>Эта страница ушла за горизонт</h1>
      <p>Вернитесь в каталог или на главную страницу.</p>
      <Link className="button button--primary" to="/">На главную</Link>
    </section>
  );
}

function DynamicOfficialRoute() {
  const location = useLocation();
  if (location.pathname.startsWith("/blog/") || location.pathname.startsWith("/news/")) {
    return <ArticlePage />;
  }
  if (pageByPath.has(location.pathname)) return <GenericOfficialPage />;
  return <NotFoundPage />;
}

const DeferredCatalog = lazy(async () => ({ default: CatalogPage }));

function AppRoutes() {
  return (
    <PageShell>
      <Suspense fallback={<div className="page-loader" aria-live="polite"><span /><p>Загрузка каталога</p></div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/main" element={<HomePage />} />
          <Route path="/products" element={<DeferredCatalog />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/about" element={<AboutLandingPage />} />
          <Route path="/about/our-history" element={<HistoryPage />} />
          <Route path="/about/company" element={<AboutContentPage path="/about/company" />} />
          <Route path="/about/science" element={<AboutContentPage path="/about/science" />} />
          <Route path="/about/founders" element={<AboutContentPage path="/about/founders" />} />
          <Route path="/ourformula" element={<FormulaPage />} />
          <Route path="/editorial" element={<EditorialHubPage />} />
          <Route path="/blog" element={<EditorialHubPage kind="blog" />} />
          <Route path="/news" element={<EditorialHubPage kind="news" />} />
          <Route path="/selection" element={<SelectionPage />} />
          <Route path="/contactus" element={<ContactPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="*" element={<DynamicOfficialRoute />} />
        </Routes>
      </Suspense>
    </PageShell>
  );
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem("drnona-locale");
    return saved === "ro" ? "ro" : "ru";
  });
  const [selected, setSelected] = useState<string[]>(() => {
    try {
      const value = JSON.parse(localStorage.getItem("drnona-selection") ?? "[]");
      return Array.isArray(value)
        ? value.filter((slug): slug is string => typeof slug === "string" && productBySlug.has(slug))
        : [];
    } catch {
      return [];
    }
  });
  const [announcement, setAnnouncement] = useState("");
  const announcementTimer = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem("drnona-locale", locale);
    document.documentElement.lang = locale;
    document.documentElement.dataset.uiLocale = locale;
  }, [locale]);

  useEffect(() => {
    localStorage.setItem("drnona-selection", JSON.stringify(selected));
  }, [selected]);

  useEffect(
    () => () => {
      if (announcementTimer.current !== null) {
        window.clearTimeout(announcementTimer.current);
      }
    },
    []
  );

  const selectionValue = useMemo<SelectionContextValue>(() => ({
    selected,
    contains: (slug) => selected.includes(slug),
    toggle: (slug) => {
      const product = productBySlug.get(slug);
      setSelected((current) => {
        const exists = current.includes(slug);
        setAnnouncement(
          exists
            ? `${product?.officialName ?? "Продукт"} удалён из подборки`
            : `${product?.officialName ?? "Продукт"} добавлен в подборку`
        );
        return exists ? current.filter((item) => item !== slug) : [...current, slug];
      });
      if (announcementTimer.current !== null) {
        window.clearTimeout(announcementTimer.current);
      }
      announcementTimer.current = window.setTimeout(() => {
        setAnnouncement("");
        announcementTimer.current = null;
      }, 2200);
    },
  }), [selected]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <SelectionContext.Provider value={selectionValue}>
        <ScrollRestoration />
        <AppRoutes />
        <div className={`toast ${announcement ? "is-visible" : ""}`} role="status" aria-live="polite">
          <Check aria-hidden="true" /> {announcement}
        </div>
      </SelectionContext.Provider>
    </LocaleContext.Provider>
  );
}
