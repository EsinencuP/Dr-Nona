import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { Drop } from "@phosphor-icons/react/Drop";
import { Flask } from "@phosphor-icons/react/Flask";
import { Heart } from "@phosphor-icons/react/Heart";
import { Leaf } from "@phosphor-icons/react/Leaf";
import { TestTube } from "@phosphor-icons/react/TestTube";
import { Pill } from "@phosphor-icons/react/Pill";
import { Atom } from "@phosphor-icons/react/Atom";
import { useState } from "react";
import { Reveal, splitText } from "../components/ui";
import { HomeProductCategories } from "../features/content/HomeProductCategories";
import { useLocale } from "../locales/LocaleProvider";
import { Link } from "../router";

export default function HomePage() {
  const { locale } = useLocale();
  const today = new Date();
  const companyYears = today.getFullYear() - 1994 - Number(today < new Date(today.getFullYear(), 7, 22));
  const yearForm = new Intl.PluralRules(locale).select(companyYears);
  const copy = locale === "ro"
    ? {
        heroTagline: "Creat de natură",
        heroLead:
          "Combinăm forța mineralelor Mării Moarte cu cercetarea științifică modernă pentru a crea produse de îngrijire zilnică și frumusețe.",
        heroPrinciples: "Principiile Dr. Nona",
        heroBenefitsHint: "Încă 3 principii — derulați orizontal",
        scienceIntro: "Creat de natură. Dezvăluit de știință.",
        scienceFallback:
          "Formula proprie reunește originea Mării Moarte cu abordarea științifică Dr. Nona.",
        formulaStory: "Descoperă formula Halo Complex™",
        aboutLink: "Despre compania Dr. Nona",
        aboutTitle: "Despre noi",
        aboutIntro:
          "Suntem reprezentanții oficiali ai companiei israeliene Dr. Nona în Moldova, oferind produse originale și o abordare profesionistă pentru fiecare client.",
        aboutMission:
          "Misiunea noastră este să facem produsele originale Dr. Nona accesibile în Moldova, ajutând oamenii să aibă grijă de sănătatea, frumusețea și calitatea vieții lor în fiecare zi.",
        companyHistory: "Istoria companiei",
        historyText:
          "Compania Dr. Nona International a fost fondată la 22 august 1994, pe acoperișul casei doctorului Nona și a lui Mihail Șneerson.",
        continueHistory: "Citește istoria Dr. Nona",
        years: companyYears === 1 ? "an de istorie" : "de ani de istorie",
      }
    : {
        heroTagline: "Сделано природой",
        heroLead:
          "Мы объединяем силу минералов Мёртвого моря и передовые научные разработки, чтобы создавать продукты для ежедневного ухода и красоты.",
        heroPrinciples: "Принципы Dr. Nona",
        heroBenefitsHint: "Ещё 3 принципа — листайте горизонтально",
        scienceIntro: "Сделано природой. Раскрыто наукой.",
        scienceFallback:
          "Фирменная формула объединяет происхождение Мёртвого моря и научный подход Dr. Nona.",
        formulaStory: "Узнать о формуле Halo Complex™",
        aboutLink: "О компании Dr. Nona",
        aboutTitle: "О нас",
        aboutIntro:
          "Мы являемся официальными представителями израильской компании Dr. Nona в Молдове, предоставляя оригинальную продукцию и профессиональный подход к каждому клиенту.",
        aboutMission:
          "Наша миссия — сделать оригинальную продукцию Dr. Nona доступной в Молдове, помогая людям заботиться о своём здоровье, красоте и качестве жизни каждый день.",
        companyHistory: "История компании",
        historyText:
          "Компания Dr. Nona International была основана 22 августа 1994 года, на крыше дома Доктора Нонны и Михаила Шнеерсона.",
        continueHistory: "Читать историю Dr. Nona",
        years: yearForm === "one" ? "год истории" : yearForm === "few" ? "года истории" : "лет истории",
      };
  const [scienceFocus, setScienceFocus] = useState<"archaea" | "minerals" | "extracts" | "vitamins" | "amino-acids">("minerals");
  const scienceNodes = locale === "ro" ? [
    {
      id: "archaea" as const,
      label: "Arhebacterie",
      description:
        "O componentă naturală unică, provenită din mediul extrem al Mării Moarte.",
      icon: TestTube,
    },
    {
      id: "minerals" as const,
      label: "Mineralele mării",
      description:
        "O bază minerală asociată ecosistemului natural al Mării Moarte.",
      icon: Drop,
    },
    {
      id: "extracts" as const,
      label: "Extracte naturale",
      description:
        "Componentele vegetale completează formulele de îngrijire zilnică.",
      icon: Leaf,
    },
    {
      id: "vitamins" as const,
      label: "Vitamine",
      description: "Vitaminele fac parte din formulele unor produse Dr. Nona, precum Goldseen și Okseen.",
      icon: Pill,
    },
    {
      id: "amino-acids" as const,
      label: "Aminoacizi",
      description: "În formula Phase 9, aminoacizii sunt combinați cu vitamine și minerale.",
      icon: Atom,
    },
  ] : [
    {
      id: "archaea" as const,
      label: "Архебактерия",
      description: "Уникальный природный компонент из экстремальной среды Мёртвого моря.",
      icon: TestTube,
    },
    {
      id: "minerals" as const,
      label: "Минералы моря",
      description: "Минеральная база, связанная с природной экосистемой Мёртвого моря.",
      icon: Drop,
    },
    {
      id: "extracts" as const,
      label: "Природные экстракты",
      description: "Растительные компоненты дополняют формулы ежедневного ухода.",
      icon: Leaf,
    },
    {
      id: "vitamins" as const,
      label: "Витамины",
      description: "Витамины входят в состав отдельных формул Dr. Nona, например Goldseen и Okseen.",
      icon: Pill,
    },
    {
      id: "amino-acids" as const,
      label: "Аминокислоты",
      description: "В составе Phase 9 аминокислоты сочетаются с витаминами и минералами.",
      icon: Atom,
    },
  ];
  const activeScienceNode = scienceNodes.find((node) => node.id === scienceFocus) ?? scienceNodes[1];
  const ActiveScienceIcon = activeScienceNode.icon;
  const formulaParagraph = "";
  const heroBenefits = [
    { icon: Drop, title: locale === "ro" ? "Mineralele Mării Moarte" : "Минералы Мёртвого моря", text: locale === "ro" ? "O sursă naturală unică" : "Уникальный природный источник" },
    { icon: Flask, title: locale === "ro" ? "Cercetare științifică" : "Научные разработки", text: locale === "ro" ? "Formule contemporane" : "Современные формулы" },
    { icon: Leaf, title: locale === "ro" ? "Ingrediente naturale" : "Природные компоненты", text: locale === "ro" ? "Extracte și minerale" : "Экстракты и минералы" },
    { icon: Heart, title: locale === "ro" ? "Grijă pentru dumneavoastră" : "Забота о вас", text: locale === "ro" ? "Îngrijire zilnică" : "Ежедневный уход" },
  ];

  return (
    <>
      <section className="home-hero">
        <div className="home-hero__inner container">
          <div className="hero-copy">
            <h1>
              <span className="hero-title-line hero-title-line--ink">Halo</span>
              <span className="hero-title-line hero-title-line--sea">Complex™</span>
              <small>{copy.heroTagline}</small>
            </h1>
            <p className="hero-lead">
              {copy.heroLead}
            </p>
          </div>
          <div
            className="hero-visual"
            role="img"
            aria-label={locale === "ro" ? "Produse Dr. Nona pe malul Mării Moarte" : "Продукция Dr. Nona на берегу Мёртвого моря"}
          />
        </div>
        <div
          className="hero-benefits container"
          role="region"
          aria-label={copy.heroPrinciples}
          tabIndex={0}
        >
          {heroBenefits.map(({ icon: Icon, title, text }) => (
            <div className="hero-benefit" key={title}>
              <Icon aria-hidden="true" />
              <span><strong>{title}</strong><small>{text}</small></span>
            </div>
          ))}
        </div>
        <p className="hero-benefits__hint container">
          {copy.heroBenefitsHint} <ArrowRight aria-hidden="true" />
        </p>
      </section>

      <section className="science-section" id="halo-science">
        <div className="container science-grid">
          <Reveal className="science-copy">
            <h2>Halo Complex™</h2>
            <p className="science-intro">{copy.scienceIntro}</p>
            <p>
              {formulaParagraph
                ? splitText(formulaParagraph, 260)[0]
                : copy.scienceFallback}
            </p>
            <Link className="button button--light" to="/ourformula">
              {copy.formulaStory} <ArrowRight aria-hidden="true" />
            </Link>
          </Reveal>
          <Reveal className="science-diagram" delay={80}>
            <div className="science-orbit">
              <div className="science-rings" aria-hidden="true">
                <span />
                <span />
                <span />
                <div className="science-core">
                  <b>H</b>
                  <strong>Halo Complex™</strong>
                  <small>{activeScienceNode.label}</small>
                </div>
              </div>
              <div className="science-points">
                {scienceNodes.map(({ id, label, icon: Icon }) => (
                  <button
                    className={scienceFocus === id ? "is-active" : ""}
                    type="button"
                    key={id}
                    aria-pressed={scienceFocus === id}
                    onClick={() => setScienceFocus(id)}
                  >
                    <Icon aria-hidden="true" /><span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="science-focus-panel" aria-live="polite">
              <div className="science-focus-panel__icon" aria-hidden="true">
                <ActiveScienceIcon />
              </div>
              <div>
                <span>{activeScienceNode.label}</span>
                <i aria-hidden="true" />
                <p>{activeScienceNode.description}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="home-about" aria-labelledby="home-about-title">
        <div className="container home-about__inner">
          <Reveal className="home-about__heading">
            <h2 id="home-about-title">{copy.aboutTitle}</h2>
          </Reveal>
          <Reveal className="home-about__body" delay={70}>
            <p>{copy.aboutIntro} {copy.aboutMission}</p>
            <Link className="text-link" to="/about">{copy.aboutLink} <ArrowRight aria-hidden="true" /></Link>
          </Reveal>
        </div>
      </section>

      <HomeProductCategories />

      <section className="section container history-preview">
        <Reveal className="history-preview__visual">
          <span className="history-year">1994</span>
          <div className="history-sea" aria-hidden="true" />
          <div className="history-seal"><span>{companyYears}</span><small>{copy.years}</small></div>
        </Reveal>
        <Reveal className="history-preview__copy" delay={90}>
          <h2>{copy.companyHistory}</h2>
          <p>{copy.historyText}</p>
          <Link className="text-link text-link--large" to="/about/our-history">
            {copy.continueHistory} <ArrowRight aria-hidden="true" />
          </Link>
        </Reveal>
      </section>

    </>
  );
}
