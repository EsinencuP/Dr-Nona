import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { CalendarBlank } from "@phosphor-icons/react/CalendarBlank";
import { Flask } from "@phosphor-icons/react/Flask";
import { Heart } from "@phosphor-icons/react/Heart";
import { SealCheck } from "@phosphor-icons/react/SealCheck";
import {
  ClaimsReviewNotice,
  Reveal,
  getPageTitle,
  splitText,
} from "../../components/ui";
import { getOfficialPageParagraphs } from "../../claims";
import { useOfficialPageData } from "../../data";
import { Link, NavLink } from "../../router";
import NotFoundPage from "../../pages/NotFoundPage";

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

export function AboutLandingPage() {
  const { pageByPath } = useOfficialPageData();
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

export function HistoryPage() {
  const { pageByPath } = useOfficialPageData();
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

export function AboutContentPage({ path }: { path: string }) {
  const { pageByPath } = useOfficialPageData();
  const page = pageByPath.get(path);
  if (!page) return <NotFoundPage />;
  const title = getPageTitle(page);
  const paragraphs = getOfficialPageParagraphs(page).flatMap((paragraph) =>
    splitText(paragraph, 280)
  );
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
          <ClaimsReviewNotice
            scope="official-page"
            contentId={page.path}
            compact
          />
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
