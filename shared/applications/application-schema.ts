import { z } from "zod";

const NAME_MAX = 60;
const CITY_MAX = 100;
const PHONE_MAX = 32;
const SLUG_MAX = 100;

const trimmedText = (label: string, max: number) =>
  z
    .string({ error: `${label}: обязательное поле` })
    .trim()
    .min(1, `${label}: обязательное поле`)
    .max(max, `${label}: слишком длинное значение`);

const baseApplicationSchema = z.object({
  locale: z.enum(["ru-MD", "ro-MD"]),
  firstName: trimmedText("Имя", NAME_MAX),
  lastName: trimmedText("Фамилия", NAME_MAX),
  phone: z
    .string({ error: "Некорректный номер телефона" })
    .trim()
    .min(1, "Некорректный номер телефона")
    .max(PHONE_MAX, "Некорректный номер телефона")
    .regex(/^[\d\s+()-]+$/u, "Некорректный номер телефона")
    .refine(
      (value) => {
        const digits = value.replace(/\D/g, "");
        return digits.length >= 7 && digits.length <= 15;
      },
      "Некорректный номер телефона"
    ),
  city: trimmedText("Город", CITY_MAX),
  consentAccepted: z.literal(true, {
    error: "Необходимо принять условия обработки данных",
  }),
  website: z.string().max(0, "Некорректные данные формы").optional(),
});

const orderApplicationSchema = baseApplicationSchema.extend({
  type: z.literal("order"),
  productSlugs: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Некорректный товар")
        .max(SLUG_MAX, "Некорректный товар")
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, "Некорректный товар")
    )
    .min(1, "Выберите хотя бы один товар")
    .max(20, "Можно выбрать не более 20 товаров")
    .transform((slugs) => [...new Set(slugs)]),
});

const consultationApplicationSchema = baseApplicationSchema.extend({
  type: z.literal("consultation"),
  consultationMode: z.enum(["online", "offline"], {
    error: "Выберите формат консультации",
  }),
  consultationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, "Некорректная дата"),
  consultationTime: z
    .string()
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/u, "Некорректное время"),
});

export const applicationInputSchema = z.discriminatedUnion("type", [
  orderApplicationSchema,
  consultationApplicationSchema,
]);

export type ApplicationInput = z.infer<typeof applicationInputSchema>;
export type OrderApplicationInput = Extract<ApplicationInput, { type: "order" }>;
export type ConsultationApplicationInput = Extract<
  ApplicationInput,
  { type: "consultation" }
>;

export type ApplicationValidationOptions = {
  allowedProductSlugs: ReadonlySet<string>;
  now?: Date;
};

export type ApplicationValidationResult =
  | { success: true; data: ApplicationInput }
  | { success: false; fieldErrors: Record<string, string> };

function isCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function chisinauLocalMinute(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Chisinau",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}

function flattenFieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

export function validateApplicationInput(
  raw: unknown,
  options: ApplicationValidationOptions
): ApplicationValidationResult {
  const parsed = applicationInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: flattenFieldErrors(parsed.error) };
  }

  const data = parsed.data;
  const fieldErrors: Record<string, string> = {};
  if (data.type === "order") {
    if (data.productSlugs.some((slug) => !options.allowedProductSlugs.has(slug))) {
      fieldErrors.productSlugs = "Один или несколько товаров недоступны";
    }
  } else {
    if (!isCalendarDate(data.consultationDate)) {
      fieldErrors.consultationDate = "Некорректная дата";
    } else if (
      `${data.consultationDate}T${data.consultationTime}` <
      chisinauLocalMinute(options.now ?? new Date())
    ) {
      fieldErrors.consultationDate =
        "Выберите будущую дату и время по часовому поясу Кишинёва";
    }
  }

  return Object.keys(fieldErrors).length
    ? { success: false, fieldErrors }
    : { success: true, data };
}

export function normalizePhone(phone: string) {
  const trimmed = phone.trim().replace(/\s+/g, " ");
  const normalized = `${trimmed.startsWith("+") ? "+" : ""}${trimmed.replace(/\D/g, "")}`;
  return { phone: trimmed, phoneNormalized: normalized };
}
