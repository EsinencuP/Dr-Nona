import { createApplicationProxySignature } from "./application-proxy-signature.js";

type Dependencies = {
  endpoint?: () => string | undefined;
  proxySecret?: () => string | undefined;
  fetch?: typeof fetch;
  now?: () => number;
};

function upstreamUrl(value: string | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.pathname.endsWith("/applications")) url.pathname = url.pathname.replace(/\/applications$/u, "/consultation-slots");
    return url;
  } catch {
    return null;
  }
}

export function createConsultationSlotsProxy(dependencies: Dependencies = {}) {
  return async function consultationSlotsProxy(request: Request) {
    if (request.method !== "GET") return Response.json({ ok: false, code: "METHOD_NOT_ALLOWED" }, { status: 405 });
    const endpoint = upstreamUrl(
      dependencies.endpoint?.() ?? process.env.CRM_CONSULTATION_SLOTS_API_URL ?? process.env.CRM_APPLICATIONS_API_URL,
    );
    const secret = dependencies.proxySecret?.() ?? process.env.CONTACT_PROXY_SHARED_SECRET;
    if (!endpoint || !secret?.trim()) return Response.json({ ok: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
    const body = new ArrayBuffer(0);
    const signed = createApplicationProxySignature(request, body, secret, dependencies.now);
    const headers = new Headers({
      origin: request.headers.get("origin") ?? new URL(request.url).origin,
      "x-dr-nona-proxy-version": signed.version,
      "x-dr-nona-proxy-timestamp": signed.timestamp,
      "x-dr-nona-client-key": signed.clientKey,
      "x-dr-nona-proxy-signature": signed.signature,
    });
    try {
      const response = await (dependencies.fetch ?? fetch)(endpoint, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(8_000),
      });
      return new Response(await response.arrayBuffer(), {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("content-type") ?? "application/json; charset=utf-8",
          "Cache-Control": response.ok ? "private, max-age=30" : "no-store",
        },
      });
    } catch {
      return Response.json({ ok: false, code: "UPSTREAM_UNAVAILABLE" }, { status: 502 });
    }
  };
}

export default { fetch: createConsultationSlotsProxy() };
