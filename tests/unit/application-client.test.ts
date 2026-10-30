import { expect, test } from "vitest";
import { submitApplication } from "../../src/features/contact/application-client";
import type { ApplicationInput } from "../../shared/applications/application-schema";

const input: ApplicationInput = { type: "order", locale: "ru-MD", firstName: "Ana", lastName: "Popescu", phone: "069123456", city: "Кишинёв", consentAccepted: true, productSlugs: ["lord-deodorant"] };
test.each([
  [202, { ok: true, requestId: "queued", delivery: { telegram: "pending" } }],
  [201, { ok: true, requestId: "pending", delivery: { telegram: "pending" } }],
  [201, { ok: false, requestId: "failed", delivery: { telegram: "sent" } }],
  [201, { ok: true, requestId: "", delivery: { telegram: "sent" } }],
  [400, { fieldErrors: null }],
  [400, { fieldErrors: { firstName: {} } }],
  [502, { ok: false }],
])("never reports success for an unconfirmed response %s %j", async (status, payload) => {
  const result = await submitApplication(input, "attempt-1", async () => Response.json(payload, { status }));
  expect(result.kind).toBe("server-error");
});
test.each([201, 202])("requires an explicit committed CRM receipt (%s)", async status => {
  expect(await submitApplication(input, "attempt-1", async () => Response.json({ ok: true, accepted: true, requestId: "order-1", delivery: { telegram: status === 201 ? "sent" : "pending" } }, { status }))).toEqual({ kind: "success", requestId: "order-1", delivery: { telegram: status === 201 ? "sent" : "pending" } });
});
