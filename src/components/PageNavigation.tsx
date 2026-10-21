import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { CaretRight } from "@phosphor-icons/react/CaretRight";
import { House } from "@phosphor-icons/react/House";
import { useLocale } from "../locales/LocaleProvider";
import { Link } from "../router";

type PageLink = { to: string; label: string };

export function PageBreadcrumbs({ current, parents = [], currentLang }: {
  current: string;
  parents?: PageLink[];
  currentLang?: string;
}) {
  const { t } = useLocale();
  return (
    <nav className="breadcrumbs" aria-label={t.breadcrumbs}>
      <ol className="breadcrumbs__list" role="list">
        <li>
          <Link className="breadcrumbs__home" to="/" aria-label={t.home}>
            <House aria-hidden="true" />
            <span>{t.home}</span>
          </Link>
        </li>
        {parents.map(({ to, label }) => (
          <li key={to}>
            <CaretRight className="breadcrumbs__separator" aria-hidden="true" />
            <Link to={to}>{label}</Link>
          </li>
        ))}
        <li className="breadcrumbs__current">
          <CaretRight className="breadcrumbs__separator" aria-hidden="true" />
          <span aria-current="page" lang={currentLang}>{current}</span>
        </li>
      </ol>
    </nav>
  );
}

export function ReadingLinks({ links }: { links: (PageLink & { description: string })[] }) {
  const { locale } = useLocale();
  return (
    <nav className="reading-links" aria-label={locale === "ro" ? "Pagini conexe" : "Связанные страницы"}>
      {links.map(({ to, label, description }) => (
        <Link key={to} to={to}>
          <span><strong>{label}</strong><small>{description}</small></span>
          <ArrowRight aria-hidden="true" />
        </Link>
      ))}
    </nav>
  );
}
