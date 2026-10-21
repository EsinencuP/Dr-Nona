import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { CalendarBlank } from "@phosphor-icons/react/CalendarBlank";
import { Flask } from "@phosphor-icons/react/Flask";
import { Heart } from "@phosphor-icons/react/Heart";
import { SealCheck } from "@phosphor-icons/react/SealCheck";
import {
  Reveal,
  getPageTitle,
} from "../../components/ui";
import { useOfficialPageData } from "../../data";
import { useLocale } from "../../locales/LocaleProvider";
import { Link, NavLink } from "../../router";
import NotFoundPage from "../../pages/NotFoundPage";
import { PageBreadcrumbs, ReadingLinks } from "../../components/PageNavigation";

const aboutCopy = {
  ru: {
    links: [
      ["/about/company", "Компания"],
      ["/about/our-history", "История"],
      ["/about/founders", "Основатели"],
      ["/about/science", "Наука и технологии"],
    ],
    sectionsLabel: "Разделы о компании",    factsLabel: "Dr. Nona в цифрах",
    founded: "год основания",
    countries: "стран мира",
    distributors: "дистрибьюторов",    openSection: "Читать",
    aboutCompany: "О компании",    today: "Сегодня",
    historyStage: "Этап истории",    foundersCaption: "Доктор Нонна и Михаил Шнеерсон",
  },
  ro: {
    links: [
      ["/about/company", "Compania"],
      ["/about/our-history", "Istorie"],
      ["/about/founders", "Fondatori"],
      ["/about/science", "Știință și tehnologie"],
    ],
    sectionsLabel: "Secțiuni despre companie",    factsLabel: "Dr. Nona în cifre",
    founded: "anul fondării",
    countries: "țări din întreaga lume",
    distributors: "distribuitori",    openSection: "Citește",
    aboutCompany: "Despre companie",    today: "Astăzi",
    historyStage: "Etapă din istorie",    foundersCaption: "Dr. Nona și Mihail Shneerson",
  },
} as const;

function AboutChapterIcon({ path }: { path: string }) {
  if (path.includes("our-history")) return <CalendarBlank aria-hidden="true" />;
  if (path.includes("founders")) return <Heart aria-hidden="true" />;
  if (path.includes("science")) return <Flask aria-hidden="true" />;
  return <SealCheck aria-hidden="true" />;
}

function AboutNavigation() {
  const { locale } = useLocale();
  const copy = aboutCopy[locale];
  return (
    <nav className="about-nav" aria-label={copy.sectionsLabel}>
      {copy.links.map(([path, label]) => (
        <NavLink key={path} to={path}>
          <span>{label}</span>
          <ArrowRight aria-hidden="true" />
        </NavLink>
      ))}
    </nav>
  );
}

function AboutReadingLinks({ history = false }: { history?: boolean }) {
  const { locale } = useLocale();
  return <ReadingLinks links={locale === "ro" ? [
    history
      ? { to: "/about/founders", label: "Fondatorii Dr. Nona", description: "Oamenii de la începutul istoriei companiei." }
      : { to: "/ourformula", label: "Povestea Halo Complex™", description: "De la natura Mării Moarte la formula Dr. Nona." },
    { to: "/products", label: "Catalogul produselor Dr. Nona", description: "Descoperă produsele și descrierile lor." },
  ] : [
    history
      ? { to: "/about/founders", label: "Основатели Dr. Nona", description: "Люди, с которых началась история компании." }
      : { to: "/ourformula", label: "История Halo Complex™", description: "От природы Мёртвого моря к формуле Dr. Nona." },
    { to: "/products", label: "Каталог продукции Dr. Nona", description: "Познакомьтесь с продуктами и их описаниями." },
  ]} />;
}

export function AboutLandingPage() {
  const { locale } = useLocale();
  const copy = aboutCopy[locale];
  const { pageByPath } = useOfficialPageData();
  const page = pageByPath.get("/about");
  const text = page?.paragraphs[0] ?? "";
  const chapters = copy.links.map(([path, label]) => {
    const chapter = pageByPath.get(path);
    return {
      path,
      label,
      excerpt: chapter?.description ?? "",
    };
  });
  return (
    <div className="about-page">
      <section className="about-chapters container" aria-label={copy.sectionsLabel}>
        <PageBreadcrumbs current={copy.aboutCompany} />
        <h1 className="about-chapters__title">{pageByPath.get("/about/company")?.title}</h1>
        <div className="about-chapter-grid">
          {chapters.map((chapter, index) => (
            <Reveal
              key={chapter.path}
              className="about-chapter"
              delay={index * 55}
            >
              <Link to={chapter.path}>
                <div className="about-chapter__body">
                  <div className="about-chapter__meta">
                    <AboutChapterIcon path={chapter.path} />
                  </div>
                  <h2>{chapter.label}</h2>
                  <p>{chapter.excerpt}</p>
                  <span className="about-chapter__link">
                    {copy.openSection}: {chapter.label} <ArrowRight aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="about-overview" aria-label={copy.aboutCompany}>
        <div className="about-overview__inner container">
          <div className="about-overview__statement">
            <p>{text}</p>
          </div>
          <dl className="about-facts" aria-label={copy.factsLabel}>
            <div>
              <dt>1994</dt>
              <dd>{copy.founded}</dd>
            </div>
            <div>
              <dt>40+</dt>
              <dd>{copy.countries}</dd>
            </div>
            <div>
              <dt>300 000+</dt>
              <dd>{copy.distributors}</dd>
            </div>
          </dl>
        </div>
      </section>
      <div className="container"><AboutReadingLinks /></div>
    </div>
  );
}

export function HistoryPage() {
  const { locale } = useLocale();
  const copy = aboutCopy[locale];
  const { pageByPath } = useOfficialPageData();
  const page = pageByPath.get("/about/our-history");
  const title = getPageTitle(page);
  const chapters = page?.paragraphs ?? [];
  const years = ["1994", "1998", "1999", "2008", copy.today];
  return (
    <section className="history-page container">
      <PageBreadcrumbs current={title} parents={[{ to: "/about", label: copy.aboutCompany }]} />
      <div className="page-intro">
        <div><h1>{title}</h1></div>
        <AboutNavigation />
      </div>
      <div className="timeline">
        <svg className="timeline-line" viewBox="0 0 80 1000" aria-hidden="true" preserveAspectRatio="none">
          <path d="M40 0 C5 110, 74 200, 34 300 S12 505, 48 610 S70 815, 38 1000" />
        </svg>
        {chapters.map((chapter, index) => (
          <Reveal key={chapter.slice(0, 40)} className={`timeline-entry timeline-entry--${index % 2 ? "right" : "left"}`}>
            <span className="timeline-year">{years[index] ?? copy.historyStage}</span>
            <p>{chapter}</p>
          </Reveal>
        ))}
      </div>
      <AboutReadingLinks history />
    </section>
  );
}

export function AboutContentPage({ path }: { path: string }) {
  const { locale } = useLocale();
  const copy = aboutCopy[locale];
  const { pageByPath } = useOfficialPageData();
  const page = pageByPath.get(path);
  if (!page) return <NotFoundPage />;
  const title = getPageTitle(page);
  const paragraphs = page.paragraphs;
  return (
    <section className="about-content container">
      <PageBreadcrumbs current={title} parents={[{ to: "/about", label: copy.aboutCompany }]} />
      <div className="page-intro">
        <div><h1>{title}</h1></div>
        <AboutNavigation />
      </div>
      <div className="about-content__layout">
        <aside className={path === "/about/founders" ? "about-founders-aside" : undefined}>
          {path === "/about/founders" ? (
            <figure className="about-founders-photo">
              <img src="/brand/about/founders.jpg" alt={copy.foundersCaption} width="300" height="300" decoding="async" />
              <figcaption>{copy.foundersCaption}</figcaption>
            </figure>
          ) : <div className="about-symbol">
            {path.includes("science") ? <Flask aria-hidden="true" /> : <SealCheck aria-hidden="true" />}
          </div>}
          <p>Dr. Nona International</p>
        </aside>
        <div className="prose">
          {paragraphs.map((paragraph, index) => (
            <Reveal key={`${index}-${paragraph.slice(0, 20)}`} delay={(index % 3) * 40}>
              <p className={index === 0 ? "prose-lead" : ""}>{paragraph}</p>
            </Reveal>
          ))}
        </div>
      </div>
      <AboutReadingLinks />
    </section>
  );
}
