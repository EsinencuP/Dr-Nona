import { Drop } from "@phosphor-icons/react/Drop";
import { Leaf } from "@phosphor-icons/react/Leaf";
import { TestTube } from "@phosphor-icons/react/TestTube";
import { Reveal } from "../components/ui";
import { PageBreadcrumbs, ReadingLinks } from "../components/PageNavigation";
import { isClaimFieldPublishable } from "../claims";
import {
  useFormulaContent,
  useOfficialPageData,
} from "../data";
import { useLocale } from "../locales/LocaleProvider";
import { formulaPatentUrl, formulaStoryCopy } from "../features/content/formulaStory";

export default function FormulaPage() {
  const { locale } = useLocale();
  const story = formulaStoryCopy[locale];
  const { pageByPath } = useOfficialPageData();
  const formulaContent = useFormulaContent();
  const page = pageByPath.get("/ourformula");
  const formulaIcons = {
    archaea: TestTube,
    "dead-sea": Drop,
    "new-generation": Leaf,
  };
  const pageCopy = locale === "ro"
    ? {        nature: "Creat de natură",
        science: "Dezvăluit de știință.",
        summary:
          "Formula reunește studiul arhebacteriei cu mineralele Mării Moarte.",
        pillarsLabel: "Fundamentele Halo Complex",
      }
    : {        nature: "Создано природой",
        science: "Раскрыто наукой.",
        summary:
          "Формула объединяет исследование архебактерии и минералы Мёртвого моря.",
        pillarsLabel: "Основа Halo Complex",
      };
  const neutralFormulaCopy = locale === "ro"
    ? {
        archaea: {
          summary: "Un microorganism identificat în mediul extrem al Mării Moarte.",
        },
        "dead-sea": {
          summary: "Compoziția minerală a Mării Moarte face parte din filosofia brandului.",
        },
        "new-generation": {
          summary: "Îmbinarea originii naturale cu tehnologiile moderne de producție.",
        },
      }
    : {
        archaea: {
          summary: "Микроорганизм, обнаруженный в экстремальной среде Мёртвого моря.",
        },
        "dead-sea": {
          summary: "Минеральная композиция Мёртвого моря в основе философии бренда.",
        },
        "new-generation": {
          summary: "Соединение природного происхождения и современной технологии производства.",
        },
      };
  const formulaChapters = formulaContent.map((chapter) => ({
    ...chapter,
    icon: formulaIcons[chapter.id as keyof typeof formulaIcons] ?? Leaf,
    summary: isClaimFieldPublishable("formula", chapter.id, "summary")
      ? chapter.summary
      : neutralFormulaCopy[chapter.id as keyof typeof neutralFormulaCopy].summary,
  }));
  return (
    <>
      <div className="container"><PageBreadcrumbs current="Halo Complex™" /></div>
      <section className="formula-hero">
        <div className="container formula-hero__grid">
          <div className="formula-hero__copy">
            <h1>Halo <em>Complex™</em></h1>
            <p className="formula-hero__lead">
              {page?.description || pageCopy.nature}. {pageCopy.science}
            </p>
            <p className="formula-hero__summary">
              {pageCopy.summary}
            </p>
          </div>
          <div className="formula-pillars" aria-label={pageCopy.pillarsLabel}>
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
      <section className="formula-story container" aria-labelledby="formula-story-title">
        <Reveal className="formula-story__content">
          <h2 id="formula-story-title">{story.title}</h2>
          <p className="formula-story__lead">{story.lead}</p>
          {story.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <p>
            {story.patentBefore}
            <a href={formulaPatentUrl}>{story.patentLabel}</a>
            {story.patentAfter}
          </p>
          <p className="formula-story__closing">{story.closing}</p>
        </Reveal>
      </section>
      <div className="container">
        <ReadingLinks links={locale === "ro" ? [
          { to: "/products", label: "Catalogul produselor Dr. Nona", description: "Vezi compoziția și modul de utilizare al fiecărui produs." },
          { to: "/about/science", label: "Știință și tehnologie", description: "Află mai multe despre abordarea companiei." },
        ] : [
          { to: "/products", label: "Каталог продукции Dr. Nona", description: "Состав и способ применения каждого продукта." },
          { to: "/about/science", label: "Наука и технологии", description: "Узнайте больше о подходе компании." },
        ]} />
      </div>
    </>
  );
}
