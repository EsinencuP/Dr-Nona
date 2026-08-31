import { Drop } from "@phosphor-icons/react/Drop";
import { Leaf } from "@phosphor-icons/react/Leaf";
import { TestTube } from "@phosphor-icons/react/TestTube";
import {
  ProductCard,
  Reveal,
  SectionHeading,
} from "../components/ui";
import { isClaimFieldPublishable } from "../claims";
import {
  useFormulaContent,
  useOfficialPageData,
  useProductData,
} from "../data";
import { useLocale } from "../locales/LocaleProvider";

export default function FormulaPage() {
  const { locale } = useLocale();
  const { pageByPath } = useOfficialPageData();
  const { products } = useProductData();
  const formulaContent = useFormulaContent();
  const page = pageByPath.get("/ourformula");
  const formulaIcons = {
    archaea: TestTube,
    "dead-sea": Drop,
    "new-generation": Leaf,
  };
  const pageCopy = locale === "ro"
    ? {
        eyebrow: "Formulă exclusivă",
        nature: "Creat de natură",
        science: "Dezvăluit de știință.",
        summary:
          "Formula reunește studiul arhebacteriei cu mineralele Mării Moarte.",
        pillarsLabel: "Fundamentele Halo Complex",
        productsEyebrow: "Formula în acțiune",
        productsTitle: "Produse pe bază de Halo Complex™",
      }
    : {
        eyebrow: "Эксклюзивная формула",
        nature: "Создано природой",
        science: "Раскрыто наукой.",
        summary:
          "Формула объединяет исследование архебактерии и минералы Мёртвого моря.",
        pillarsLabel: "Основа Halo Complex",
        productsEyebrow: "Формула в действии",
        productsTitle: "Продукты на основе Halo Complex™",
      };
  const neutralFormulaCopy = locale === "ro"
    ? {
        archaea: {
          summary: "Un microorganism identificat în mediul extrem al Mării Moarte.",
          text: "Istoria Halo Complex™ începe cu studierea arhebacteriei, o formă de viață capabilă să existe în condițiile naturale neobișnuite ale Mării Moarte.",
        },
        "dead-sea": {
          summary: "Compoziția minerală a Mării Moarte face parte din filosofia brandului.",
          text: "Mineralele Mării Moarte reprezintă o parte importantă a originii brandului și a abordării sale în dezvoltarea produselor pentru îngrijirea zilnică.",
        },
        "new-generation": {
          summary: "Îmbinarea originii naturale cu tehnologiile moderne de producție.",
          text: "Formula reflectă ideea Dr. Nona de a studia componentele naturale și de a aplica în mod consecvent metode moderne de producție.",
        },
      }
    : {
        archaea: {
          summary: "Микроорганизм, обнаруженный в экстремальной среде Мёртвого моря.",
          text: "История Halo Complex™ начинается с исследования архебактерии, способной существовать в необычных природных условиях Мёртвого моря.",
        },
        "dead-sea": {
          summary: "Минеральная композиция Мёртвого моря в основе философии бренда.",
          text: "Минералы Мёртвого моря стали важной частью происхождения бренда и его подхода к созданию продуктов ежедневного ухода.",
        },
        "new-generation": {
          summary: "Соединение природного происхождения и современной технологии производства.",
          text: "Формула отражает идею Dr. Nona: изучать природные компоненты и последовательно применять современные методы производства.",
        },
      };
  const formulaChapters = formulaContent.map((chapter) => ({
    ...chapter,
    icon: formulaIcons[chapter.id as keyof typeof formulaIcons] ?? Leaf,
    summary: isClaimFieldPublishable("formula", chapter.id, "summary")
      ? chapter.summary
      : neutralFormulaCopy[chapter.id as keyof typeof neutralFormulaCopy].summary,
    text: isClaimFieldPublishable("formula", chapter.id, "text")
      ? chapter.text
      : neutralFormulaCopy[chapter.id as keyof typeof neutralFormulaCopy].text,
  }));
  return (
    <>
      <section className="formula-hero">
        <div className="container formula-hero__grid">
          <div className="formula-hero__copy">
            <p className="eyebrow eyebrow--light">{pageCopy.eyebrow}</p>
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
        <SectionHeading eyebrow={pageCopy.productsEyebrow} title={pageCopy.productsTitle} />
        <div className="related-grid">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.slug} product={product} compact />
          ))}
        </div>
      </section>
    </>
  );
}
