import type { ApplicationInput } from "../../../shared/applications/application-schema";

export type ApplicationDelivery = {
  telegram: "sent" | "failed" | "pending";
};

export type ApplicationApiResult =
  | {
      kind: "success";
      requestId: string;
      delivery: ApplicationDelivery;
    }
  | {
      kind: "validation-error";
      fieldErrors: Record<string, string>;
    }
  | {
      kind: "network-error" | "server-error";
      requestId?: string;
    }
  | {
      kind: "slot-unavailable";
    };

export type ConsultationSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  mode: "online" | "offline";
};

export async function loadConsultationSlots(fetchImpl: typeof fetch = fetch): Promise<ConsultationSlot[]> {
  try {
    const response = await fetchImpl("/api/consultation-slots", { headers: { Accept: "application/json" } });
    if (!response.ok) return [];
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("slots" in payload) || !Array.isArray(payload.slots)) return [];
    return payload.slots.filter((slot): slot is ConsultationSlot => {
      if (!slot || typeof slot !== "object") return false;
      const value = slot as Record<string, unknown>;
      return (
        typeof value.id === "string" &&
        typeof value.startsAt === "string" &&
        typeof value.endsAt === "string" &&
        (value.mode === "online" || value.mode === "offline")
      );
    });
  } catch {
    return [];
  }
}

export async function submitApplication(
  input: ApplicationInput,
  idempotencyKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<ApplicationApiResult> {
  const requestBody: ApplicationInput = { ...input };
  let response: Response;
  try {
    response = await fetchImpl("/api/applications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(requestBody),
    });
  } catch {
    return { kind: "network-error" };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { kind: "server-error" };
  }
  const body =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};
  if (
    (response.status === 201 || response.status === 202) &&
    typeof body.requestId === "string" &&
    typeof body.delivery === "object" &&
    body.delivery !== null
  ) {
    return {
      kind: "success",
      requestId: body.requestId,
      delivery: body.delivery as ApplicationDelivery,
    };
  }
  if (response.status === 400 && typeof body.fieldErrors === "object") {
    return {
      kind: "validation-error",
      fieldErrors: body.fieldErrors as Record<string, string>,
    };
  }
  if (response.status === 409 && body.code === "CONSULTATION_SLOT_UNAVAILABLE") {
    return { kind: "slot-unavailable" };
  }
  return {
    kind: "server-error",
    requestId:
      typeof body.requestId === "string" ? body.requestId : undefined,
  };
}
