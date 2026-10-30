import { getPageTitle, splitText } from "../../components/ui";
import { withoutExternalReferences } from "../../components/contentText";
import { uncroppedOfficialImage } from "../../components/contentMedia";
import { getOfficialPageDescription, getOfficialPageParagraphs } from "../../claims";
import { useOfficialPageData } from "../../data";
import { useLocation } from "../../router";
import { useLocale } from "../../locales/LocaleProvider";
import NotFoundPage from "../../pages/NotFoundPage";
import { PageBreadcrumbs } from "../../components/PageNavigation";

export function GenericOfficialPage() {
  const { locale } = useLocale();
  const copy = locale === "ro" ? {    images: "Imagini",
  } : {    images: "Изображения",
  };
  const location = useLocation();
  const { pageByPath } = useOfficialPageData();
  const page = pageByPath.get(location.pathname);
  if (!page) return <NotFoundPage />;
  const title = getPageTitle(page);
  const description = getOfficialPageDescription(page);
  const body = getOfficialPageParagraphs(page).map(withoutExternalReferences).filter(Boolean).flatMap((item) =>
    splitText(item, 260)
  );
  return (
    <section className="official-page container">
      <PageBreadcrumbs current={title} currentLang="ru" />
      <div className="official-page__header">
        <h1 lang="ru">{title}</h1>
        {description && <p lang="ru">{description}</p>}
      </div>
      <div className="official-page__content">
        <div className="prose" lang="ru">
          {page.headings.slice(1).map((heading) => <h2 key={heading}>{heading}</h2>)}
          {body.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>)}
          {page.images.length > 0 && (
            <div className="official-media-grid" lang={locale} aria-label={`${copy.images}: ${title}`}>
              {page.images.map((image, index) => (
                <img
                  key={`${image.src}-${index}`}
                  src={uncroppedOfficialImage(image.src)}
                  alt={image.alt || title}
                  lang="ru"
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
