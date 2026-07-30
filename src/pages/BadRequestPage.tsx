import { useEffect } from "react";
import { reportClientError } from "../app/monitoring";
import { Link } from "../router";

export default function BadRequestPage() {
  useEffect(() => {
    reportClientError(
      new URIError("Malformed URL redirected by the server guard."),
      { kind: "malformed-route", source: "router" }
    );
  }, []);

  return (
    <section className="not-found container">
      <span>400</span>
      <h1>Ссылка повреждена</h1>
      <p>
        Адрес содержит некорректную последовательность символов. Ошибка
        зафиксирована, а остальные страницы продолжают работать.
      </p>
      <Link className="button button--primary" to="/">На главную</Link>
    </section>
  );
}
