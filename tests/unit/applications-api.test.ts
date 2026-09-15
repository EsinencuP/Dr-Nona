import { describe, expect, test, vi } from "vitest";
import { createApplicationsProxy } from "../../api/applications";

const applicationBody = {
  locale: "ru-MD",
  type: "consultation",
  firstName: "Ana",
};
const proxySecret = "test-shared-secret-at-least-32-bytes";

function request(
  body: unknown = applicationBody,
  overrides: { method?: string; headers?: Record<string, string> } = {}
) {
  const method = overrides.method ?? "POST";
  return new Request("https://catalog.example/api/applications", {
    method,
    headers: {
      Origin: "https://catalog.example",
      "Content-Type": "application/json",
      "Idempotency-Key": "attempt-1",
      "x-forwarded-for": "203.0.113.20",
      ...overrides.headers,
    },
    ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
  });
}

describe("POST /api/applications proxy", () => {
  test("forwards only the application contract to the configured CRM endpoint", async () => {
    let forwarded:
      | {
          input: Parameters<typeof fetch>[0];
          init: Parameters<typeof fetch>[1];
        }
      | undefined;
    let callCount = 0;
    const upstreamFetch: typeof fetch = async (input, init) => {
      callCount += 1;
      forwarded = { input, init };
      return Response.json(
        {
          ok: true,
          requestId: "request-1",
          delivery: { telegram: "sent" },
        },
        { status: 201 }
      );
    };
    const handler = createApplicationsProxy({
      endpoint: () => "https://crm.example/api/applications",
      proxySecret: () => proxySecret,
      fetch: upstreamFetch,
      now: () => 1_800_000_000_000,
    });

    const response = await handler(request());

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      ok: true,
      requestId: "request-1",
    });
    expect(callCount).toBe(1);
    expect(forwarded).toBeDefined();
    const { input, init } = forwarded!;
    expect(String(input)).toBe("https://crm.example/api/applications");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("origin")).toBe(
      "https://catalog.example"
    );
    expect(new Headers(init?.headers).get("idempotency-key")).toBe(
      "attempt-1"
    );
    expect(new Headers(init?.headers).get("x-forwarded-for")).toBeNull();
    expect(new Headers(init?.headers).get("x-dr-nona-proxy-version")).toBe("1");
    expect(new Headers(init?.headers).get("x-dr-nona-proxy-timestamp")).toBe("1800000000");
    expect(new Headers(init?.headers).get("x-dr-nona-client-key")).toBe(
      "tF6F8G4h8B5npHadMGeGvVvVoCOVu5u4JLz-UAIars8"
    );
    expect(new Headers(init?.headers).get("x-dr-nona-proxy-signature")).toBe(
      "0v55Hs8WlyNFhC7uOZTXMG_3DE3jyLnK_5YWzAwNG_w"
    );
    expect(JSON.parse(new TextDecoder().decode(init?.body as ArrayBuffer))).toEqual(
      applicationBody
    );
  });

  test("returns a controlled error when the CRM endpoint is unavailable", async () => {
    const handler = createApplicationsProxy({
      endpoint: () => "https://crm.example/api/applications",
      proxySecret: () => proxySecret,
      fetch: vi.fn(async () => {
        throw new Error("offline");
      }) as typeof fetch,
    });

    const response = await handler(request());
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      code: "UPSTREAM_UNAVAILABLE",
    });
  });

  test("fails closed when the CRM destination is missing or invalid", async () => {
    for (const endpoint of [undefined, "file:///tmp/applications"]) {
      const response = await createApplicationsProxy({ endpoint: () => endpoint, proxySecret: () => proxySecret })(
        request()
      );
      expect(response.status).toBe(503);
    }
  });

  test("rejects unsupported methods, content types and oversized bodies", async () => {
    const handler = createApplicationsProxy({
      endpoint: () => "https://crm.example/api/applications",
      proxySecret: () => proxySecret,
    });
    const methodResponse = await handler(
      request(undefined, { method: "GET" })
    );
    expect(methodResponse.status).toBe(405);
    expect(methodResponse.headers.get("Allow")).toBe("POST");

    const contentTypeResponse = await handler(
      request(applicationBody, { headers: { "Content-Type": "text/plain" } })
    );
    expect(contentTypeResponse.status).toBe(400);

    const oversizedResponse = await handler(
      request({ value: "x".repeat(17 * 1024) })
    );
    expect(oversizedResponse.status).toBe(413);
  });

  test("fails closed when the shared proxy secret is missing", async () => {
    const response = await createApplicationsProxy({
      endpoint: () => "https://crm.example/api/applications",
      proxySecret: () => undefined,
    })(request());
    expect(response.status).toBe(503);
  });
});
