import { useEffect } from "react";
import { reportClientError } from "../app/monitoring";
import { Link } from "../router";
import { useLocale } from "../locales/LocaleProvider";

export default function BadRequestPage() {
  const { locale } = useLocale();
  const copy = locale === "ro"
    ? ["Link deteriorat", "Adresa conține o secvență incorectă de caractere. Eroarea a fost înregistrată, iar celelalte pagini continuă să funcționeze.", "Pagina principală"]
    : ["Ссылка повреждена", "Адрес содержит некорректную последовательность символов. Ошибка зафиксирована, а остальные страницы продолжают работать.", "На главную"];
  useEffect(() => {
    reportClientError(
      new URIError("Malformed URL redirected by the server guard."),
      { kind: "malformed-route", source: "router" }
    );
  }, []);

  return (
    <section className="not-found container">
      <span>400</span>
      <h1>{copy[0]}</h1>
      <p>{copy[1]}</p>
      <Link className="button button--primary" to="/">{copy[2]}</Link>
    </section>
  );
}
