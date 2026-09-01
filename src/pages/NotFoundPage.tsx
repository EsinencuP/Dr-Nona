import { Link } from "../router";
import { useLocale } from "../locales/LocaleProvider";

export default function NotFoundPage() {
  const { locale } = useLocale();
  const copy = locale === "ro"
    ? ["Această pagină a dispărut din orizont", "Reveniți la catalog sau la pagina principală.", "Pagina principală"]
    : ["Эта страница ушла за горизонт", "Вернитесь в каталог или на главную страницу.", "На главную"];
  return (
    <section className="not-found container">
      <span>404</span>
      <h1>{copy[0]}</h1>
      <p>{copy[1]}</p>
      <Link className="button button--primary" to="/">{copy[2]}</Link>
    </section>
  );
}
