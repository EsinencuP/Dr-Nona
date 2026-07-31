import { describe, expect, test, vi } from "vitest";
import { processApplication } from "../../server/applications/application-service";
import type { ProviderResult } from "../../server/applications/application-types";
import type { ApplicationInput } from "../../shared/applications/application-schema";

const input: ApplicationInput = {
  type: "order",
  firstName: "Ana",
  lastName: "Popescu",
  phone: "069 123 456",
  city: "Chișinău",
  consentAccepted: true,
  website: "",
  productSlugs: ["lord-deodorant"],
};
const sent = (): ProviderResult => ({
  provider: "telegram",
  status: "sent",
  providerMessageId: "telegram-id",
  durationMs: 1,
});
const failed = (): ProviderResult => ({
  provider: "telegram",
  status: "failed",
  errorCode: "TEST",
  durationMs: 1,
});

function dependencies(telegram: () => Promise<ProviderResult>) {
  return {
    productsBySlug: new Map([
      [
        "lord-deodorant",
        {
          slug: "lord-deodorant",
          officialName: "Lord Deodorant",
          sku: "324001",
        },
      ],
    ]),
    sendTelegram: vi.fn(telegram),
    createRequestId: () => "request-fixed",
    now: () => new Date("2030-01-01T00:00:00.000Z"),
    logger: vi.fn(),
  };
}

describe("application service", () => {
  test.each([
    ["success", () => Promise.resolve(sent())],
    ["failure", () => Promise.resolve(failed())],
    ["failure", () => Promise.reject(new Error("provider failed"))],
  ])("returns %s for Telegram result", async (outcome, telegram) => {
    const result = await processApplication(input, dependencies(telegram));
    expect(result.outcome).toBe(outcome);
  });

  test("uses the server request ID in the Telegram message", async () => {
    const deps = dependencies(() => Promise.resolve(sent()));
    await processApplication(input, deps);
    const telegramCalls = deps.sendTelegram.mock.calls as unknown as [
      unknown,
      string,
    ][];
    expect(telegramCalls[0][1]).toContain("request-fixed");
  });
});
