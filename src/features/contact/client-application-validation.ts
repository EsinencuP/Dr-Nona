import type { ApplicationInput } from "../../../shared/applications/application-schema";
import {
  MASTERCLASS_TOPICS,
  type MasterclassTopic,
} from "../../../shared/constants/masterclass-topics";
import { MOLDOVA_REGIONS } from "../../../shared/constants/moldova-regions";

export type ClientValidationResult =
  | { success: true; data: ApplicationInput }
  | { success: false; fieldErrors: Record<string, string> };

function optionalTrimmedText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function isMasterclassTopic(value: unknown): value is MasterclassTopic {
  return (
    typeof value === "string" &&
    MASTERCLASS_TOPICS.some((topic) => topic === value)
  );
}

function normalizeOrderItems(rawItems: unknown, slugs: string[]) {
  const quantities = new Map<string, number>();
  if (Array.isArray(rawItems)) {
    for (const candidate of rawItems) {
      if (typeof candidate !== "object" || candidate === null) continue;
      const item = candidate as Record<string, unknown>;
      if (typeof item.slug !== "string") continue;
      const quantity = Number(item.quantity);
      quantities.set(
        item.slug,
        Math.max(1, Math.min(99, Number.isFinite(quantity) ? quantity : 1))
      );
    }
  }
  return slugs.map((slug) => ({
    slug,
    quantity: Math.round(quantities.get(slug) ?? 1),
  }));
}

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
        region: "Selectați o regiune din listă",
        required: "câmp obligatoriu",
        tooLong: "valoarea este prea lungă",
        phone: "Număr de telefon incorect",
        consent: "Este necesar acordul pentru prelucrarea datelor",
        form: "Date incorecte în formular",
        selectProduct: "Selectați cel puțin un produs",
        productLimit: "Puteți selecta cel mult 20 de produse",
        unavailableProduct: "Unul sau mai multe produse nu sunt disponibile",
        consultationMode: "Selectați formatul consultației",
        masterclassTopic: "Selectați o temă de masterclass din listă",
        date: "Dată incorectă",
        time: "Oră incorectă",
        type: "Tip de solicitare necunoscut",
      }
    : {
        firstName: "Имя",
        lastName: "Фамилия",
        region: "Выберите регион из списка",
        required: "обязательное поле",
        tooLong: "слишком длинное значение",
        phone: "Некорректный номер телефона",
        consent: "Необходимо принять условия обработки данных",
        form: "Некорректные данные формы",
        selectProduct: "Выберите хотя бы один товар",
        productLimit: "Можно выбрать не более 20 товаров",
        unavailableProduct: "Один или несколько товаров недоступны",
        consultationMode: "Выберите формат консультации",
        masterclassTopic: "Выберите тему мастер-класса из списка",
        date: "Некорректная дата",
        time: "Некорректное время",
        type: "Неизвестный тип заявки",
      };
  const requiredText = [
    ["firstName", 60, copy.firstName],
    ["lastName", 60, copy.lastName],
  ] as const;
  for (const [field, max, label] of requiredText) {
    const value = typeof raw[field] === "string" ? raw[field].trim() : "";
    if (!value) fieldErrors[field] = `${label}: ${copy.required}`;
    else if (value.length > max) fieldErrors[field] = `${label}: ${copy.tooLong}`;
  }
  const city = typeof raw.city === "string" ? raw.city.trim() : "";
  if (!city || !MOLDOVA_REGIONS.some((region) => region === city)) {
    fieldErrors.city = copy.region;
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
  const optionalFields = {
    email: optionalTrimmedText(raw.email),
    comment: optionalTrimmedText(raw.comment),
    preferredCallTime: optionalTrimmedText(raw.preferredCallTime),
    utmSource: optionalString(raw.utmSource),
    utmMedium: optionalString(raw.utmMedium),
    utmCampaign: optionalString(raw.utmCampaign),
    utmContent: optionalString(raw.utmContent),
    entryPoint: optionalString(raw.entryPoint),
    sessionHistory: optionalString(raw.sessionHistory),
  };

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
    const items = normalizeOrderItems(raw.items, slugs);
    if (Object.keys(fieldErrors).length) return { success: false, fieldErrors };
    return {
      success: true,
      data: {
        locale: locale === "ro" ? "ro-MD" : "ru-MD",
        type: "order",
        firstName: String(raw.firstName).trim(),
        lastName: String(raw.lastName).trim(),
        phone,
        city,
        consentAccepted: true,
        website: String(raw.website ?? ""),
        productSlugs: slugs,
        items,
        ...optionalFields,
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
        locale: locale === "ro" ? "ro-MD" : "ru-MD",
        type: "consultation",
        firstName: String(raw.firstName).trim(),
        lastName: String(raw.lastName).trim(),
        phone,
        city,
        consentAccepted: true,
        website: String(raw.website ?? ""),
        consultationMode: raw.consultationMode as "online" | "offline",
        consultationDate: String(raw.consultationDate),
        consultationTime: String(raw.consultationTime),
        ...optionalFields,
      },
    };
  }

  if (raw.type === "masterclass") {
    const masterclassTopic = raw.masterclassTopic;
    const masterclassTopicIsValid = isMasterclassTopic(masterclassTopic);
    if (!masterclassTopicIsValid) {
      fieldErrors.masterclassTopic = copy.masterclassTopic;
    }
    if (
      typeof raw.eventDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/u.test(raw.eventDate)
    ) {
      fieldErrors.eventDate = copy.date;
    }
    if (
      typeof raw.eventTime !== "string" ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(raw.eventTime)
    ) {
      fieldErrors.eventTime = copy.time;
    }
    if (!masterclassTopicIsValid || Object.keys(fieldErrors).length) {
      return { success: false, fieldErrors };
    }

    return {
      success: true,
      data: {
        locale: locale === "ro" ? "ro-MD" : "ru-MD",
        type: "masterclass",
        firstName: String(raw.firstName).trim(),
        lastName: String(raw.lastName).trim(),
        phone,
        city,
        consentAccepted: true,
        website: String(raw.website ?? ""),
        masterclassTopic,
        eventDate: String(raw.eventDate),
        eventTime: String(raw.eventTime),
        ...optionalFields,
      },
    };
  }

  return {
    success: false,
    fieldErrors: { type: copy.type },
  };
}
