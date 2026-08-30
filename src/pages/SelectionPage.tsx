import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { BookmarkSimple } from "@phosphor-icons/react/BookmarkSimple";
import { CopySimple } from "@phosphor-icons/react/CopySimple";
import { EnvelopeSimple } from "@phosphor-icons/react/EnvelopeSimple";
import { X } from "@phosphor-icons/react/X";
import { useState } from "react";
import { ProductImage } from "../components/ProductImage";
import { useProductData } from "../data";
import type { Product } from "../data";
import {
  buildConsultationEmail,
  buildConsultationPath,
  copyConsultationText,
} from "../features/contact/consultation";
import { useSelection } from "../features/selection/SelectionContext";
import { Link } from "../router";

export default function SelectionPage() {
  const { selected, toggle } = useSelection();
  const { productBySlug } = useProductData();
  const [copyStatus, setCopyStatus] = useState("");
  const chosen = selected.map((slug) => productBySlug.get(slug)).filter((item): item is Product => Boolean(item));
  const consultationPath = buildConsultationPath(chosen);
  const emailHref = buildConsultationEmail(chosen);
  const handleCopy = async () => {
    const copied = await copyConsultationText(chosen);
    setCopyStatus(
      copied
        ? "Список скопирован полностью."
        : "Не удалось скопировать список. Перейдите к проверке перед отправкой."
    );
  };
  return (
    <section className="selection-page container">
      <div className="page-intro">
        <div><p className="eyebrow">Личная подборка</p><h1>Выбранные продукты</h1></div>
        <p>Сохраните интересующие позиции и используйте список при консультации.</p>
      </div>
      {chosen.length ? (
        <>
          <div className="selection-list">
            {chosen.map((product) => (
              <article key={product.slug}>
                <ProductImage
                  src={product.image}
                  alt=""
                  width="900"
                  height="900"
                  sizes="(max-width: 640px) 80px, 112px"
                />
                <div>
                  <small>{product.category}</small>
                  <h2><Link to={`/product/${product.slug}`}>{product.officialName}</Link></h2>
                  <p className="selection-list__sku">Артикул: {product.sku || "не указан"}</p>
                </div>
                <button type="button" onClick={() => toggle(product.slug)} aria-label={`Удалить ${product.officialName}`}><X aria-hidden="true" /></button>
              </article>
            ))}
          </div>
          <div className="selection-contact">
            <div>
              <p className="eyebrow eyebrow--light">Следующий шаг</p>
              <h2>Передать подборку для консультации</h2>
              <p className="selection-contact__summary">
                В контекст войдут названия, артикулы и ссылки для {chosen.length} выбранных позиций.
              </p>
            </div>
            <div>
              <Link className="button button--light" to={consultationPath}>
                Проверить и продолжить <ArrowRight aria-hidden="true" />
              </Link>
              <a className="button button--outline-light" href={emailHref}>
                <EnvelopeSimple aria-hidden="true" /> Подготовить email
              </a>
              <button className="button button--outline-light" type="button" onClick={handleCopy}>
                <CopySimple aria-hidden="true" /> Скопировать список
              </button>
              {copyStatus && (
                <p className="selection-contact__status" role="status" aria-live="polite">
                  {copyStatus}
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <BookmarkSimple aria-hidden="true" />
          <h2>В подборке пока нет продуктов</h2>
          <p>Добавляйте продукты из каталога — они останутся здесь.</p>
          <Link className="button button--primary" to="/products">Открыть каталог</Link>
        </div>
      )}
    </section>
  );
}
