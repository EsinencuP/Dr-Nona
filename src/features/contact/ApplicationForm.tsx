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
import type { ApplicationInput } from "../../../shared/applications/application-schema";
import { marketData } from "../../market";
import { useLocale } from "../../locales/LocaleProvider";
import { Link } from "../../router";
import { submitApplication } from "./application-client";
import type { ApplicationApiResult } from "./application-client";
import { validateClientApplication } from "./client-application-validation";

type FormMode = "order" | "consultation";
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
    "Некорректный номер телефона": "Număr de telefon incorect",
    "Необходимо принять условия обработки данных":
      "Este necesar acordul pentru prelucrarea datelor",
    "Выберите хотя бы один товар": "Selectați cel puțin un produs",
    "Можно выбрать не более 20 товаров":
      "Puteți selecta cel mult 20 de produse",
    "Один или несколько товаров недоступны":
      "Unul sau mai multe produse nu sunt disponibile",
    "Выберите формат консультации": "Selectați formatul consultației",
    "Некорректная дата": "Dată incorectă",
    "Некорректное время": "Oră incorectă",
    "Выберите будущую дату и время по часовому поясу Кишинёва":
      "Selectați o dată și o oră viitoare în fusul orar al Chișinăului",
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
}: ApplicationFormProps) {
  const { locale, t } = useLocale();
  const copy = locale === "ro"
    ? {
        eyebrow: "Contactați un consultant",
        title: "Trimiteți o solicitare",
        intro:
          "Alegeți tipul solicitării. Trimiterea formularului nu reprezintă plata comenzii sau confirmarea orei consultației.",
        requestType: "Tipul solicitării",
        order: "Comandă",
        consultation: "Consultație",
        firstName: "Prenume",
        lastName: "Nume",
        phone: "Telefon",
        city: "Oraș",
        selectedProducts: "Produse selectate",
        positions: "produse",
        missingSku: "nu este indicat",
        emptyOrder: "Pentru o comandă, adăugați mai întâi produse în selecție.",
        consultationFormat: "Formatul consultației",
        online: "Online",
        offline: "La sediu",
        preferredDate: "Data preferată",
        preferredTime: "Ora preferată",
        advisory:
          "Data și ora indicate sunt orientative. Consultantul vă va contacta pentru confirmare.",
        sending: "Se trimite solicitarea…",
        accepted: "Solicitare acceptată",
        submit: "Trimite solicitarea",
        success: (id: string) =>
          `Solicitarea nr. ${id} a fost trimisă. Consultantul vă va contacta la numărul indicat.`,
        failure:
          "Solicitarea nu a fost trimisă. Datele au rămas în formular — încercați din nou sau sunați la filială.",
        validation: "Verificați câmpurile marcate.",
        status: "Statutul solicitării",
        errorTitle: "Trimiterea nu a putut fi finalizată",
        call: "Sunați",
      }
    : {
        eyebrow: "Связаться с менеджером",
        title: "Оставить заявку",
        intro:
          "Выберите нужный сценарий. Заявка не является оплатой заказа или подтверждением времени консультации.",
        requestType: "Тип заявки",
        order: "Заказ",
        consultation: "Консультация",
        firstName: "Имя",
        lastName: "Фамилия",
        phone: "Телефон",
        city: "Город",
        selectedProducts: "Выбранные товары",
        positions: "поз.",
        missingSku: "не указан",
        emptyOrder: "Для заявки на заказ сначала добавьте товары в подборку.",
        consultationFormat: "Формат консультации",
        online: "Онлайн",
        offline: "Офлайн",
        preferredDate: "Предпочтительная дата",
        preferredTime: "Предпочтительное время",
        advisory:
          "Выбранные дата и время являются предпочтительными. Менеджер свяжется с вами для подтверждения.",
        sending: "Отправляем заявку…",
        accepted: "Заявка принята",
        submit: "Отправить заявку",
        success: (id: string) =>
          `Заявка №${id} отправлена. Менеджер свяжется с вами по указанному номеру.`,
        failure:
          "Заявка не отправлена. Данные сохранены в форме — повторите попытку или используйте телефон филиала.",
        validation: "Проверьте отмеченные поля.",
        status: "Статус заявки",
        errorTitle: "Не удалось завершить отправку",
        call: "Позвоните",
      };
  const [mode, setMode] = useState<FormMode>(
    products.length ? "order" : "consultation"
  );
  const [status, setStatus] = useState<FormStatus>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ApplicationApiResult | null>(null);
  const attemptKey = useRef(createAttemptKey());
  const formRef = useRef<HTMLFormElement>(null);
  const statusHeading = useRef<HTMLHeadingElement>(null);
  const allowedSlugs = useMemo(
    () => new Set(products.map((product) => product.slug)),
    [products]
  );
  const accepted = status === "success";

  useEffect(() => {
    if (accepted) statusHeading.current?.focus();
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

  const setFormMode = (nextMode: FormMode) => {
    if (status === "submitting") return;
    setMode(nextMode);
    setStatus("idle");
    setResult(null);
    setFieldErrors({});
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting" || accepted) return;
    const form = new FormData(event.currentTarget);
    const common = {
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      city: String(form.get("city") ?? ""),
      consentAccepted: form.get("consentAccepted") === "on",
      website: String(form.get("website") ?? ""),
    };
    const raw =
      mode === "order"
        ? {
            ...common,
            type: "order",
            productSlugs: products.map((product) => product.slug),
          }
        : {
            ...common,
            type: "consultation",
            consultationMode: String(
              form.get("consultationMode") ?? "online"
            ),
            consultationDate: String(form.get("consultationDate") ?? ""),
            consultationTime: String(form.get("consultationTime") ?? ""),
          };
    const validation = validateClientApplication(raw, allowedSlugs, locale);
    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      setStatus("validation-error");
      return;
    }
    setFieldErrors({});
    setStatus("submitting");
    const response = await submit(
      validation.data as ApplicationInput,
      attemptKey.current
    );
    setResult(response);
    setStatus(response.kind);
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
      ? copy.success(result.requestId)
      : status === "network-error" || status === "server-error"
          ? copy.failure
          : status === "validation-error"
            ? copy.validation
            : "";

  return (
    <section className="application-panel" aria-labelledby="application-title">
      <div className="application-panel__heading">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="application-title">{copy.title}</h2>
        <p>{copy.intro}</p>
      </div>

      <div className="application-mode" role="group" aria-label={copy.requestType}>
        <button
          type="button"
          className={mode === "order" ? "is-active" : ""}
          aria-pressed={mode === "order"}
          onClick={() => setFormMode("order")}
        >
          {copy.order}
        </button>
        <button
          type="button"
          className={mode === "consultation" ? "is-active" : ""}
          aria-pressed={mode === "consultation"}
          onClick={() => setFormMode("consultation")}
        >
          {copy.consultation}
        </button>
      </div>

      <form
        ref={formRef}
        className="application-form"
        aria-labelledby="application-title"
        onSubmit={onSubmit}
        noValidate
      >
        <div className="application-form__grid">
          {[
            ["firstName", copy.firstName, "text", "given-name"],
            ["lastName", copy.lastName, "text", "family-name"],
            ["phone", copy.phone, "tel", "tel"],
            ["city", copy.city, "text", "address-level2"],
          ].map(([name, label, type, autoComplete]) => (
            <label className="application-field" key={name}>
              <span>{label}</span>
              <input
                name={name}
                type={type}
                autoComplete={autoComplete}
                disabled={accepted}
                aria-invalid={Boolean(fieldErrors[name])}
                aria-describedby={describedBy(name, fieldErrors)}
              />
              {fieldErrors[name] && (
                <small id={`${name}-error`}>{fieldErrors[name]}</small>
              )}
            </label>
          ))}
        </div>

        {mode === "order" ? (
          <div
            className="application-products"
            aria-labelledby="application-products-title"
          >
            <div>
              <h3 id="application-products-title">{copy.selectedProducts}</h3>
              <span>{products.length} {copy.positions}</span>
            </div>
            {products.length ? (
              <ul>
                {products.map((product) => (
                  <li key={product.slug}>
                    <span>{product.officialName}</span>
                    <small>SKU {product.sku || copy.missingSku}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{copy.emptyOrder}</p>
            )}
            {fieldErrors.productSlugs && (
              <small id="productSlugs-error">{fieldErrors.productSlugs}</small>
            )}
          </div>
        ) : (
          <>
            <fieldset className="application-choice">
              <legend>{copy.consultationFormat}</legend>
              <label>
                <input
                  type="radio"
                  name="consultationMode"
                  value="online"
                  defaultChecked
                  disabled={accepted}
                />
                {copy.online}
              </label>
              <label>
                <input
                  type="radio"
                  name="consultationMode"
                  value="offline"
                  disabled={accepted}
                />
                {copy.offline}
              </label>
            </fieldset>
            <div className="application-form__grid">
              <label className="application-field">
                <span>{copy.preferredDate}</span>
                <input
                  name="consultationDate"
                  type="date"
                  disabled={accepted}
                  aria-invalid={Boolean(fieldErrors.consultationDate)}
                  aria-describedby={describedBy(
                    "consultationDate",
                    fieldErrors
                  )}
                />
                {fieldErrors.consultationDate && (
                  <small id="consultationDate-error">
                    {fieldErrors.consultationDate}
                  </small>
                )}
              </label>
              <label className="application-field">
                <span>{copy.preferredTime}</span>
                <input
                  name="consultationTime"
                  type="time"
                  disabled={accepted}
                  aria-invalid={Boolean(fieldErrors.consultationTime)}
                  aria-describedby={describedBy(
                    "consultationTime",
                    fieldErrors
                  )}
                />
                {fieldErrors.consultationTime && (
                  <small id="consultationTime-error">
                    {fieldErrors.consultationTime}
                  </small>
                )}
              </label>
            </div>
            <p className="application-form__advisory">
              {copy.advisory}
            </p>
          </>
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
              disabled={accepted}
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
          <small id="consentAccepted-error" className="application-error">
            {fieldErrors.consentAccepted}
          </small>
        )}

        <button
          className="button button--primary application-submit"
          type="submit"
          disabled={
            status === "submitting" ||
            accepted ||
            (mode === "order" && !products.length)
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
    </section>
  );
}
