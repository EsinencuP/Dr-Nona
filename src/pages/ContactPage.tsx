import { CopySimple } from "@phosphor-icons/react/CopySimple";
import { EnvelopeSimple } from "@phosphor-icons/react/EnvelopeSimple";
import { Phone } from "@phosphor-icons/react/Phone";
import { useState } from "react";
import { useProductData } from "../data";
import type { Product } from "../data";
import {
  buildOrderEmail,
  copyOrderText,
  resolveSelectionProducts,
} from "../features/contact/consultation";
import { ApplicationForm } from "../features/contact/ApplicationForm";
import { useSelection } from "../features/selection/SelectionContext";
import { useLocale } from "../locales/LocaleProvider";
import { marketData } from "../market";
import { getProductTitle } from "../features/product/productNames";
import { Link, useSearchParams } from "../router";
import { PageBreadcrumbs } from "../components/PageNavigation";

function ContactPageWithProducts({ slugs, onAccepted }: { slugs: string[]; onAccepted: () => void }) {
  const { productBySlug } = useProductData();
  return (
    <ContactPageContent
      handoffProducts={resolveSelectionProducts(slugs, productBySlug)}
      onAccepted={onAccepted}
    />
  );
}

export default function ContactPage() {
  const [params, setParams] = useSearchParams();
  const { selected, clear } = useSelection();
  const [completed, setCompleted] = useState(false);
  const onAccepted = () => {
    setCompleted(true);
    clear();
    const nextParams = new URLSearchParams(params);
    nextParams.delete("products");
    setParams(nextParams, { replace: true });
  };
  const productParam = params.get("products");
  const slugs = Array.from(new Set([...selected, ...(productParam?.split(",") ?? [])])).filter(Boolean);
  return slugs.length || completed ? (
    <ContactPageWithProducts slugs={slugs} onAccepted={onAccepted} />
  ) : (
    <ContactPageContent handoffProducts={[]} />
  );
}

function ContactPageContent({
  handoffProducts,
  onAccepted,
}: {
  handoffProducts: Product[];
  onAccepted?: () => void;
}) {
  const { locale } = useLocale();
  const copy = locale === "ro"
    ? {
        title: "Contacte în Moldova",
        directTitle: "Contact pentru comandă",
        withSelection:
          "Produsele selectate au fost transferate în formularul comenzii.",
        withoutSelection:
          "Selectați produsele din catalog pentru a plasa o comandă.",
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
      }
    : {
        title: "Контакты в Молдове",
        directTitle: "Связь по заказу",
        withSelection:
          "Выбранные товары перенесены в форму заказа.",
        withoutSelection:
          "Выберите товары в каталоге, чтобы оформить заказ.",
        included: "В заказ войдут",
        positions: "поз.",
        missingSku: "не указан",
        prepareEmail: "Подготовить письмо",
        supportEmail: "Email международной поддержки",
        copyList: "Скопировать список",
        copied:
          "Список скопирован полностью. Вставьте его в удобный канал связи.",
        copyFailed:
          "Не удалось скопировать список. Используйте подготовленное письмо.",
      };
  const [copyStatus, setCopyStatus] = useState("");
  const emailHref = buildOrderEmail(handoffProducts, locale);
  const handleCopy = async () => {
    const copied = await copyOrderText(handoffProducts, locale);
    setCopyStatus(copied ? copy.copied : copy.copyFailed);
  };

  return (
    <section className="contact-page container">
      <PageBreadcrumbs current={copy.title} />
      <div className="official-page__header">
        <h1>{copy.title}</h1>
      </div>
      <ApplicationForm products={handoffProducts} onAccepted={onAccepted} />
      <div className="contact-layout">
        <div className="contact-direct">
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
                    <Link lang="en" to={`/product/${product.slug}`}>{getProductTitle(product)}</Link>
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
            <p className="order-copy-status" role="status" aria-live="polite">
              {copyStatus}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
