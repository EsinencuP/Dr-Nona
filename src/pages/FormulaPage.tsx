import { Drop } from "@phosphor-icons/react/Drop";
import { Leaf } from "@phosphor-icons/react/Leaf";
import { TestTube } from "@phosphor-icons/react/TestTube";
import {
  ClaimsReviewNotice,
  ProductCard,
  Reveal,
  SectionHeading,
} from "../components/ui";
import { isClaimFieldPublishable } from "../claims";
import {
  formulaContent,
  useOfficialPageData,
  useProductData,
} from "../data";

export default function FormulaPage() {
  const { pageByPath } = useOfficialPageData();
  const { products } = useProductData();
  const page = pageByPath.get("/ourformula");
  const formulaIcons = {
    archaea: TestTube,
    "dead-sea": Drop,
    "new-generation": Leaf,
  };
  const formulaChapters = formulaContent.map((chapter) => ({
    ...chapter,
    icon: formulaIcons[chapter.id as keyof typeof formulaIcons] ?? Leaf,
    summary: isClaimFieldPublishable("formula", chapter.id, "summary")
      ? chapter.summary
      : "Описание свойства проходит проверку для рынка Молдовы.",
    text: isClaimFieldPublishable("formula", chapter.id, "text")
      ? chapter.text
      : "Подробная формулировка временно скрыта до документированного approval.",
  }));
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
            <ClaimsReviewNotice scope="formula" compact />
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
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.slug} product={product} compact catalogImage />
          ))}
        </div>
      </section>
    </>
  );
}
