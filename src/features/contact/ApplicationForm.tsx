import { X } from "@phosphor-icons/react/X";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { PaperPlaneTilt } from "@phosphor-icons/react/PaperPlaneTilt";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormEvent } from "react";
import type { Product } from "../../data";
import publishedProductSlugs from "../../data/published-product-slugs.json";
import {
  MOLDOVA_REGIONS,
  MOLDOVA_REGION_LABELS_RO,
} from "../../../shared/constants/moldova-regions";
import { marketData } from "../../market";
import { productPublicUrl } from "./consultation";
import { getProductTitle } from "../product/productNames";
import { useLocale } from "../../locales/LocaleProvider";
import { Link } from "../../router";
import { submitApplication } from "./application-client";
import type { ApplicationApiResult } from "./application-client";
import { validateClientApplication } from "./client-application-validation";
import { buildApplicationAttribution, readApprovedProductHistory, readSessionValue } from "./utm-capture";

type FormStatus =
  | "idle"
  | "submitting"
  | "success"
  | "validation-error"
  | "network-error"
  | "server-error";

type ApplicationFormProps = {
  products: Product[];
  submit?: typeof submitApplication;
  onAccepted?: () => void;
};

const createAttemptKey = () =>
  globalThis.crypto?.randomUUID?.() ??
  `attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function describedBy(name: string, errors: Record<string, string>) {
  return errors[name] ? `${name}-error` : undefined;
}

function localizeServerErrors(
  errors: Record<string, string>,
  locale: "ru" | "ro"
) {
  if (locale === "ru") return errors;
  const translations: Record<string, string> = {
    "Имя: обязательное поле": "Prenume: câmp obligatoriu",
    "Фамилия: обязательное поле": "Nume: câmp obligatoriu",
    "Город: обязательное поле": "Oraș: câmp obligatoriu",
    "Выберите регион": "Selectați regiunea",
    "Выберите регион из списка": "Selectați o regiune din listă",
    "Некорректные данные о количестве товаров":
      "Datele despre cantitatea produselor sunt incorecte",
    "Количество должно быть целым числом":
      "Cantitatea trebuie să fie un număr întreg",
    "Минимум 1 шт.": "Cantitatea minimă este 1",
    "Максимум 99 шт.": "Cantitatea maximă este 99",
    "Некорректный номер телефона": "Număr de telefon incorect",
    "Некорректный адрес электронной почты":
      "Adresa de email nu este corectă",
    "Комментарий: не более 500 символов":
      "Comentariul poate avea cel mult 500 de caractere",
    "Время звонка: слишком длинное значение":
      "Intervalul pentru apel este prea lung",
    "Необходимо принять условия обработки данных":
      "Este necesar acordul pentru prelucrarea datelor",
    "Выберите хотя бы один товар": "Selectați cel puțin un produs",
    "Можно выбрать не более 20 товаров":
      "Puteți selecta cel mult 20 de produse",
    "Один или несколько товаров недоступны":
      "Unul sau mai multe produse nu sunt disponibile",
  };
  return Object.fromEntries(
    Object.entries(errors).map(([field, message]) => [
      field,
      translations[message] ?? "Verificați valoarea introdusă",
    ])
  );
}

export function ApplicationForm({
  products,
  submit = submitApplication,
  onAccepted,
}: ApplicationFormProps) {
  const { locale, t } = useLocale();
  const copy = locale === "ro"
    ? {
        title: "Plasarea comenzii",
        thanksMessage: "Consultantul nostru vă va contacta în scurt timp pentru confirmarea comenzii și stabilirea detaliilor de livrare",
        success: "Comanda a fost trimisă. Managerul vă va contacta pentru confirmare și stabilirea detaliilor de livrare",
        intro:
          "Completați datele de contact. Managerul vă va contacta pentru confirmarea comenzii și stabilirea detaliilor de livrare. Plasarea comenzii nu reprezintă o plată.",
        firstName: "Prenume",
        lastName: "Nume",
        phone: "Telefon",
        region: "Regiunea de livrare (Moldova)",
        regionPlaceholder: "Selectați regiunea sau raionul",
        email: "Email (opțional)",
        comment: "Comentariu la comandă (opțional)",
        preferredCallTime: "Interval potrivit pentru apel (opțional)",
        preferredCallTimePlaceholder: "De exemplu: după ora 18:00",
        selectedProducts: "Produse selectate",
        positions: "produse",
        quantity: "Cantitate",
        decreaseQuantity: (name: string) => `Reduceți cantitatea pentru ${name}`,
        increaseQuantity: (name: string) => `Măriți cantitatea pentru ${name}`,
        missingSku: "nu este indicat",
        emptyOrder: "Pentru o comandă, adăugați mai întâi produse în selecție.",
        sending: "Se trimite comanda…",
        accepted: "Comanda a fost trimisă",
        submit: "Plasează comanda",
        failure:
          "Comanda nu a putut fi trimisă. Încercați din nou",
        validation: "Verificați câmpurile marcate.",
        status: "Starea comenzii",
        thanks: "Vă mulțumim pentru comandă!",
        requestNumber: "Numărul comenzii",
        closeThanks: "Am înțeles",
        closeDialog: "Închide",
        errorTitle: "Trimiterea nu a putut fi finalizată",
        call: "Sunați",
      }
    : {
        title: "Оформление заказа",
        thanksMessage: "Наш консультант в скором времени свяжется с вами для подтверждения заказа и согласования доставки",
        success: "Заказ отправлен. Менеджер свяжется с вами для подтверждения и согласования доставки",
        intro:
          "Заполните контактные данные. Менеджер свяжется с вами для подтверждения заказа и согласования доставки. Оформление заказа не является оплатой",
        firstName: "Имя",
        lastName: "Фамилия",
        phone: "Телефон",
        region: "Регион доставки (Молдова)",
        regionPlaceholder: "Выберите регион или район",
        email: "Email (необязательно)",
        comment: "Комментарий к заказу (необязательно)",
        preferredCallTime: "Удобное время для звонка (необязательно)",
        preferredCallTimePlaceholder: "Например: после 18:00",
        selectedProducts: "Выбранные товары",
        positions: "поз.",
        quantity: "Количество",
        decreaseQuantity: (name: string) => `Уменьшить количество ${name}`,
        increaseQuantity: (name: string) => `Увеличить количество ${name}`,
        missingSku: "не указан",
        emptyOrder: "Сначала выберите товары в каталоге.",
        sending: "Отправляем заказ…",
        accepted: "Заказ отправлен",
        submit: "Оформить заказ",
        failure:
          "Не удалось отправить заказ. Попробуйте ещё раз",
        validation: "Проверьте отмеченные поля.",
        status: "Статус заказа",
        thanks: "Благодарим за заказ!",
        requestNumber: "Номер заказа",
        closeThanks: "Понятно",
        closeDialog: "Закрыть",
        errorTitle: "Не удалось завершить отправку",
        call: "Позвоните",
      };
  const [status, setStatus] = useState<FormStatus>("idle");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ApplicationApiResult | null>(null);
  const attemptKey = useRef(createAttemptKey());
  const sending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const statusHeading = useRef<HTMLHeadingElement>(null);
  const thanksDialog = useRef<HTMLDialogElement>(null);
  const acknowledgeButton = useRef<HTMLButtonElement>(null);
  const publishedSlugs = useMemo(() => new Set(publishedProductSlugs), []);
  const accepted = status === "success";

  const updateQuantity = (slug: string, delta: number) => {
    setQuantities((currentQuantities) => {
      const current = currentQuantities[slug] ?? 1;
      const next = Math.max(1, Math.min(99, current + delta));
      return { ...currentQuantities, [slug]: next };
    });
  };

  useEffect(() => {
    const dialog = thanksDialog.current;
    if (accepted && dialog && !dialog.open) {
      dialog.showModal();
      acknowledgeButton.current?.focus();
    }
    if (!accepted && dialog?.open) dialog.close();
  }, [accepted]);

  useEffect(() => {
    if (status !== "validation-error" || !Object.keys(fieldErrors).length) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [fieldErrors, status]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current || status === "submitting" || accepted) return;
    const form = new FormData(event.currentTarget);
    const applicationLocale: "ru-MD" | "ro-MD" = locale === "ro" ? "ro-MD" : "ru-MD";
    const common = {
      locale: applicationLocale,
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      city: String(form.get("city") ?? ""),
      consentAccepted: form.get("consentAccepted") === "on",
      website: String(form.get("website") ?? ""),
    };
    const attribution = buildApplicationAttribution({
      locale: common.locale,
      path: window.location.pathname,
      allowedProductSlugs: publishedSlugs,
      consentAccepted: common.consentAccepted,
    });
    const approvedHistory = attribution?.sessionHistory ?? readApprovedProductHistory(publishedSlugs);
    const analyticsFields = {
      email: String(form.get("email") ?? "").trim() || undefined,
      comment: String(form.get("comment") ?? "").trim() || undefined,
      preferredCallTime:
        String(form.get("preferredCallTime") ?? "").trim() || undefined,
      utmSource: readSessionValue("utm_source"),
      utmMedium: readSessionValue("utm_medium"),
      utmCampaign: readSessionValue("utm_campaign"),
      utmContent: readSessionValue("utm_content"),
      entryPoint: attribution?.entry.path ?? window.location.pathname,
      sessionHistory: approvedHistory.length ? JSON.stringify(approvedHistory) : undefined,
      attribution,
    };
    const items = products.map((product) => ({
      slug: product.slug,
      quantity: quantities[product.slug] ?? 1,
      officialName: getProductTitle(product),
      sku: product.sku,
      url: productPublicUrl(product, locale),
    }));
    const raw = { ...common, ...analyticsFields, type: "order", productSlugs: products.map(product => product.slug), items };
    const validation = validateClientApplication(raw, publishedSlugs, locale);
    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      setStatus("validation-error");
      return;
    }
    setFieldErrors({});
    setStatus("submitting");
    sending.current = true;
    let response: ApplicationApiResult;
    try { response = await submit(validation.data, attemptKey.current); }
    catch { response = { kind: "network-error" }; }
    finally { sending.current = false; }
    sending.current = response.kind === "success";
    setResult(response);
    setStatus(response.kind);
    if (response.kind === "success") {
      formRef.current?.reset();
      setQuantities({});
      onAccepted?.();
    }
    if (
      response.kind === "network-error" ||
      response.kind === "server-error" ||
      response.kind === "validation-error"
    ) {
      if (response.kind === "validation-error") {
        setFieldErrors(localizeServerErrors(response.fieldErrors, locale));
      }
    }
  };

  const statusContent =
    result?.kind === "success"
      ? copy.success
      : status === "network-error" || status === "server-error"
          ? copy.failure
          : status === "validation-error"
            ? copy.validation
            : "";

  return (
    <section className="application-panel" aria-labelledby="application-title">
      <div className="application-panel__heading">
        <h2 id="application-title">{copy.title}</h2>
        <p>{copy.intro}</p>
      </div>

      <form
        ref={formRef}
        className="application-form"
        aria-labelledby="application-title"
        onSubmit={onSubmit}
        noValidate
        aria-busy={status === "submitting"}
      >
        <div className="application-form__grid">
          {[
            ["firstName", copy.firstName, "text", "given-name"],
            ["lastName", copy.lastName, "text", "family-name"],
            ["phone", copy.phone, "tel", "tel"],
          ].map(([name, label, type, autoComplete]) => (
            <label className="application-field" key={name}>
              <span>{label}</span>
              <input
                name={name}
                aria-label={label}
                type={type}
                autoComplete={autoComplete}
                required
                disabled={accepted || status === "submitting"}
                aria-invalid={Boolean(fieldErrors[name])}
                aria-describedby={describedBy(name, fieldErrors)}
              />
              {fieldErrors[name] && (
                <small id={`${name}-error`}>{fieldErrors[name]}</small>
              )}
            </label>
          ))}
          <label className="application-field">
            <span>{copy.region}</span>
            <select
              name="city"
              required
              aria-label={copy.region}
              defaultValue=""
              autoComplete="address-level1"
              disabled={accepted || status === "submitting"}
              aria-invalid={Boolean(fieldErrors.city)}
              aria-describedby={describedBy("city", fieldErrors)}
            >
              <option value="" disabled>
                {copy.regionPlaceholder}
              </option>
              {MOLDOVA_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {locale === "ro" ? MOLDOVA_REGION_LABELS_RO[region] : region}
                </option>
              ))}
            </select>
            {fieldErrors.city && (
              <small id="city-error">{fieldErrors.city}</small>
            )}
          </label>
        </div>

        <div className="application-form__optional">
          <label className="application-field">
            <span>{copy.email}</span>
            <input
              name="email"
              aria-label={copy.email}
              type="email"
              autoComplete="email"
              disabled={accepted || status === "submitting"}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={describedBy("email", fieldErrors)}
            />
            {fieldErrors.email && (
              <small id="email-error">{fieldErrors.email}</small>
            )}
          </label>
          <label className="application-field">
            <span>{copy.preferredCallTime}</span>
            <input
              name="preferredCallTime"
              aria-label={copy.preferredCallTime}
              type="text"
              placeholder={copy.preferredCallTimePlaceholder}
              maxLength={100}
              disabled={accepted || status === "submitting"}
              aria-invalid={Boolean(fieldErrors.preferredCallTime)}
              aria-describedby={describedBy(
                "preferredCallTime",
                fieldErrors
              )}
            />
            {fieldErrors.preferredCallTime && (
              <small id="preferredCallTime-error">
                {fieldErrors.preferredCallTime}
              </small>
            )}
          </label>
          <label className="application-field application-field--wide">
            <span>{copy.comment}</span>
            <textarea
              name="comment"
              aria-label={copy.comment}
              rows={3}
              maxLength={500}
              disabled={accepted || status === "submitting"}
              aria-invalid={Boolean(fieldErrors.comment)}
              aria-describedby={describedBy("comment", fieldErrors)}
            />
            {fieldErrors.comment && (
              <small id="comment-error">{fieldErrors.comment}</small>
            )}
          </label>
        </div>

        {(
          <div
            className="application-products"
            aria-labelledby="application-products-title"
          >
            <div>
              <h3 id="application-products-title">{copy.selectedProducts}</h3>
              <span>{accepted ? 0 : products.length} {copy.positions}</span>
            </div>
            {!accepted && products.length ? (
              <ul>
                {products.map((product) => {
                  const quantity = quantities[product.slug] ?? 1;
                  return (
                    <li key={product.slug}>
                      <div className="application-product__identity">
                        <span lang="en">{getProductTitle(product)}</span>
                        <small>SKU {product.sku || copy.missingSku}</small>
                      </div>
                      <div
                        className="application-quantity"
                        role="group"
                        aria-label={`${copy.quantity}: ${getProductTitle(product)}`}
                      >
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.slug, -1)}
                          disabled={accepted || status === "submitting" || quantity <= 1}
                          aria-label={copy.decreaseQuantity(getProductTitle(product))}
                        >
                          −
                        </button>
                        <output aria-live="polite">{quantity}</output>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.slug, 1)}
                          disabled={accepted || status === "submitting" || quantity >= 99}
                          aria-label={copy.increaseQuantity(getProductTitle(product))}
                        >
                          +
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>{copy.emptyOrder} <Link to="/products">{locale === "ro" ? "Deschide catalogul" : "Открыть каталог"}</Link></p>
            )}
            {fieldErrors.productSlugs && (
              <small id="productSlugs-error">{fieldErrors.productSlugs}</small>
            )}
            {fieldErrors.items && (
              <small id="items-error">{fieldErrors.items}</small>
            )}
          </div>
        )}

        <label className="application-honeypot" aria-hidden="true">
          Website
          <input
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>

        <div className="application-consent-row">
          <label className="application-consent">
            <input
              name="consentAccepted"
              type="checkbox"
              required
              disabled={accepted || status === "submitting"}
              aria-invalid={Boolean(fieldErrors.consentAccepted)}
              aria-describedby={describedBy("consentAccepted", fieldErrors)}
            />
            <span>{t.consentText}</span>
          </label>
          <Link className="application-consent__privacy" to="/privacypolicy">
            {t.privacyPolicy}
          </Link>
        </div>
        {fieldErrors.consentAccepted && (
          <small id="consentAccepted-error" className="application-form__error">
            {fieldErrors.consentAccepted}
          </small>
        )}

        <button
          className="button button--primary application-submit"
          type="submit"
          disabled={
            status === "submitting" ||
            accepted ||
            !products.length
          }
        >
          {status === "submitting" ? (
            copy.sending
          ) : accepted ? (
            <>
              <CheckCircle aria-hidden="true" /> {copy.accepted}
            </>
          ) : (
            <>
              <PaperPlaneTilt aria-hidden="true" /> {copy.submit}
            </>
          )}
        </button>

        {statusContent && (
          <div
            className={`application-status application-status--${status}`}
            role={accepted ? "status" : "alert"}
          >
            <h3 ref={statusHeading} tabIndex={-1}>
              {accepted ? copy.status : copy.errorTitle}
            </h3>
            <p>{statusContent}</p>
            {!accepted && (
              <p>
                {copy.call}:{" "}
                {marketData.contact.phones.map((phone, index) => (
                  <span key={phone.href}>
                    {index ? " · " : ""}
                    <a href={phone.href}>{phone.label}</a>
                  </span>
                ))}
              </p>
            )}
          </div>
        )}
      </form>
      <dialog
        ref={thanksDialog}
        className="application-thanks"
        aria-labelledby="application-thanks-title"
        aria-describedby="application-thanks-message application-thanks-number"
        onClose={() => statusHeading.current?.focus()}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const first = thanksDialog.current?.querySelector<HTMLButtonElement>("button");
          const last = acknowledgeButton.current;
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <button type="button" className="application-thanks__close" aria-label={copy.closeDialog} onClick={() => thanksDialog.current?.close()}>
          <X aria-hidden="true" />
        </button>
        <CheckCircle className="application-thanks__icon" aria-hidden="true" />
        <h2 id="application-thanks-title">{copy.thanks}</h2>
        <p id="application-thanks-message">{copy.thanksMessage}</p>
        <p id="application-thanks-number" className="application-thanks__number">
          {copy.requestNumber}: <strong>{result?.kind === "success" ? result.requestId : ""}</strong>
        </p>
        <button
          type="button"
          className="button button--primary"
          ref={acknowledgeButton}
          onClick={() => thanksDialog.current?.close()}
        >
          {copy.closeThanks}
        </button>

      </dialog>
    </section>
  );
}
