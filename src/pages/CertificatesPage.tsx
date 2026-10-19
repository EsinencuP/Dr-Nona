import { SealCheck } from "@phosphor-icons/react/SealCheck";
import { marketData } from "../market";
import { useLocale } from "../locales/LocaleProvider";
import { Link } from "../router";

export default function CertificatesPage() {
  const { locale } = useLocale();
  const copy = locale === "ro" ? {    title: "Certificate și documente",
    issuer: "Emitent", country: "Țara de valabilitate",
    products: "Produse", validity: "Perioada de valabilitate",
    requestDocuments: "Solicită documentele",
  } : {    title: "Сертификаты и документы",
    issuer: "Кем выдан", country: "Страна действия",
    products: "Продукты", validity: "Срок действия",
    requestDocuments: "Запросить документы",
  };
  const certificates = marketData.moldovaCertificates;
  return (
    <section className="official-page container">
      <div className="official-page__header official-page__header--split">
        <div>
          <h1>{copy.title}</h1>
        </div>
      </div>
      {certificates.length > 0 ? (
        <div className="certificate-grid">
          {certificates.map((certificate) => (
            <article key={certificate.id}>
              <SealCheck aria-hidden="true" />
              <h2>{certificate.title}</h2>
              <dl>
                <div><dt>{copy.issuer}</dt><dd>{certificate.issuer}</dd></div>
                <div><dt>{copy.country}</dt><dd>{locale === "ro" ? "Moldova" : certificate.country}</dd></div>
                <div><dt>{copy.products}</dt><dd>{certificate.products.join(", ")}</dd></div>
                <div>
                  <dt>{copy.validity}</dt>
                  <dd>{certificate.validFrom} — {certificate.validUntil}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <Link className="button button--quiet" to="/contactus">{copy.requestDocuments}</Link>
      )}
    </section>
  );
}
