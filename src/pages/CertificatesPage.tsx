import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { MapPin } from "@phosphor-icons/react/MapPin";
import { SealCheck } from "@phosphor-icons/react/SealCheck";
import { marketData } from "../market";
import { useLocale } from "../locales/LocaleProvider";

export default function CertificatesPage() {
  const { locale } = useLocale();
  const copy = locale === "ro" ? {
    eyebrow: "Dr. Nona · Documente", title: "Certificate și documente",
    archive: "Arhivă oficială", issuer: "Emitent", country: "Țara de valabilitate",
    products: "Produse", validity: "Perioada de valabilitate", open: "Deschide documentul",
    documents: "Documente Dr. Nona", international: "Arhiva internațională de certificate",
    intro: "Documentele despre produse și producție sunt reunite în arhiva internațională oficială Dr. Nona.",
    source: "Sursă oficială", sourceText: "Lista documentelor se deschide pe site-ul oficial al mărcii.",
    openArchive: "Deschide arhiva internațională",
  } : {
    eyebrow: "Dr. Nona · Документы", title: "Сертификаты и документы",
    archive: "Официальный архив", issuer: "Кем выдан", country: "Страна действия",
    products: "Продукты", validity: "Срок действия", open: "Открыть документ",
    documents: "Документы Dr. Nona", international: "Международный архив сертификатов",
    intro: "Документы о продукции и производстве собраны в официальном международном архиве Dr. Nona.",
    source: "Официальный источник", sourceText: "Список документов открывается на официальном сайте бренда.",
    openArchive: "Открыть международный архив",
  };
  const certificates = marketData.moldovaCertificates;
  return (
    <section className="official-page container">
      <div className="official-page__header official-page__header--split">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
        </div>
        <span className="market-badge">
          <MapPin aria-hidden="true" /> {copy.archive}
        </span>
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
              <a href={certificate.documentUrl} target="_blank" rel="noreferrer">
                {copy.open} <ArrowUpRight aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div className="certificate-market-status">
          <div className="certificate-market-status__message" role="note">
            <SealCheck aria-hidden="true" />
            <div>
              <p className="eyebrow">{copy.documents}</p>
              <h2>{copy.international}</h2>
              <p>{copy.intro}</p>
            </div>
          </div>
          <div className="certificate-international-note">
            <div>
              <p className="eyebrow">{copy.source}</p>
              <p>{copy.sourceText}</p>
            </div>
            <a
              className="button button--quiet"
              href={marketData.certificatePolicy.internationalArchiveUrl}
              target="_blank"
              rel="noreferrer"
            >
              {copy.openArchive} <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
