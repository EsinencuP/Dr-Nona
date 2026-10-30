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
    };

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
    body.accepted === true &&
    body.ok === true &&
    typeof body.requestId === "string" && body.requestId.trim().length > 0 &&
    typeof body.delivery === "object" &&
    body.delivery !== null &&
    "telegram" in body.delivery &&
    (body.delivery.telegram === "sent" || body.delivery.telegram === "pending" || body.delivery.telegram === "failed")
  ) {
    return {
      kind: "success",
      requestId: body.requestId,
      delivery: { telegram: body.delivery.telegram },
    };
  }
  if (response.status === 400 && typeof body.fieldErrors === "object" && body.fieldErrors !== null &&
      !Array.isArray(body.fieldErrors) && Object.values(body.fieldErrors).every(value => typeof value === "string")) {
    return {
      kind: "validation-error",
      fieldErrors: body.fieldErrors as Record<string, string>,
    };
  }
  return {
    kind: "server-error",
    requestId:
      typeof body.requestId === "string" ? body.requestId : undefined,
  };
}
