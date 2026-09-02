import type { ApplicationRecord } from "./application-types.js";

export const STATUS_PENDING = "⏳ Статус: Ожидает обработки";
export const STATUS_DONE = "✅ Статус: Выполнено";

/**
 * Replace the status line in a Telegram message.
 * Returns `null` when the target status line is not found.
 */
export function replaceStatus(
  text: string,
  from: string,
  to: string
): string | null {
  if (!text.includes(from)) return null;
  return text.replace(from, to);
}

function formatDateTimeInChisinau(iso: string) {
  const parts = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Chisinau",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.day}.${value.month}.${value.year}, ${value.hour}:${value.minute}:${value.second}`;
}

function formatConsultationDate(date: string, time: string) {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}, ${time}`;
}

export function formatTelegramApplication(record: ApplicationRecord) {
  const common = [
    `Язык: ${record.locale === "ro-MD" ? "RO" : "RU"}`,
    `Имя Фамилия: ${record.firstName} ${record.lastName}`,
    `Телефон: ${record.phone}`,
    `Регион: ${record.city}`,
  ];
  const footer = [
    `ID заявки: ${record.requestId}`,
    `Получено: ${formatDateTimeInChisinau(record.submittedAt)}`,
    "Источник: сайт Dr. Nona Moldova",
  ];

  if (record.type === "order") {
    const products = record.products.map((product, index) => {
      const quantity =
        product.quantity && product.quantity > 1
          ? ` × ${product.quantity} шт.`
          : "";
      const sku = product.sku ? `SKU ${product.sku}` : "SKU не указан";
      return `${index + 1}. ${product.officialName}${quantity} — ${sku}`;
    });
    return [
      "🛒 НОВЫЙ ЗАКАЗ",
      "",
      ...common,
      "",
      "Товары:",
      ...products,
      "",
      ...footer,
      "",
      STATUS_PENDING,
    ].join("\n");
  }

  if (record.type === "masterclass") {
    return [
      "🎓 НОВАЯ ЗАПИСЬ НА МАСТЕР-КЛАСС",
      "",
      ...common,
      `Тема: ${record.masterclassTopic}`,
      `Дата и время: ${formatConsultationDate(
        record.eventDate,
        record.eventTime
      )}`,
      "Часовой пояс: Europe/Chisinau",
      "",
      ...footer,
      "",
      STATUS_PENDING,
    ].join("\n");
  }

  return [
    "💬 НОВАЯ КОНСУЛЬТАЦИЯ",
    "",
    ...common,
    `Формат: ${record.consultationMode === "online" ? "Онлайн" : "Офлайн"}`,
    `Дата и время: ${formatConsultationDate(
      record.consultationDate,
      record.consultationTime
    )}`,
    "Часовой пояс: Europe/Chisinau",
    "",
    ...footer,
    "",
    STATUS_PENDING,
  ].join("\n");
}
