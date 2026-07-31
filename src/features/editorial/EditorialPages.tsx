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

export function EditorialHubPage({ kind }: { kind?: "blog" | "news" }) {
  const { getEditorial } = useOfficialPageData();
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

export function ArticlePage() {
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
        <p className="eyebrow">{page.path.startsWith("/news") ? "Новости" : "Блог"} · {formatDate(page.sourceLastmod)}</p>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
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

export function GenericOfficialPage() {
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
        <p className="eyebrow">Dr. Nona · Информация</p>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
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
