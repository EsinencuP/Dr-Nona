import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { Bathtub } from "@phosphor-icons/react/Bathtub";
import { Drop } from "@phosphor-icons/react/Drop";
import { Flower } from "@phosphor-icons/react/Flower";
import { Leaf } from "@phosphor-icons/react/Leaf";
import { Pill } from "@phosphor-icons/react/Pill";
import { ShieldCheck } from "@phosphor-icons/react/ShieldCheck";
import { Sparkle } from "@phosphor-icons/react/Sparkle";
import { Waves } from "@phosphor-icons/react/Waves";
import { Reveal } from "../../components/ui";
import { useLocale } from "../../locales/LocaleProvider";
import { Link } from "../../router";

const categoryIcons = [Leaf, Drop, Waves, Bathtub, Sparkle, Pill, Flower, ShieldCheck];

// Owner-requested overview of existing products, not a new catalogue taxonomy.
// Keep descriptions informational; regulated efficacy claims remain gated.
const categoryCopy = {
  ru: {
    title: "Категории продукции",
    intro: "Уход за лицом, телом и волосами, соли Мёртвого моря, пищевые добавки и ароматы — ассортимент Dr. Nona охватывает разные стороны повседневной заботы о себе.",
    catalogue: "Весь каталог",
    categories: [
      {
        id: "face",
        title: "Косметика для лица",
        description: "Очищение, дневной и вечерний уход: от молочка и масок до кремов и сывороток. Разные форматы и текстуры позволяют выстроить последовательный ритуал ухода за лицом.",
      },
      {
        id: "body",
        title: "Косметика для тела",
        description: "Лосьоны, кремы и масло ши для ухода за телом, руками и ногтями. Средства для привычных ежедневных процедур и моментов, когда хочется уделить себе больше внимания.",
      },
      {
        id: "hair",
        title: "Средства для волос и кожи головы",
        description: "Минеральный шампунь и кондиционер дополняют друг друга в уходе за волосами. Очищение волос и кожи головы, а затем уход по длине — два последовательных этапа одного ритуала.",
      },
      {
        id: "bath",
        title: "Соли для ванн",
        description: "Соли Мёртвого моря с растительными экстрактами: ромашкой, лавандой, розмарином и другими ароматными сочетаниями. Отдельное направление для домашних водных процедур.",
      },
      {
        id: "age-care",
        title: "Антивозрастная серия",
        description: "Кремы для лица, средства для области вокруг глаз и сыворотки для тех, кто уделяет особое внимание возрастному уходу. Дневные и ночные форматы дополняют привычную программу заботы о коже.",
      },
      {
        id: "supplements",
        title: "Биологически активные добавки",
        description: "Отдельное направление Dr. Nona для дополнения повседневного рациона. У каждого комплекса свой состав и способ применения — подробности собраны в описании конкретного продукта.",
      },
      {
        id: "fragrance",
        title: "Ароматы и парфюмерия",
        description: "Парфюмерные композиции для женщин и мужчин. Аромат можно выбрать под свой стиль, настроение и повод — для повседневной жизни или особенного момента.",
      },
      {
        id: "hygiene",
        title: "Гигиена и ежедневный уход",
        description: "Гели для душа, дезодоранты и средства для ухода за полостью рта. Продукты для повседневной чистоты, которые занимают своё место среди привычных утренних и вечерних процедур.",
      },
    ],
  },
  ro: {
    title: "Categorii de produse",
    intro: "Îngrijirea feței, corpului și părului, săruri din Marea Moartă, suplimente alimentare și parfumuri — gama Dr. Nona cuprinde diferite aspecte ale grijii de zi cu zi pentru sine.",
    catalogue: "Întregul catalog",
    categories: [
      {
        id: "face",
        title: "Îngrijirea feței",
        description: "Curățare, îngrijire de zi și de seară: de la lapte demachiant și măști la creme și seruri. Formatele și texturile variate permit construirea unui ritual consecvent de îngrijire a feței.",
      },
      {
        id: "body",
        title: "Îngrijirea corpului",
        description: "Loțiuni, creme și unt de shea pentru corp, mâini și unghii. Produse pentru rutina zilnică și pentru momentele în care doriți să vă acordați mai multă atenție.",
      },
      {
        id: "hair",
        title: "Îngrijirea părului și a scalpului",
        description: "Șamponul mineral și balsamul se completează în îngrijirea părului. Curățarea părului și a scalpului, urmată de îngrijirea pe lungime, formează două etape ale aceluiași ritual.",
      },
      {
        id: "bath",
        title: "Săruri de baie",
        description: "Săruri din Marea Moartă cu extracte vegetale: mușețel, lavandă, rozmarin și alte combinații aromatice. O categorie dedicată ritualurilor de baie acasă.",
      },
      {
        id: "age-care",
        title: "Gama anti-îmbătrânire",
        description: "Creme de față, produse pentru zona ochilor și seruri pentru cei care acordă atenție îngrijirii pielii mature. Formatele de zi și de noapte completează rutina de îngrijire a pielii.",
      },
      {
        id: "supplements",
        title: "Suplimente alimentare",
        description: "O categorie distinctă Dr. Nona pentru completarea alimentației zilnice. Fiecare complex are propria compoziție și propriul mod de utilizare, prezentate în descrierea produsului respectiv.",
      },
      {
        id: "fragrance",
        title: "Arome și parfumuri",
        description: "Compoziții de parfumerie pentru femei și bărbați. Alegeți aroma în funcție de stil, dispoziție și ocazie, pentru viața de zi cu zi sau pentru un moment deosebit.",
      },
      {
        id: "hygiene",
        title: "Igienă și îngrijire zilnică",
        description: "Geluri de duș, deodorante și produse pentru igiena orală. Produse pentru curățenia de zi cu zi, care își găsesc locul în rutina obișnuită de dimineață și de seară.",
      },
    ],
  },
};

export function HomeProductCategories() {
  const { locale } = useLocale();
  const copy = categoryCopy[locale];

  return (
    <section className="home-categories" aria-labelledby="home-categories-title">
      <div className="container">
        <Reveal className="home-categories__intro">
          <h2 id="home-categories-title">{copy.title}</h2>
          <p>{copy.intro}</p>
        </Reveal>
        <div className="home-categories__grid">
          {copy.categories.map(({ id, title, description }, index) => {
            const Icon = categoryIcons[index];
            return (
              <Reveal className="home-category" key={id}>
                <div className="home-category__heading">
                  <Icon aria-hidden="true" />
                  <h3>{title}</h3>
                </div>
                <p>{description}</p>
              </Reveal>
            );
          })}
        </div>
        <div className="home-categories__footer">
          <Link className="button button--primary" to="/products">
            {copy.catalogue} <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
