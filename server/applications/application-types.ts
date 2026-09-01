import type { ApplicationInput } from "../../shared/applications/application-schema.js";

export type ApplicationProduct = {
  slug: string;
  officialName: string;
  sku: string;
};

type ApplicationRecordBase = {
  schemaVersion: 1;
  requestId: string;
  type: "order" | "consultation";
  firstName: string;
  lastName: string;
  phone: string;
  phoneNormalized: string;
  city: string;
  source: "website";
  locale: ApplicationInput["locale"];
  submittedAt: string;
};

export type OrderApplicationRecord = ApplicationRecordBase & {
  type: "order";
  products: ApplicationProduct[];
};

export type ConsultationApplicationRecord = ApplicationRecordBase & {
  type: "consultation";
  consultationMode: "online" | "offline";
  consultationDate: string;
  consultationTime: string;
  timezone: "Europe/Chisinau";
};

export type ApplicationRecord =
  | OrderApplicationRecord
  | ConsultationApplicationRecord;

export type ProviderName = "telegram";
export type ProviderResult =
  | {
      provider: ProviderName;
      status: "sent";
      providerMessageId: string;
      durationMs: number;
    }
  | {
      provider: ProviderName;
      status: "failed";
      statusCode?: number;
      errorCode: string;
      durationMs: number;
    };

export type DeliveryStatus = "sent" | "failed";

export type ApplicationServiceResult = {
  requestId: string;
  type: ApplicationInput["type"];
  delivery: {
    telegram: DeliveryStatus;
  };
  outcome: "success" | "failure";
};
