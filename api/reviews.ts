import { createApplicationProxySignature } from "./application-proxy-signature.js";

type Dependencies = {
  endpoint?: () => string | undefined;
  secret?: () => string | undefined;
  fetch?: typeof fetch;
  now?: () => number;
};

export function createReviewsProxy(dependencies: Dependencies = {}) {
  return async (request: Request) => {
    const reply = (code: string, status: number) =>
      Response.json({ ok: false, code }, { status, headers: { "Cache-Control": "no-store" } });
    if (!["GET", "POST"].includes(request.method))
      return new Response(null, {
        status: 405,
        headers: { Allow: "GET, POST", "Cache-Control": "no-store" },
      });
    const value =
      dependencies.endpoint?.() ??
      process.env.CRM_REVIEWS_API_URL ??
      process.env.CRM_APPLICATIONS_API_URL;
    const secret = dependencies.secret?.() ?? process.env.CONTACT_PROXY_SHARED_SECRET;
    if (!value || !secret) return reply("SERVICE_UNAVAILABLE", 503);
    let endpoint: URL;
    try {
      endpoint = new URL(value);
      if (!["http:", "https:"].includes(endpoint.protocol))
        return reply("SERVICE_UNAVAILABLE", 503);
      endpoint.pathname = endpoint.pathname.replace(/\/applications$/u, "/reviews");
      const incoming = new URL(request.url);
      endpoint.search = incoming.search;
      if (
        request.method === "POST" &&
        !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")
      )
        return reply("INVALID_CONTENT_TYPE", 400);
      const body = request.method === "POST" ? await request.arrayBuffer() : new ArrayBuffer(0);
      if (body.byteLength > 16 * 1024) return reply("PAYLOAD_TOO_LARGE", 413);
      const signed = createApplicationProxySignature(
        request,
        body,
        `${secret}:reviews:${request.method}:${endpoint.search}`,
        dependencies.now,
      );
      const headers = new Headers({
        "Content-Type": "application/json",
        origin: request.headers.get("origin") ?? incoming.origin,
        "x-dr-nona-proxy-version": signed.version,
        "x-dr-nona-proxy-timestamp": signed.timestamp,
        "x-dr-nona-client-key": signed.clientKey,
        "x-dr-nona-proxy-signature": signed.signature,
      });
      const key = request.headers.get("idempotency-key");
      if (key) headers.set("idempotency-key", key);
      const response = await (dependencies.fetch ?? fetch)(endpoint, {
        method: request.method,
        headers,
        ...(request.method === "POST" ? { body } : {}),
        signal: AbortSignal.timeout(10_000),
      });
      return new Response(await response.arrayBuffer(), {
        status: response.status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          ...(response.headers.get("retry-after")
            ? { "Retry-After": response.headers.get("retry-after")! }
            : {}),
        },
      });
    } catch {
      return reply("UPSTREAM_UNAVAILABLE", 502);
    }
  };
}

export default { fetch: createReviewsProxy() };
