import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { BookmarkSimple } from "@phosphor-icons/react/BookmarkSimple";
import { List } from "@phosphor-icons/react/List";
import { Phone } from "@phosphor-icons/react/Phone";
import { X } from "@phosphor-icons/react/X";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSelection } from "../features/selection/SelectionContext";
import { useLocale } from "../locales/LocaleProvider";
import { marketData } from "../market";
import { applyRouteMetadata } from "../seo";
import { Link, NavLink, useLocation } from "../router";

function ScrollRestoration() {
  const location = useLocation();
  const previousPathname = useRef(location.pathname);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const main = document.querySelector<HTMLElement>("#main-content");
    if (previousPathname.current !== location.pathname) {
      main?.focus({ preventScroll: true });
      previousPathname.current = location.pathname;
    }
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute("content", "#f7fbfc");
    applyRouteMetadata(location.pathname);
  }, [location.pathname]);
  return null;
}

function BrandMark({ inverted = false }: { inverted?: boolean }) {
  const { t } = useLocale();
  return (
    <Link
      aria-label={t.brandHome}
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
  const { selected } = useSelection();
  const { t } = useLocale();

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
        {t.skipToContent}
      </a>
      <div className="header-shell">
        <BrandMark />
        <nav className="desktop-nav" aria-label={t.primaryNavigation}>
          {nav.map(([to, label]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <Link
            className="selection-link"
            to="/selection"
            aria-label={`${t.selection}: ${selected.length}`}
            onClick={() => setOpen(false)}
          >
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
      {open && (
        <div id="mobile-navigation" className="mobile-panel is-open">
          <nav aria-label={t.mobileNavigation}>
            {nav.map(([to, label]) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)}>
                <span>{label}</span>
                <ArrowUpRight aria-hidden="true" />
              </NavLink>
            ))}
            <NavLink to="/selection" onClick={() => setOpen(false)}>
              <span>{t.selection}</span>
              <b>{selected.length}</b>
            </NavLink>
          </nav>
        </div>
      )}
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
          <a href={marketData.contact.phones[0].href}>
            <Phone aria-hidden="true" /> {marketData.contact.phones[0].label}
          </a>
          <a href={marketData.contact.phones[1].href}>
            <Phone aria-hidden="true" /> {marketData.contact.phones[1].label}
          </a>
          <span className="footer-contact-market">Кишинёв · Молдова</span>
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

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollRestoration />
      <PageShell>{children}</PageShell>
    </>
  );
}
