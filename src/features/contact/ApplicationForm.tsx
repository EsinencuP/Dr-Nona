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
import {
  MASTERCLASS_TOPICS,
  MASTERCLASS_TOPIC_LABELS_RO,
} from "../../../shared/constants/masterclass-topics";
import {
  MOLDOVA_REGIONS,
  MOLDOVA_REGION_LABELS_RO,
} from "../../../shared/constants/moldova-regions";
import { marketData } from "../../market";
import { useLocale } from "../../locales/LocaleProvider";
import { Link } from "../../router";
import { submitApplication } from "./application-client";
import type { ApplicationApiResult } from "./application-client";
import { validateClientApplication } from "./client-application-validation";
import { readSessionValue } from "./utm-capture";

type FormMode = "order" | "consultation" | "masterclass";
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
    "Выберите формат консультации": "Selectați formatul consultației",
    "Выберите тему мастер-класса из списка":
      "Selectați o temă de masterclass din listă",
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
          "Alegeți tipul solicitării. Formularul nu reprezintă plata comenzii; ora consultației sau a masterclassului va fi confirmată de manager.",
        requestType: "Tipul solicitării",
        order: "Comandă",
        consultation: "Consultație",
        masterclass: "Masterclass",
        firstName: "Prenume",
        lastName: "Nume",
        phone: "Telefon",
        region: "Regiunea de livrare (Moldova)",
        regionPlaceholder: "Selectați regiunea sau raionul",
        email: "Email (opțional)",
        comment: "Comentariu la solicitare (opțional)",
        preferredCallTime: "Interval potrivit pentru apel (opțional)",
        preferredCallTimePlaceholder: "De exemplu: după ora 18:00",
        selectedProducts: "Produse selectate",
        positions: "produse",
        quantity: "Cantitate",
        decreaseQuantity: (name: string) => `Reduceți cantitatea pentru ${name}`,
        increaseQuantity: (name: string) => `Măriți cantitatea pentru ${name}`,
        missingSku: "nu este indicat",
        emptyOrder: "Pentru o comandă, adăugați mai întâi produse în selecție.",
        consultationFormat: "Formatul consultației",
        online: "Online",
        offline: "La sediu",
        preferredDate: "Data preferată",
        preferredTime: "Ora preferată",
        advisory:
          "Data și ora indicate sunt orientative. Consultantul vă va contacta pentru confirmare.",
        masterclassTopic: "Tema masterclassului",
        masterclassTopicPlaceholder: "Selectați tema masterclassului",
        masterclassDate: "Data dorită",
        masterclassTime: "Ora dorită",
        masterclassAdvisory:
          "Data și ora vor fi coordonate cu organizatorul. Managerul vă va contacta pentru confirmarea rezervării.",
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
          "Выберите нужный сценарий. Заявка не является оплатой заказа; время консультации или мастер-класса подтвердит менеджер.",
        requestType: "Тип заявки",
        order: "Заказ",
        consultation: "Консультация",
        masterclass: "Мастер-класс",
        firstName: "Имя",
        lastName: "Фамилия",
        phone: "Телефон",
        region: "Регион доставки (Молдова)",
        regionPlaceholder: "Выберите регион или район",
        email: "Email (необязательно)",
        comment: "Комментарий к заявке (необязательно)",
        preferredCallTime: "Удобное время для звонка (необязательно)",
        preferredCallTimePlaceholder: "Например: после 18:00",
        selectedProducts: "Выбранные товары",
        positions: "поз.",
        quantity: "Количество",
        decreaseQuantity: (name: string) => `Уменьшить количество ${name}`,
        increaseQuantity: (name: string) => `Увеличить количество ${name}`,
        missingSku: "не указан",
        emptyOrder: "Для заявки на заказ сначала добавьте товары в подборку.",
        consultationFormat: "Формат консультации",
        online: "Онлайн",
        offline: "Офлайн",
        preferredDate: "Предпочтительная дата",
        preferredTime: "Предпочтительное время",
        advisory:
          "Выбранные дата и время являются предпочтительными. Менеджер свяжется с вами для подтверждения.",
        masterclassTopic: "Тема мастер-класса",
        masterclassTopicPlaceholder: "Выберите тему мастер-класса",
        masterclassDate: "Желаемая дата",
        masterclassTime: "Желаемое время",
        masterclassAdvisory:
          "Дата и время согласовываются с организатором. Менеджер свяжется с вами для подтверждения бронирования.",
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
  const [quantities, setQuantities] = useState<Record<string, number>>({});
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

  const updateQuantity = (slug: string, delta: number) => {
    setQuantities((currentQuantities) => {
      const current = currentQuantities[slug] ?? 1;
      const next = Math.max(1, Math.min(99, current + delta));
      return { ...currentQuantities, [slug]: next };
    });
  };

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
      locale: locale === "ro" ? "ro-MD" : "ru-MD",
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      city: String(form.get("city") ?? ""),
      consentAccepted: form.get("consentAccepted") === "on",
      website: String(form.get("website") ?? ""),
    };
    const analyticsFields = {
      email: String(form.get("email") ?? "").trim() || undefined,
      comment: String(form.get("comment") ?? "").trim() || undefined,
      preferredCallTime:
        String(form.get("preferredCallTime") ?? "").trim() || undefined,
      utmSource: readSessionValue("utm_source"),
      utmMedium: readSessionValue("utm_medium"),
      utmCampaign: readSessionValue("utm_campaign"),
      utmContent: readSessionValue("utm_content"),
      entryPoint: window.location.pathname + window.location.search,
      sessionHistory: readSessionValue("session_product_history"),
    };
    const items = products.map((product) => ({
      slug: product.slug,
      quantity: quantities[product.slug] ?? 1,
    }));
    const raw =
      mode === "order"
        ? {
            ...common,
            ...analyticsFields,
            type: "order",
            productSlugs: products.map((product) => product.slug),
            items,
          }
        : mode === "consultation"
          ? {
              ...common,
              ...analyticsFields,
              type: "consultation",
              consultationMode: String(
                form.get("consultationMode") ?? "online"
              ),
              consultationDate: String(form.get("consultationDate") ?? ""),
              consultationTime: String(form.get("consultationTime") ?? ""),
            }
          : {
              ...common,
              ...analyticsFields,
              type: "masterclass",
              masterclassTopic: String(form.get("masterclassTopic") ?? ""),
              eventDate: String(form.get("eventDate") ?? ""),
              eventTime: String(form.get("eventTime") ?? ""),
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
      validation.data,
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
        <button
          type="button"
          className={mode === "masterclass" ? "is-active" : ""}
          aria-pressed={mode === "masterclass"}
          onClick={() => setFormMode("masterclass")}
        >
          {copy.masterclass}
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
          <label className="application-field">
            <span>{copy.region}</span>
            <select
              name="city"
              defaultValue=""
              autoComplete="address-level1"
              disabled={accepted}
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
              type="email"
              autoComplete="email"
              disabled={accepted}
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
              type="text"
              placeholder={copy.preferredCallTimePlaceholder}
              maxLength={100}
              disabled={accepted}
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
              rows={3}
              maxLength={500}
              disabled={accepted}
              aria-invalid={Boolean(fieldErrors.comment)}
              aria-describedby={describedBy("comment", fieldErrors)}
            />
            {fieldErrors.comment && (
              <small id="comment-error">{fieldErrors.comment}</small>
            )}
          </label>
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
                {products.map((product) => {
                  const quantity = quantities[product.slug] ?? 1;
                  return (
                    <li key={product.slug}>
                      <div className="application-product__identity">
                        <span>{product.officialName}</span>
                        <small>SKU {product.sku || copy.missingSku}</small>
                      </div>
                      <div
                        className="application-quantity"
                        role="group"
                        aria-label={`${copy.quantity}: ${product.officialName}`}
                      >
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.slug, -1)}
                          disabled={accepted || quantity <= 1}
                          aria-label={copy.decreaseQuantity(product.officialName)}
                        >
                          −
                        </button>
                        <output aria-live="polite">{quantity}</output>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.slug, 1)}
                          disabled={accepted || quantity >= 99}
                          aria-label={copy.increaseQuantity(product.officialName)}
                        >
                          +
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>{copy.emptyOrder}</p>
            )}
            {fieldErrors.productSlugs && (
              <small id="productSlugs-error">{fieldErrors.productSlugs}</small>
            )}
            {fieldErrors.items && (
              <small id="items-error">{fieldErrors.items}</small>
            )}
          </div>
        ) : mode === "consultation" ? (
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
        ) : (
          <>
            <div className="application-form__grid">
              <label className="application-field application-field--wide">
                <span>{copy.masterclassTopic}</span>
                <select
                  name="masterclassTopic"
                  defaultValue=""
                  disabled={accepted}
                  aria-invalid={Boolean(fieldErrors.masterclassTopic)}
                  aria-describedby={describedBy(
                    "masterclassTopic",
                    fieldErrors
                  )}
                >
                  <option value="" disabled>
                    {copy.masterclassTopicPlaceholder}
                  </option>
                  {MASTERCLASS_TOPICS.map((topic) => (
                    <option key={topic} value={topic}>
                      {locale === "ro"
                        ? MASTERCLASS_TOPIC_LABELS_RO[topic]
                        : topic}
                    </option>
                  ))}
                </select>
                {fieldErrors.masterclassTopic && (
                  <small id="masterclassTopic-error">
                    {fieldErrors.masterclassTopic}
                  </small>
                )}
              </label>
              <label className="application-field">
                <span>{copy.masterclassDate}</span>
                <input
                  name="eventDate"
                  type="date"
                  disabled={accepted}
                  aria-invalid={Boolean(fieldErrors.eventDate)}
                  aria-describedby={describedBy("eventDate", fieldErrors)}
                />
                {fieldErrors.eventDate && (
                  <small id="eventDate-error">{fieldErrors.eventDate}</small>
                )}
              </label>
              <label className="application-field">
                <span>{copy.masterclassTime}</span>
                <input
                  name="eventTime"
                  type="time"
                  disabled={accepted}
                  aria-invalid={Boolean(fieldErrors.eventTime)}
                  aria-describedby={describedBy("eventTime", fieldErrors)}
                />
                {fieldErrors.eventTime && (
                  <small id="eventTime-error">{fieldErrors.eventTime}</small>
                )}
              </label>
            </div>
            <p className="application-form__advisory">
              {copy.masterclassAdvisory}
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
