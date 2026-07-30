import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { CopySimple } from "@phosphor-icons/react/CopySimple";
import { EnvelopeSimple } from "@phosphor-icons/react/EnvelopeSimple";
import { MapPin } from "@phosphor-icons/react/MapPin";
import { Phone } from "@phosphor-icons/react/Phone";
import { SealCheck } from "@phosphor-icons/react/SealCheck";
import { useState } from "react";
import { useProductData } from "../data";
import type { Product } from "../data";
import {
  buildConsultationEmail,
  copyConsultationText,
  resolveSelectionProducts,
} from "../features/contact/consultation";
import { useSelection } from "../features/selection/SelectionContext";
import { marketData } from "../market";
import { Link, useSearchParams } from "../router";

function ContactPageWithProducts({ slugs }: { slugs: string[] }) {
  const { productBySlug } = useProductData();
  return (
    <ContactPageContent
      handoffProducts={resolveSelectionProducts(slugs, productBySlug)}
    />
  );
}

export default function ContactPage() {
  const [params] = useSearchParams();
  const { selected } = useSelection();
  const productParam = params.get("products");
  const slugs = productParam !== null ? productParam.split(",") : selected;
  return slugs.length ? (
    <ContactPageWithProducts slugs={slugs} />
  ) : (
    <ContactPageContent handoffProducts={[]} />
  );
}

function ContactPageContent({
  handoffProducts,
}: {
  handoffProducts: Product[];
}) {
  const [copyStatus, setCopyStatus] = useState("");
  const emailHref = buildConsultationEmail(handoffProducts);
  const handleCopy = async () => {
    const copied = await copyConsultationText(handoffProducts);
    setCopyStatus(
      copied
        ? "Список скопирован полностью. Вставьте его в удобный канал связи."
        : "Не удалось скопировать список. Используйте подготовленное письмо."
    );
  };

  return (
    <section className="contact-page container">
      <div className="official-page__header">
        <p className="eyebrow">Dr. Nona · Молдова</p>
        <h1>Контакты в Молдове</h1>
      </div>
      <div className="contact-layout">
        <div className="contact-direct">
          <p className="eyebrow">Кишинёв · Прямая связь</p>
          <h2>Консультация в Кишинёве</h2>
          <p>
            {handoffProducts.length
              ? "Подборка перенесена на страницу консультации. Позвоните по локальному номеру или проверьте позиции ниже и подготовьте письмо в международную службу поддержки."
              : "Официальный список филиалов Dr. Nona указывает адрес в Кишинёве и два молдавских номера. Для письменного обращения доступен отдельный email международной службы поддержки."}
          </p>
          {handoffProducts.length > 0 && (
            <div className="contact-handoff" aria-labelledby="contact-handoff-title">
              <div className="contact-handoff__header">
                <h3 id="contact-handoff-title">В письмо войдут</h3>
                <span>{handoffProducts.length} поз.</span>
              </div>
              <ul>
                {handoffProducts.map((product) => (
                  <li key={product.slug}>
                    <Link to={`/product/${product.slug}`}>{product.officialName}</Link>
                    <span>SKU {product.sku || "не указан"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="contact-direct__actions">
            <a
              className="button button--primary"
              href={marketData.contact.phones[0].href}
            >
              <Phone aria-hidden="true" />
              {marketData.contact.phones[0].label}
            </a>
            <a
              className="button button--quiet"
              href={marketData.contact.phones[1].href}
            >
              <Phone aria-hidden="true" />
              {marketData.contact.phones[1].label}
            </a>
            <a
              className="button button--quiet"
              href={emailHref}
            >
              <EnvelopeSimple aria-hidden="true" />
              {handoffProducts.length
                ? "Подготовить письмо"
                : "Email международной поддержки"}
            </a>
            {handoffProducts.length > 0 && (
              <button className="button button--quiet" type="button" onClick={handleCopy}>
                <CopySimple aria-hidden="true" /> Скопировать список
              </button>
            )}
          </div>
          {copyStatus && (
            <p className="consultation-copy-status" role="status" aria-live="polite">
              {copyStatus}
            </p>
          )}
          <div className="contact-direct__notice" role="note">
            <SealCheck aria-hidden="true" />
            <span>
              Телефон и адрес взяты из официального списка филиалов Dr. Nona.
              Email относится к международной службе поддержки. Сайт не
              сохраняет и не имитирует отправку персональных данных.{" "}
              <Link to="/privacypolicy">Политика конфиденциальности</Link>
            </span>
          </div>
        </div>
        <aside className="contact-card">
          <MapPin aria-hidden="true" />
          <h2>Филиал в Молдове</h2>
          <p>
            {marketData.contact.country}<br />
            {marketData.contact.city}<br />
            {marketData.contact.address}
          </p>
          {marketData.contact.phones.map((phone) => (
            <a href={phone.href} key={phone.href}>
              <Phone aria-hidden="true" /> {phone.label}
            </a>
          ))}
          <a
            className="contact-card__source"
            href={marketData.contact.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            Проверить в списке филиалов <ArrowUpRight aria-hidden="true" />
          </a>
          <small>
            Локальный email и название юридического лица в официальном списке
            не указаны.
          </small>
        </aside>
      </div>
    </section>
  );
}
