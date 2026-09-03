const MAX_PROXY_BODY_BYTES = 16 * 1024;
const PROXY_TIMEOUT_MS = 10_000;

export type ApplicationsProxyDependencies = {
  endpoint?: () => string | undefined;
  fetch?: typeof fetch;
};

function jsonResponse(body: unknown, status: number, headers: Record<string, string> = {}) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function readEndpoint(dependencies: ApplicationsProxyDependencies) {
  const value =
    dependencies.endpoint?.() ?? process.env.CRM_APPLICATIONS_API_URL;
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

export function createApplicationsProxy(
  dependencies: ApplicationsProxyDependencies = {}
) {
  return async function applicationsProxy(request: Request) {
    if (request.method !== "POST") {
      return jsonResponse({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405, {
        Allow: "POST",
      });
    }

    const endpoint = readEndpoint(dependencies);
    if (!endpoint) {
      return jsonResponse({ ok: false, code: "SERVICE_UNAVAILABLE" }, 503);
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      return jsonResponse({ ok: false, code: "INVALID_CONTENT_TYPE" }, 400);
    }

    const body = await request.arrayBuffer();
    if (body.byteLength > MAX_PROXY_BODY_BYTES) {
      return jsonResponse({ ok: false, code: "PAYLOAD_TOO_LARGE" }, 413);
    }

    const headers = new Headers({
      "Content-Type": "application/json",
    });
    for (const name of ["idempotency-key", "origin", "x-forwarded-for", "x-real-ip"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    try {
      const upstream = await (dependencies.fetch ?? fetch)(endpoint, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
      });
      const responseBody = await upstream.arrayBuffer();
      const retryAfter = upstream.headers.get("retry-after");
      return new Response(responseBody, {
        status: upstream.status,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type":
            upstream.headers.get("content-type") ??
            "application/json; charset=utf-8",
          ...(retryAfter ? { "Retry-After": retryAfter } : {}),
        },
      });
    } catch {
      return jsonResponse({ ok: false, code: "UPSTREAM_UNAVAILABLE" }, 502);
    }
  };
}

const handler = createApplicationsProxy();

export default {
  fetch: handler,
};
