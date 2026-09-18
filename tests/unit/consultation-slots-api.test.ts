import { describe, expect, test, vi } from "vitest";

import { createConsultationSlotsProxy } from "../../api/consultation-slots";

describe("GET /api/consultation-slots proxy", () => {
  test("derives the CRM endpoint and forwards only signed identity headers", async () => {
    const fetchImpl = vi.fn(async (input: URL | RequestInfo, init?: RequestInit) => {
      void input;
      void init;
      return Response.json({ ok: true, slots: [] });
    });
    const handler = createConsultationSlotsProxy({
      endpoint: () => "https://crm.example/api/applications",
      proxySecret: () => "test-shared-secret-at-least-32-bytes",
      fetch: fetchImpl as typeof fetch,
      now: () => 1_800_000_000_000,
    });
    const response = await handler(new Request("https://catalog.example/api/consultation-slots", {
      headers: { origin: "https://catalog.example", "x-forwarded-for": "203.0.113.20" },
    }));
    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe("https://crm.example/api/consultation-slots");
    expect(new Headers(init?.headers).get("x-dr-nona-proxy-signature")).toBeTruthy();
  });

  test("fails closed without endpoint or shared secret", async () => {
    const response = await createConsultationSlotsProxy({ endpoint: () => undefined, proxySecret: () => undefined })(
      new Request("https://catalog.example/api/consultation-slots"),
    );
    expect(response.status).toBe(503);
  });
});
