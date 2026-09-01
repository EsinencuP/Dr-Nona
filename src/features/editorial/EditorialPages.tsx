import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { MapPin } from "@phosphor-icons/react/MapPin";
import {
  formatDate,
  getPageTitle,
  splitText,
} from "../../components/ui";
import { ArticleCard } from "../../components/ArticleCard";
import {
  getOfficialPageDescription,
  getOfficialPageParagraphs,
} from "../../claims";
import { useOfficialPageData } from "../../data";
import { NavLink, useLocation } from "../../router";
import NotFoundPage from "../../pages/NotFoundPage";
import { useLocale } from "../../locales/LocaleProvider";

export function EditorialHubPage({ kind }: { kind?: "blog" | "news" }) {
  const { locale } = useLocale();
  const copy = locale === "ro" ? {
    eyebrow: "Cunoștințe și evenimente", blog: "Blog", news: "Noutăți",
    all: "Toate", navigation: "Tipul publicațiilor",
  } : {
    eyebrow: "Знания и события", blog: "Блог", news: "Новости",
    all: "Все", navigation: "Тип публикаций",
  };
  const { getEditorial } = useOfficialPageData();
  const blog = getEditorial("blog");
  const news = getEditorial("news");
  const items = kind === "blog" ? blog : kind === "news" ? news : [...news.slice(0, 8), ...blog.slice(0, 8)];
  return (
    <section className="editorial-page container">
      <div className="page-intro page-intro--editorial">
        <div><p className="eyebrow">{copy.eyebrow}</p><h1>{kind === "blog" ? copy.blog : kind === "news" ? copy.news : `${copy.blog} / ${copy.news}`}</h1></div>
        <nav className="editorial-switch" aria-label={copy.navigation}>
          <NavLink to="/editorial">{copy.all}</NavLink>
          <NavLink to="/blog">{copy.blog}</NavLink>
          <NavLink to="/news">{copy.news}</NavLink>
        </nav>
      </div>
      <div className="editorial-list">
        {items.map((page, index) => <ArticleCard key={page.path} page={page} feature={index === 0} />)}
      </div>
    </section>
  );
}

export function ArticlePage() {
  const { locale } = useLocale();
  const copy = locale === "ro" ? {
    news: "Noutăți", blog: "Blog", original: "Original",
    fallback: "Materialul integral este disponibil pe site-ul oficial Dr. Nona.",
  } : {
    news: "Новости", blog: "Блог", original: "Оригинал",
    fallback: "Полный материал доступен на официальном сайте Dr. Nona.",
  };
  const location = useLocation();
  const { pageByPath } = useOfficialPageData();
  const page = pageByPath.get(location.pathname);
  if (!page) return <NotFoundPage />;
  const title = getPageTitle(page);
  const description = getOfficialPageDescription(page);
  const body = getOfficialPageParagraphs(page).flatMap((item) =>
    splitText(item, 240)
  );
  return (
    <article className="article-page container">
      <div className="article-page__header">
        <p className="eyebrow">{page.path.startsWith("/news") ? copy.news : copy.blog} · {formatDate(page.sourceLastmod, locale)}</p>
        <h1 lang="ru">{title}</h1>
        {description && <p lang="ru">{description}</p>}
      </div>
      {page.images[0]?.src && (
        <img
          className="article-page__hero"
          src={page.images[0].src}
          alt={page.images[0].alt || ""}
          width="1200"
          height="600"
          fetchPriority="high"
          lang="ru"
        />
      )}
      <div className="article-page__layout">
        <aside><span>Dr. Nona</span><a href={page.sourceUrl} target="_blank" rel="noreferrer">{copy.original} <ArrowUpRight aria-hidden="true" /></a></aside>
        <div className="prose" lang="ru">
          {body.length ? body.map((paragraph, index) => <p className={index === 0 ? "prose-lead" : ""} key={`${index}-${paragraph.slice(0, 10)}`}>{paragraph}</p>) : (
            <p lang={locale}>{copy.fallback}</p>
          )}
        </div>
      </div>
    </article>
  );
}

export function GenericOfficialPage() {
  const { locale } = useLocale();
  const copy = locale === "ro" ? {
    eyebrow: "Dr. Nona · Informații", source: "Informații oficiale Dr. Nona International",
    openSource: "Deschide sursa", images: "Imagini", openPage: "Deschide pagina oficială",
  } : {
    eyebrow: "Dr. Nona · Информация", source: "Официальная информация Dr. Nona International",
    openSource: "Открыть источник", images: "Изображения", openPage: "Открыть официальную страницу",
  };
  const location = useLocation();
  const { pageByPath } = useOfficialPageData();
  const page = pageByPath.get(location.pathname);
  if (!page) return <NotFoundPage />;
  const title = getPageTitle(page);
  const description = getOfficialPageDescription(page);
  const body = getOfficialPageParagraphs(page).flatMap((item) =>
    splitText(item, 260)
  );
  return (
    <section className="official-page container">
      <div className="official-page__header">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 lang="ru">{title}</h1>
        {description && <p lang="ru">{description}</p>}
      </div>
      <div className="official-page__content">
        <aside>
          <MapPin aria-hidden="true" />
          <p>{copy.source}</p>
          <a href={page.sourceUrl} target="_blank" rel="noreferrer">{copy.openSource} <ArrowUpRight aria-hidden="true" /></a>
        </aside>
        <div className="prose" lang="ru">
          {page.headings.slice(1).map((heading) => <h2 key={heading}>{heading}</h2>)}
          {body.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>)}
          {page.images.length > 0 && (
            <div className="official-media-grid" aria-label={`${copy.images}: ${title}`}>
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
              {copy.openPage} <ArrowUpRight aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
