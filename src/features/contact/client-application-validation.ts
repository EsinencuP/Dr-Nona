import type {
  ApplicationAttribution,
  ApplicationInput,
} from "../../../shared/applications/application-schema";
import {
  MASTERCLASS_TOPICS,
  type MasterclassTopic,
} from "../../../shared/constants/masterclass-topics";
import { MOLDOVA_REGIONS } from "../../../shared/constants/moldova-regions";
import { validateAppointmentWindow } from "../../../shared/applications/appointment-policy";

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

function isProductSlug(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 100 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value)
  );
}

function isBoundedSafeText(value: unknown, max: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= max &&
    Array.from(value).every((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint > 31 && codePoint !== 127;
    })
  );
}

function isAttributionTouch(value: unknown) {
  if (typeof value !== "object" || value === null) return false;
  const touch = value as Record<string, unknown>;
  if (touch.kind !== "direct" && touch.kind !== "campaign") return false;
  if (
    !["source", "medium", "campaign", "content"].every(
      (key) => touch[key] === undefined || isBoundedSafeText(touch[key], 100)
    ) ||
    typeof touch.capturedAt !== "string" ||
    !Number.isFinite(Date.parse(touch.capturedAt))
  ) {
    return false;
  }
  if (touch.raw === undefined) return true;
  if (typeof touch.raw !== "object" || touch.raw === null) return false;
  const raw = touch.raw as Record<string, unknown>;
  return ["source", "medium", "campaign", "content"].every(
    (key) => raw[key] === undefined || isBoundedSafeText(raw[key], 200)
  );
}

function parseAttribution(value: unknown): ApplicationAttribution | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const attribution = value as Record<string, unknown>;
  const entry = attribution.entry;
  if (typeof entry !== "object" || entry === null) return undefined;
  const route = entry as Record<string, unknown>;
  if (
    attribution.version !== 1 ||
    attribution.consent !== "application_submission" ||
    !isAttributionTouch(attribution.firstTouch) ||
    !isAttributionTouch(attribution.lastTouch) ||
    !isBoundedSafeText(route.path, 300) ||
    !route.path.startsWith("/") ||
    route.path.startsWith("//") ||
    route.path.includes("?") ||
    route.path.includes("#") ||
    (route.locale !== "ru-MD" && route.locale !== "ro-MD") ||
    !Array.isArray(attribution.sessionHistory) ||
    attribution.sessionHistory.length > 20 ||
    !attribution.sessionHistory.every(isProductSlug)
  ) {
    return undefined;
  }
  return value as ApplicationAttribution;
}

function validateOrderItems(rawItems: unknown, slugs: string[]) {
  if (rawItems === undefined) {
    return slugs.map((slug) => ({ slug, quantity: 1 }));
  }
  if (!Array.isArray(rawItems) || rawItems.length !== slugs.length) return null;

  const selectedSlugs = new Set(slugs);
  const seen = new Set<string>();
  const items: Array<{ slug: string; quantity: number }> = [];
  for (const candidate of rawItems) {
    if (typeof candidate !== "object" || candidate === null) return null;
    const item = candidate as Record<string, unknown>;
    if (
      !isProductSlug(item.slug) ||
      !selectedSlugs.has(item.slug) ||
      seen.has(item.slug) ||
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    ) {
      return null;
    }
    seen.add(item.slug);
    items.push({ slug: item.slug, quantity: item.quantity });
  }
  return seen.size === selectedSlugs.size ? items : null;
}

export function validateClientApplication(
  raw: Record<string, unknown>,
  allowedProductSlugs: ReadonlySet<string>,
  locale: "ru" | "ro" = "ru",
  now = new Date()
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
        invalidItems: "Date incorecte despre cantitatea produselor",
        consultationMode: "Selectați formatul consultației",
        consultationSlot: "Selectați un interval disponibil",
        masterclassTopic: "Selectați o temă de masterclass din listă",
        date: "Dată incorectă",
        time: "Oră incorectă",
        futureConsultation: "Selectați o dată și o oră viitoare în fusul orar al Chișinăului",
        consultationMaximum: "Selectați o dată pentru consultație în următoarele 90 de zile",
        masterclassMinimum: "Selectați o dată pentru masterclass începând de mâine",
        masterclassMaximum: "Selectați o dată pentru masterclass în următoarele 180 de zile",
        type: "Tip de solicitare necunoscut",
        attribution: "Date de atribuire nevalide",
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
        invalidItems: "Некорректные данные о количестве товаров",
        consultationMode: "Выберите формат консультации",
        consultationSlot: "Выберите доступный слот",
        masterclassTopic: "Выберите тему мастер-класса из списка",
        date: "Некорректная дата",
        time: "Некорректное время",
        futureConsultation: "Выберите будущую дату и время по часовому поясу Кишинёва",
        consultationMaximum: "Выберите дату консультации не позднее чем через 90 дней",
        masterclassMinimum: "Выберите дату мастер-класса начиная со следующего дня",
        masterclassMaximum: "Выберите дату мастер-класса не позднее чем через 180 дней",
        type: "Неизвестный тип заявки",
        attribution: "Некорректные данные атрибуции",
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
  const parsedAttribution = parseAttribution(raw.attribution);
  if (raw.attribution !== undefined && !parsedAttribution) {
    fieldErrors.attribution = copy.attribution;
  } else if (parsedAttribution) {
    const expectedLocale = locale === "ro" ? "ro-MD" : "ru-MD";
    if (
      parsedAttribution.entry.locale !== expectedLocale ||
      parsedAttribution.sessionHistory.some(
        (slug) => !allowedProductSlugs.has(slug)
      )
    ) {
      fieldErrors.attribution = copy.attribution;
    }
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
    attribution: parsedAttribution,
  };

  if (raw.type === "order") {
    const rawSlugs = Array.isArray(raw.productSlugs) ? raw.productSlugs : [];
    const slugs = rawSlugs.filter(isProductSlug);
    if (!slugs.length) fieldErrors.productSlugs = copy.selectProduct;
    else if (
      slugs.length !== rawSlugs.length ||
      new Set(slugs).size !== slugs.length
    ) {
      fieldErrors.productSlugs = copy.unavailableProduct;
    } else if (slugs.length > 20) {
      fieldErrors.productSlugs = copy.productLimit;
    } else if (slugs.some((slug) => !allowedProductSlugs.has(slug))) {
      fieldErrors.productSlugs = copy.unavailableProduct;
    }
    const items = validateOrderItems(raw.items, slugs);
    if (!items) fieldErrors.items = copy.invalidItems;
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
        items: items!,
        ...optionalFields,
      },
    };
  }

  if (raw.type === "consultation") {
    if (
      raw.consultationSlotId !== undefined &&
      (typeof raw.consultationSlotId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(raw.consultationSlotId))
    ) {
      fieldErrors.consultationSlotId = copy.consultationSlot;
    }
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
    if (
      typeof raw.consultationDate === "string" &&
      typeof raw.consultationTime === "string" &&
      !fieldErrors.consultationDate &&
      !fieldErrors.consultationTime
    ) {
      const violation = validateAppointmentWindow(
        "consultation",
        raw.consultationDate,
        raw.consultationTime,
        now
      );
      if (violation === "invalid") fieldErrors.consultationDate = copy.date;
      else if (violation === "before_minimum") fieldErrors.consultationDate = copy.futureConsultation;
      else if (violation === "after_maximum") fieldErrors.consultationDate = copy.consultationMaximum;
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
        consultationSlotId: raw.consultationSlotId as string | undefined,
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
    if (
      typeof raw.eventDate === "string" &&
      typeof raw.eventTime === "string" &&
      !fieldErrors.eventDate &&
      !fieldErrors.eventTime
    ) {
      const violation = validateAppointmentWindow(
        "masterclass",
        raw.eventDate,
        raw.eventTime,
        now
      );
      if (violation === "invalid") fieldErrors.eventDate = copy.date;
      else if (violation === "before_minimum") fieldErrors.eventDate = copy.masterclassMinimum;
      else if (violation === "after_maximum") fieldErrors.eventDate = copy.masterclassMaximum;
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
