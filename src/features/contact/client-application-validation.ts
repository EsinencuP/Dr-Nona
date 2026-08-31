import type { ApplicationInput } from "../../../shared/applications/application-schema";

export type ClientValidationResult =
  | { success: true; data: ApplicationInput }
  | { success: false; fieldErrors: Record<string, string> };

export function validateClientApplication(
  raw: Record<string, unknown>,
  allowedProductSlugs: ReadonlySet<string>,
  locale: "ru" | "ro" = "ru"
): ClientValidationResult {
  const fieldErrors: Record<string, string> = {};
  const copy = locale === "ro"
    ? {
        firstName: "Prenume",
        lastName: "Nume",
        city: "Oraș",
        required: "câmp obligatoriu",
        tooLong: "valoarea este prea lungă",
        phone: "Număr de telefon incorect",
        consent: "Este necesar acordul pentru prelucrarea datelor",
        form: "Date incorecte în formular",
        selectProduct: "Selectați cel puțin un produs",
        productLimit: "Puteți selecta cel mult 20 de produse",
        unavailableProduct: "Unul sau mai multe produse nu sunt disponibile",
        consultationMode: "Selectați formatul consultației",
        date: "Dată incorectă",
        time: "Oră incorectă",
        type: "Tip de solicitare necunoscut",
      }
    : {
        firstName: "Имя",
        lastName: "Фамилия",
        city: "Город",
        required: "обязательное поле",
        tooLong: "слишком длинное значение",
        phone: "Некорректный номер телефона",
        consent: "Необходимо принять условия обработки данных",
        form: "Некорректные данные формы",
        selectProduct: "Выберите хотя бы один товар",
        productLimit: "Можно выбрать не более 20 товаров",
        unavailableProduct: "Один или несколько товаров недоступны",
        consultationMode: "Выберите формат консультации",
        date: "Некорректная дата",
        time: "Некорректное время",
        type: "Неизвестный тип заявки",
      };
  const requiredText = [
    ["firstName", 60, copy.firstName],
    ["lastName", 60, copy.lastName],
    ["city", 100, copy.city],
  ] as const;
  for (const [field, max, label] of requiredText) {
    const value = typeof raw[field] === "string" ? raw[field].trim() : "";
    if (!value) fieldErrors[field] = `${label}: ${copy.required}`;
    else if (value.length > max) fieldErrors[field] = `${label}: ${copy.tooLong}`;
  }
  const phone = typeof raw.phone === "string" ? raw.phone.trim() : "";
  const digits = phone.replace(/\D/g, "");
  if (
    !phone ||
    phone.length > 32 ||
    !/^[\d\s+()-]+$/u.test(phone) ||
    digits.length < 7 ||
    digits.length > 15
  ) {
    fieldErrors.phone = copy.phone;
  }
  if (raw.consentAccepted !== true) {
    fieldErrors.consentAccepted = copy.consent;
  }
  if (typeof raw.website === "string" && raw.website.length > 0) {
    fieldErrors.website = copy.form;
  }

  if (raw.type === "order") {
    const slugs = Array.isArray(raw.productSlugs)
      ? [...new Set(raw.productSlugs.filter((slug): slug is string => typeof slug === "string"))]
      : [];
    if (!slugs.length) fieldErrors.productSlugs = copy.selectProduct;
    else if (slugs.length > 20) {
      fieldErrors.productSlugs = copy.productLimit;
    } else if (slugs.some((slug) => !allowedProductSlugs.has(slug))) {
      fieldErrors.productSlugs = copy.unavailableProduct;
    }
    if (Object.keys(fieldErrors).length) return { success: false, fieldErrors };
    return {
      success: true,
      data: {
        type: "order",
        firstName: String(raw.firstName).trim(),
        lastName: String(raw.lastName).trim(),
        phone,
        city: String(raw.city).trim(),
        consentAccepted: true,
        website: String(raw.website ?? ""),
        productSlugs: slugs,
      },
    };
  }

  if (raw.type === "consultation") {
    if (raw.consultationMode !== "online" && raw.consultationMode !== "offline") {
      fieldErrors.consultationMode = copy.consultationMode;
    }
    if (
      typeof raw.consultationDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/u.test(raw.consultationDate)
    ) {
      fieldErrors.consultationDate = copy.date;
    }
    if (
      typeof raw.consultationTime !== "string" ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(raw.consultationTime)
    ) {
      fieldErrors.consultationTime = copy.time;
    }
    if (Object.keys(fieldErrors).length) return { success: false, fieldErrors };
    return {
      success: true,
      data: {
        type: "consultation",
        firstName: String(raw.firstName).trim(),
        lastName: String(raw.lastName).trim(),
        phone,
        city: String(raw.city).trim(),
        consentAccepted: true,
        website: String(raw.website ?? ""),
        consultationMode: raw.consultationMode as "online" | "offline",
        consultationDate: String(raw.consultationDate),
        consultationTime: String(raw.consultationTime),
      },
    };
  }

  return {
    success: false,
    fieldErrors: { type: copy.type },
  };
}
