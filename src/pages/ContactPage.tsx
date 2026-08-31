import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { CopySimple } from "@phosphor-icons/react/CopySimple";
import { EnvelopeSimple } from "@phosphor-icons/react/EnvelopeSimple";
import { MapPin } from "@phosphor-icons/react/MapPin";
import { Phone } from "@phosphor-icons/react/Phone";
import { useState } from "react";
import { useProductData } from "../data";
import type { Product } from "../data";
import {
  buildConsultationEmail,
  copyConsultationText,
  resolveSelectionProducts,
} from "../features/contact/consultation";
import { ApplicationForm } from "../features/contact/ApplicationForm";
import { useSelection } from "../features/selection/SelectionContext";
import { useLocale } from "../locales/LocaleProvider";
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
  const { locale } = useLocale();
  const copy = locale === "ro"
    ? {
        eyebrow: "Dr. Nona · Moldova",
        title: "Contacte în Moldova",
        directEyebrow: "Chișinău · Contact direct",
        directTitle: "Consultație în Chișinău",
        withSelection:
          "Selecția a fost transferată în formular. Verificați produsele de mai jos și trimiteți solicitarea sau contactați direct filiala.",
        withoutSelection:
          "Pentru o consultație, completați formularul sau contactați direct filiala Dr. Nona din Chișinău.",
        included: "Produse incluse",
        positions: "produse",
        missingSku: "nu este indicat",
        prepareEmail: "Pregătește emailul",
        supportEmail: "Email suport internațional",
        copyList: "Copiază lista",
        copied:
          "Lista completă a fost copiată. O puteți transmite prin canalul preferat.",
        copyFailed:
          "Lista nu a putut fi copiată. Utilizați emailul pregătit.",
        branch: "Filiala din Moldova",
        source: "Lista oficială a filialelor",
        country: "Moldova",
      }
    : {
        eyebrow: "Dr. Nona · Молдова",
        title: "Контакты в Молдове",
        directEyebrow: "Кишинёв · Прямая связь",
        directTitle: "Консультация в Кишинёве",
        withSelection:
          "Подборка перенесена в форму. Проверьте товары ниже и отправьте заявку или свяжитесь с филиалом напрямую.",
        withoutSelection:
          "Для консультации заполните форму или свяжитесь напрямую с филиалом Dr. Nona в Кишинёве.",
        included: "В заявку войдут",
        positions: "поз.",
        missingSku: "не указан",
        prepareEmail: "Подготовить письмо",
        supportEmail: "Email международной поддержки",
        copyList: "Скопировать список",
        copied:
          "Список скопирован полностью. Вставьте его в удобный канал связи.",
        copyFailed:
          "Не удалось скопировать список. Используйте подготовленное письмо.",
        branch: "Филиал в Молдове",
        source: "Официальный список филиалов",
        country: "Молдова",
      };
  const [copyStatus, setCopyStatus] = useState("");
  const emailHref = buildConsultationEmail(handoffProducts, locale);
  const handleCopy = async () => {
    const copied = await copyConsultationText(handoffProducts, locale);
    setCopyStatus(copied ? copy.copied : copy.copyFailed);
  };

  return (
    <section className="contact-page container">
      <div className="official-page__header">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
      </div>
      <ApplicationForm products={handoffProducts} />
      <div className="contact-layout">
        <div className="contact-direct">
          <p className="eyebrow">{copy.directEyebrow}</p>
          <h2>{copy.directTitle}</h2>
          <p>
            {handoffProducts.length ? copy.withSelection : copy.withoutSelection}
          </p>
          {handoffProducts.length > 0 && (
            <div className="contact-handoff" aria-labelledby="contact-handoff-title">
              <div className="contact-handoff__header">
                <h3 id="contact-handoff-title">{copy.included}</h3>
                <span>{handoffProducts.length} {copy.positions}</span>
              </div>
              <ul>
                {handoffProducts.map((product) => (
                  <li key={product.slug}>
                    <Link to={`/product/${product.slug}`}>{product.officialName}</Link>
                    <span>SKU {product.sku || copy.missingSku}</span>
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
                ? copy.prepareEmail
                : copy.supportEmail}
            </a>
            {handoffProducts.length > 0 && (
              <button className="button button--quiet" type="button" onClick={handleCopy}>
                <CopySimple aria-hidden="true" /> {copy.copyList}
              </button>
            )}
          </div>
          {copyStatus && (
            <p className="consultation-copy-status" role="status" aria-live="polite">
              {copyStatus}
            </p>
          )}
        </div>
        <aside className="contact-card">
          <MapPin aria-hidden="true" />
          <h2>{copy.branch}</h2>
          <p>
            {copy.country}<br />
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
            {copy.source} <ArrowUpRight aria-hidden="true" />
          </a>
        </aside>
      </div>
    </section>
  );
}
