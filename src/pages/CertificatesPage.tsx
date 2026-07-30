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
          <h1>Сертификаты для Молдовы</h1>
        </div>
        <span className="market-badge">
          <MapPin aria-hidden="true" /> Молдова
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
              <p className="eyebrow">Проверка применимости</p>
              <h2>На сайте нет опубликованных сертификатов для Молдовы</h2>
              <p>
                В официальном архиве не найден проверяемый набор документов,
                подтверждающий применение именно на рынке Молдовы. Документы
                России, Израиля и Украины здесь не показываются, чтобы их нельзя
                было принять за молдавское подтверждение.
              </p>
            </div>
          </div>
          <dl className="certificate-requirements">
            <div><dt>Кем выдан</dt><dd>Обязательное поле</dd></div>
            <div><dt>Страна действия</dt><dd>Только Молдова</dd></div>
            <div><dt>Продукты</dt><dd>Точный перечень</dd></div>
            <div><dt>Срок действия</dt><dd>Начало и окончание</dd></div>
          </dl>
          <div className="certificate-international-note">
            <div>
              <p className="eyebrow">Международные материалы</p>
              <p>
                Международный архив Dr. Nona доступен отдельно и не является
                доказательством регистрации или сертификации продукта в Молдове.
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
