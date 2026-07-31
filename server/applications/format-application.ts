import type { ApplicationRecord } from "./application-types";

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
    `Имя Фамилия: ${record.firstName} ${record.lastName}`,
    `Телефон: ${record.phone}`,
    `Город: ${record.city}`,
  ];
  const footer = [
    `ID заявки: ${record.requestId}`,
    `Получено: ${formatDateTimeInChisinau(record.submittedAt)}`,
    "Источник: сайт Dr. Nona Moldova",
  ];

  if (record.type === "order") {
    const products = record.products.map(
      (product, index) =>
        `${index + 1}. ${product.officialName} — ${
          product.sku ? `SKU ${product.sku}` : "SKU не указан"
        }`
    );
    return [
      "🛒 НОВЫЙ ЗАКАЗ",
      "",
      ...common,
      "",
      "Товары:",
      ...products,
      "",
      ...footer,
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
  ].join("\n");
}
