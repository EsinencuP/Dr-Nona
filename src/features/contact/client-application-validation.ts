import type { ApplicationInput } from "../../../shared/applications/application-schema";

export type ClientValidationResult =
  | { success: true; data: ApplicationInput }
  | { success: false; fieldErrors: Record<string, string> };

export function validateClientApplication(
  raw: Record<string, unknown>,
  allowedProductSlugs: ReadonlySet<string>
): ClientValidationResult {
  const fieldErrors: Record<string, string> = {};
  const requiredText = [
    ["firstName", 60, "Имя"],
    ["lastName", 60, "Фамилия"],
    ["city", 100, "Город"],
  ] as const;
  for (const [field, max, label] of requiredText) {
    const value = typeof raw[field] === "string" ? raw[field].trim() : "";
    if (!value) fieldErrors[field] = `${label}: обязательное поле`;
    else if (value.length > max) fieldErrors[field] = `${label}: слишком длинное значение`;
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
    fieldErrors.phone = "Некорректный номер телефона";
  }
  if (raw.consentAccepted !== true) {
    fieldErrors.consentAccepted =
      "Необходимо принять условия обработки данных";
  }
  if (typeof raw.website === "string" && raw.website.length > 0) {
    fieldErrors.website = "Некорректные данные формы";
  }

  if (raw.type === "order") {
    const slugs = Array.isArray(raw.productSlugs)
      ? [...new Set(raw.productSlugs.filter((slug): slug is string => typeof slug === "string"))]
      : [];
    if (!slugs.length) fieldErrors.productSlugs = "Выберите хотя бы один товар";
    else if (slugs.length > 20) {
      fieldErrors.productSlugs = "Можно выбрать не более 20 товаров";
    } else if (slugs.some((slug) => !allowedProductSlugs.has(slug))) {
      fieldErrors.productSlugs = "Один или несколько товаров недоступны";
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
      fieldErrors.consultationMode = "Выберите формат консультации";
    }
    if (
      typeof raw.consultationDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/u.test(raw.consultationDate)
    ) {
      fieldErrors.consultationDate = "Некорректная дата";
    }
    if (
      typeof raw.consultationTime !== "string" ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(raw.consultationTime)
    ) {
      fieldErrors.consultationTime = "Некорректное время";
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
    fieldErrors: { type: "Неизвестный тип заявки" },
  };
}
