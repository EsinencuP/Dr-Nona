import type {
  ApplicationAttribution,
  ApplicationInput,
  OrderItemInput,
} from "../../../shared/applications/application-schema";
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
  const items: OrderItemInput[] = [];
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
    items.push({ slug: item.slug, quantity: item.quantity,
      ...(typeof item.officialName === "string" ? { officialName: item.officialName } : {}),
      ...(typeof item.sku === "string" ? { sku: item.sku } : {}),
      ...(typeof item.url === "string" ? { url: item.url } : {}),
    });
  }
  return seen.size === selectedSlugs.size ? items : null;
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
        invalidItems: "Date incorecte despre cantitatea produselor",
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

  if (optionalFields.email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(optionalFields.email))) fieldErrors.email = locale === "ro" ? "Adresa de email nu este corectă" : "Некорректный адрес электронной почты";
  if ((optionalFields.comment?.length ?? 0) > 500) fieldErrors.comment = locale === "ro" ? "Comentariul poate avea cel mult 500 de caractere" : "Комментарий: не более 500 символов";
  if ((optionalFields.preferredCallTime?.length ?? 0) > 100) fieldErrors.preferredCallTime = locale === "ro" ? "Intervalul pentru apel este prea lung" : "Время звонка: слишком длинное значение";

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

  return {
    success: false,
    fieldErrors: { type: copy.type },
  };
}
