import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { MapPin } from "@phosphor-icons/react/MapPin";
import { SealCheck } from "@phosphor-icons/react/SealCheck";
import { marketData } from "../market";

export default function CertificatesPage() {
  const certificates = marketData.moldovaCertificates;
  return (
    <section className="official-page container">
      <div className="official-page__header official-page__header--split">
        <div>
          <p className="eyebrow">Dr. Nona · Документы</p>
          <h1>Сертификаты и документы</h1>
        </div>
        <span className="market-badge">
          <MapPin aria-hidden="true" /> Официальный архив
        </span>
      </div>
      {certificates.length > 0 ? (
        <div className="certificate-grid">
          {certificates.map((certificate) => (
            <article key={certificate.id}>
              <SealCheck aria-hidden="true" />
              <h2>{certificate.title}</h2>
              <dl>
                <div><dt>Кем выдан</dt><dd>{certificate.issuer}</dd></div>
                <div><dt>Страна действия</dt><dd>{certificate.country}</dd></div>
                <div><dt>Продукты</dt><dd>{certificate.products.join(", ")}</dd></div>
                <div>
                  <dt>Срок действия</dt>
                  <dd>{certificate.validFrom} — {certificate.validUntil}</dd>
                </div>
              </dl>
              <a href={certificate.documentUrl} target="_blank" rel="noreferrer">
                Открыть документ <ArrowUpRight aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div className="certificate-market-status">
          <div className="certificate-market-status__message" role="note">
            <SealCheck aria-hidden="true" />
            <div>
              <p className="eyebrow">Документы Dr. Nona</p>
              <h2>Международный архив сертификатов</h2>
              <p>
                Документы о продукции и производстве собраны в официальном
                международном архиве Dr. Nona.
              </p>
            </div>
          </div>
          <div className="certificate-international-note">
            <div>
              <p className="eyebrow">Официальный источник</p>
              <p>
                Список документов открывается на официальном сайте бренда.
              </p>
            </div>
            <a
              className="button button--quiet"
              href={marketData.certificatePolicy.internationalArchiveUrl}
              target="_blank"
              rel="noreferrer"
            >
              Открыть международный архив <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
