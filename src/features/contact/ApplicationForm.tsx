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

export function ApplicationForm({
  products,
  submit = submitApplication,
}: ApplicationFormProps) {
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
    const validation = validateClientApplication(raw, allowedSlugs);
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
        setFieldErrors(response.fieldErrors);
      }
    }
  };

  const statusContent =
    result?.kind === "success"
      ? `Заявка №${result.requestId} отправлена. Менеджер свяжется с вами по указанному номеру.`
      : status === "network-error" || status === "server-error"
          ? "Заявка не отправлена. Данные сохранены в форме — повторите попытку или используйте телефон филиала."
          : status === "validation-error"
            ? "Проверьте отмеченные поля."
            : "";

  return (
    <section className="application-panel" aria-labelledby="application-title">
      <div className="application-panel__heading">
        <p className="eyebrow">Связаться с менеджером</p>
        <h2 id="application-title">Оставить заявку</h2>
        <p>
          Выберите нужный сценарий. Заявка не является оплатой заказа или
          подтверждением времени консультации.
        </p>
      </div>

      <div className="application-mode" role="group" aria-label="Тип заявки">
        <button
          type="button"
          className={mode === "order" ? "is-active" : ""}
          aria-pressed={mode === "order"}
          onClick={() => setFormMode("order")}
        >
          Заказ
        </button>
        <button
          type="button"
          className={mode === "consultation" ? "is-active" : ""}
          aria-pressed={mode === "consultation"}
          onClick={() => setFormMode("consultation")}
        >
          Консультация
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
            ["firstName", "Имя", "text", "given-name"],
            ["lastName", "Фамилия", "text", "family-name"],
            ["phone", "Телефон", "tel", "tel"],
            ["city", "Город", "text", "address-level2"],
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
              <h3 id="application-products-title">Выбранные товары</h3>
              <span>{products.length} поз.</span>
            </div>
            {products.length ? (
              <ul>
                {products.map((product) => (
                  <li key={product.slug}>
                    <span>{product.officialName}</span>
                    <small>SKU {product.sku || "не указан"}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Для заявки на заказ сначала добавьте товары в подборку.</p>
            )}
            {fieldErrors.productSlugs && (
              <small id="productSlugs-error">{fieldErrors.productSlugs}</small>
            )}
          </div>
        ) : (
          <>
            <fieldset className="application-choice">
              <legend>Формат консультации</legend>
              <label>
                <input
                  type="radio"
                  name="consultationMode"
                  value="online"
                  defaultChecked
                  disabled={accepted}
                />
                Онлайн
              </label>
              <label>
                <input
                  type="radio"
                  name="consultationMode"
                  value="offline"
                  disabled={accepted}
                />
                Офлайн
              </label>
            </fieldset>
            <div className="application-form__grid">
              <label className="application-field">
                <span>Предпочтительная дата</span>
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
                <span>Предпочтительное время</span>
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
              Выбранные дата и время являются предпочтительными. Менеджер
              свяжется с вами для подтверждения.
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

        <label className="application-consent">
          <input
            name="consentAccepted"
            type="checkbox"
            disabled={accepted}
            aria-invalid={Boolean(fieldErrors.consentAccepted)}
            aria-describedby={describedBy("consentAccepted", fieldErrors)}
          />
          <span>
            Я согласен на обработку указанных персональных данных для связи по
            этой заявке.
          </span>
        </label>
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
            "Отправляем заявку…"
          ) : accepted ? (
            <>
              <CheckCircle aria-hidden="true" /> Заявка принята
            </>
          ) : (
            <>
              <PaperPlaneTilt aria-hidden="true" /> Отправить заявку
            </>
          )}
        </button>

        {statusContent && (
          <div
            className={`application-status application-status--${status}`}
            role={accepted ? "status" : "alert"}
          >
            <h3 ref={statusHeading} tabIndex={-1}>
              {accepted ? "Статус заявки" : "Не удалось завершить отправку"}
            </h3>
            <p>{statusContent}</p>
            {!accepted && (
              <p>
                Позвоните:{" "}
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
