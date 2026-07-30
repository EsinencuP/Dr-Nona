import { Link } from "../router";

export default function NotFoundPage() {
  return (
    <section className="not-found container">
      <span>404</span>
      <h1>Эта страница ушла за горизонт</h1>
      <p>Вернитесь в каталог или на главную страницу.</p>
      <Link className="button button--primary" to="/">На главную</Link>
    </section>
  );
}
