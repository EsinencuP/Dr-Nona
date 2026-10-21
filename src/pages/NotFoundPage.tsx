import { Link } from "../router";
import { useLocale } from "../locales/LocaleProvider";
import { getNotFoundCopy } from "../not-found-copy.mjs";

export default function NotFoundPage() {
  const { locale } = useLocale();
  const copy = getNotFoundCopy(locale);
  return (
    <section className="not-found not-found--missing container" aria-labelledby="not-found-title">
      <div className="not-found__code" aria-hidden="true">404</div>
      <p className="not-found__label">{copy.label}</p>
      <h1 id="not-found-title">{copy.title}</h1>
      <p className="not-found__description">{copy.description}</p>
      <div className="not-found__actions">
        <Link className="button button--primary" to="/products">{copy.catalogue}</Link>
        <Link className="button button--quiet" to="/">{copy.home}</Link>
      </div>
    </section>
  );
}
