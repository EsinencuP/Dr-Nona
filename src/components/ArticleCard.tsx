import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { CalendarBlank } from "@phosphor-icons/react/CalendarBlank";
import { getOfficialPageDescription } from "../claims";
import type { OfficialPage } from "../data";
import { Link } from "../router";
import { formatDate, getPageTitle } from "./ui";

function articlePath(page: OfficialPage) {
  return page.path;
}

export function ArticleCard({ page, feature = false }: { page: OfficialPage; feature?: boolean }) {
  const kind = page.path.startsWith("/news") ? "Новости" : "Блог";
  const title = getPageTitle(page);
  const description = getOfficialPageDescription(page);
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
        <p><CalendarBlank aria-hidden="true" /> {formatDate(page.sourceLastmod)}</p>
        <h3><Link to={articlePath(page)}>{title}</Link></h3>
        {description && <span>{description}</span>}
        <Link className="text-link" to={articlePath(page)}>
          Читать <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
