import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { BookmarkSimple } from "@phosphor-icons/react/BookmarkSimple";
import { CopySimple } from "@phosphor-icons/react/CopySimple";
import { EnvelopeSimple } from "@phosphor-icons/react/EnvelopeSimple";
import { X } from "@phosphor-icons/react/X";
import { useState } from "react";
import type { CSSProperties } from "react";
import { ProductImage } from "../components/ProductImage";
import { useProductData } from "../data";
import type { Product } from "../data";
import {
  buildConsultationEmail,
  buildConsultationPath,
  copyConsultationText,
} from "../features/contact/consultation";
import { useSelection } from "../features/selection/SelectionContext";
import { useLocale } from "../locales/LocaleProvider";
import { Link } from "../router";

export default function SelectionPage() {
  const { selected, toggle } = useSelection();
  const { productBySlug } = useProductData();
  const { locale } = useLocale();
  const copy = locale === "ro"
    ? {
        eyebrow: "Selecția mea",
        title: "Produse selectate",
        intro:
          "Păstrați produsele care vă interesează și transmiteți selecția consultantului.",
        sku: "Cod produs",
        missingSku: "nu este indicat",
        remove: "Elimină",
        next: "Pasul următor",
        handoff: "Trimiteți selecția pentru consultație",
        handoffSummary: (count: number) =>
          `Consultantul va primi denumirile, codurile și linkurile celor ${count} produse selectate.`,
        continue: "Verifică și continuă",
        email: "Pregătește emailul",
        copy: "Copiază lista",
        copied: "Lista completă a fost copiată.",
        copyFailed:
          "Lista nu a putut fi copiată. Continuați la verificarea solicitării.",
        emptyTitle: "Selecția este goală",
        emptyText:
          "Adăugați produse din catalog — ele vor rămâne aici și după schimbarea paginii.",
        openCatalog: "Deschide catalogul",
      }
    : {
        eyebrow: "Личная подборка",
        title: "Выбранные продукты",
        intro:
          "Сохраните интересующие позиции и передайте готовый список консультанту.",
        sku: "Артикул",
        missingSku: "не указан",
        remove: "Удалить",
        next: "Следующий шаг",
        handoff: "Передать подборку для консультации",
        handoffSummary: (count: number) =>
          `Консультант получит названия, артикулы и ссылки для ${count} выбранных позиций.`,
        continue: "Проверить и продолжить",
        email: "Подготовить email",
        copy: "Скопировать список",
        copied: "Список скопирован полностью.",
        copyFailed:
          "Не удалось скопировать список. Перейдите к проверке перед отправкой.",
        emptyTitle: "В подборке пока нет продуктов",
        emptyText:
          "Добавляйте продукты из каталога — они останутся здесь и после перехода на другую страницу.",
        openCatalog: "Открыть каталог",
      };
  const [copyStatus, setCopyStatus] = useState("");
  const chosen = selected.map((slug) => productBySlug.get(slug)).filter((item): item is Product => Boolean(item));
  const consultationPath = buildConsultationPath(chosen);
  const emailHref = buildConsultationEmail(chosen, locale);
  const handleCopy = async () => {
    const copied = await copyConsultationText(chosen, locale);
    setCopyStatus(copied ? copy.copied : copy.copyFailed);
  };
  return (
    <section className="selection-page container">
      <div className="page-intro">
        <div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1></div>
        <p>{copy.intro}</p>
      </div>
      {chosen.length ? (
        <div className="selection-layout">
          <div className="selection-list">
            {chosen.map((product) => (
              <article key={product.slug}>
                <Link
                  className="selection-list__media"
                  to={`/product/${product.slug}`}
                  aria-label={product.officialName}
                  style={{
                    "--selection-object-scale": product.catalogScale,
                  } as CSSProperties}
                >
                  <ProductImage
                    src={product.image}
                    alt=""
                    width="900"
                    height="900"
                    sizes="(max-width: 640px) 100px, 160px"
                  />
                </Link>
                <div>
                  <small>{product.category}</small>
                  <h2><Link to={`/product/${product.slug}`}>{product.officialName}</Link></h2>
                  <p className="selection-list__sku">{copy.sku}: {product.sku || copy.missingSku}</p>
                </div>
                <button type="button" onClick={() => toggle(product.slug)} aria-label={`${copy.remove} ${product.officialName}`}><X aria-hidden="true" /></button>
              </article>
            ))}
          </div>
          <div className="selection-contact">
            <div>
              <p className="eyebrow eyebrow--light">{copy.next}</p>
              <h2>{copy.handoff}</h2>
              <p className="selection-contact__summary">
                {copy.handoffSummary(chosen.length)}
              </p>
            </div>
            <div>
              <Link className="button button--light" to={consultationPath}>
                {copy.continue} <ArrowRight aria-hidden="true" />
              </Link>
              <a className="button button--outline-light" href={emailHref}>
                <EnvelopeSimple aria-hidden="true" /> {copy.email}
              </a>
              <button className="button button--outline-light" type="button" onClick={handleCopy}>
                <CopySimple aria-hidden="true" /> {copy.copy}
              </button>
              {copyStatus && (
                <p className="selection-contact__status" role="status" aria-live="polite">
                  {copyStatus}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <BookmarkSimple aria-hidden="true" />
          <h2>{copy.emptyTitle}</h2>
          <p>{copy.emptyText}</p>
          <Link className="button button--primary" to="/products">{copy.openCatalog}</Link>
        </div>
      )}
    </section>
  );
}
