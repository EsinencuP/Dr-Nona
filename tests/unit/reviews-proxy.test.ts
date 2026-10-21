import { describe, expect, test, vi } from "vitest";
import { createReviewsProxy } from "../../api/reviews";
import { createApplicationProxySignature } from "../../api/application-proxy-signature";

describe("reviews proxy", () => {
  test("fails closed without configuration", async () => {
    const handler = createReviewsProxy({ endpoint: () => "", secret: () => "" });
    expect((await handler(new Request("https://catalog.example/api/reviews"))).status).toBe(503);
  });
  test("signs reviews with a separate purpose and forwards filter, origin and idempotency", async () => {
    const upstream = vi
      .fn()
      .mockResolvedValue(Response.json({ ok: true, status: "PENDING" }, { status: 202 }));
    const handler = createReviewsProxy({
      endpoint: () => "https://crm.example/api/applications",
      secret: () => "test",
      fetch: upstream,
      now: () => 1800000000000,
    });
    const request = new Request("https://catalog.example/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": "unique-review-key-123" },
      body: JSON.stringify({ body: "review" }),
    });
    const expected = createApplicationProxySignature(
      request,
      await request.clone().arrayBuffer(),
      "test:reviews:POST:",
      () => 1800000000000,
    );
    const response = await handler(request);
    expect(response.status).toBe(202);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const [url, options] = upstream.mock.calls[0];
    expect(String(url)).toBe("https://crm.example/api/reviews");
    expect(options.headers.get("origin")).toBe("https://catalog.example");
    expect(options.headers.get("idempotency-key")).toBe("unique-review-key-123");
    expect(options.headers.get("x-dr-nona-proxy-signature")).toBe(expected.signature);
    await handler(new Request("https://catalog.example/api/reviews?product=lord-deodorant&page=2"));
    expect(String(upstream.mock.calls[1][0])).toBe(
      "https://crm.example/api/reviews?product=lord-deodorant&page=2",
    );
  });
  test("rejects oversized bodies and reports upstream failure", async () => {
    const upstream = vi.fn().mockRejectedValue(new Error("offline"));
    const handler = createReviewsProxy({
      endpoint: () => "https://crm.example/api/reviews",
      secret: () => "test",
      fetch: upstream,
    });
    expect(
      (
        await handler(
          new Request("https://catalog.example/api/reviews", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "x".repeat(17000),
          }),
        )
      ).status,
    ).toBe(413);
    expect(upstream).not.toHaveBeenCalled();
    expect((await handler(new Request("https://catalog.example/api/reviews"))).status).toBe(502);
  });
});
