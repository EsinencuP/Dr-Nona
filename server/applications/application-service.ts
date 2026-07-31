import { randomUUID } from "node:crypto";
import type { ApplicationInput } from "../../shared/applications/application-schema";
import { normalizePhone } from "../../shared/applications/application-schema";
import { formatTelegramApplication } from "./format-application";
import type {
  ApplicationProduct,
  ApplicationRecord,
  ApplicationServiceResult,
  ProviderResult,
} from "./application-types";

export type ApplicationServiceDependencies = {
  productsBySlug: ReadonlyMap<string, ApplicationProduct>;
  sendTelegram: (
    record: ApplicationRecord,
    message: string
  ) => Promise<ProviderResult>;
  createRequestId?: () => string;
  now?: () => Date;
  logger?: (metadata: Record<string, unknown>) => void;
};

export async function processApplication(
  input: ApplicationInput,
  dependencies: ApplicationServiceDependencies
): Promise<ApplicationServiceResult> {
  const startedAt = Date.now();
  const requestId = (dependencies.createRequestId ?? randomUUID)();
  const submittedAt = (dependencies.now ?? (() => new Date()))().toISOString();
  const phone = normalizePhone(input.phone);
  const base = {
    schemaVersion: 1 as const,
    requestId,
    firstName: input.firstName,
    lastName: input.lastName,
    ...phone,
    city: input.city,
    source: "website" as const,
    locale: "ru-MD" as const,
    submittedAt,
  };
  const record: ApplicationRecord =
    input.type === "order"
      ? {
          ...base,
          type: "order",
          products: input.productSlugs.map((slug) => {
            const product = dependencies.productsBySlug.get(slug);
            if (!product) throw new Error("Validated product is unavailable");
            return product;
          }),
        }
      : {
          ...base,
          type: "consultation",
          consultationMode: input.consultationMode,
          consultationDate: input.consultationDate,
          consultationTime: input.consultationTime,
          timezone: "Europe/Chisinau",
        };
  const message = formatTelegramApplication(record);
  const telegramResult = await dependencies
    .sendTelegram(record, message)
    .catch(() => undefined);
  const delivery = {
    telegram:
      telegramResult?.provider === "telegram" &&
      telegramResult.status === "sent"
        ? ("sent" as const)
        : ("failed" as const),
  };
  const outcome = delivery.telegram === "sent" ? "success" : "failure";
  dependencies.logger?.({
    event: "application.delivery.completed",
    requestId,
    type: record.type,
    telegramStatus: delivery.telegram,
    durationMs: Date.now() - startedAt,
  });
  return { requestId, type: record.type, delivery, outcome };
}
