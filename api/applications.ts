import { createApplicationProxySignature } from "./application-proxy-signature.js";
import { validateApplicationInput } from "../shared/applications/application-schema.js";
import products from "../src/data/products.json" with { type: "json" };

const productsBySlug = new Map(products.filter(product => product.publicationStatus === "published").map(product => [product.slug, product]));

const MAX_PROXY_BODY_BYTES = 16 * 1024;
const PROXY_TIMEOUT_MS = 10_000;

export type ApplicationsProxyDependencies = {
  endpoint?: () => string | undefined;
  proxySecret?: () => string | undefined;
  fetch?: typeof fetch;
  now?: () => number;
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
    const proxySecret = dependencies.proxySecret?.() ?? process.env.CONTACT_PROXY_SHARED_SECRET;
    if (!endpoint || !proxySecret?.trim()) {
      return jsonResponse({ ok: false, code: "SERVICE_UNAVAILABLE" }, 503);
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      return jsonResponse({ ok: false, code: "INVALID_CONTENT_TYPE" }, 400);
    }

    const originalBody = await request.arrayBuffer();
    if (originalBody.byteLength > MAX_PROXY_BODY_BYTES) {
      return jsonResponse({ ok: false, code: "PAYLOAD_TOO_LARGE" }, 413);
    }

    let raw: unknown;
    try { raw = JSON.parse(new TextDecoder().decode(originalBody)); }
    catch { return jsonResponse({ ok: false, code: "INVALID_JSON" }, 400); }
    const validation = validateApplicationInput(raw, { allowedProductSlugs: new Set(productsBySlug.keys()) });
    if (!validation.success) return jsonResponse({ ok: false, code: "VALIDATION_ERROR", fieldErrors: validation.fieldErrors }, 400);
    const order = validation.data;
    const origin = new URL(request.url).origin;
    // Names, SKUs and links are canonical server data, never trusted client text.
    const items = (order.items ?? order.productSlugs.map(slug => ({ slug, quantity: 1 }))).map(item => {
      const product = productsBySlug.get(item.slug)!;
      return { slug: item.slug, quantity: item.quantity, officialName: product.officialName, sku: product.sku,
        url: new URL(`/${order.locale === "ro-MD" ? "ro" : "ru"}/product/${product.slug}`, origin).href };
    });
    const body = new TextEncoder().encode(JSON.stringify({ ...order, items })).buffer;

    const headers = new Headers({
      "Content-Type": "application/json",
    });
    for (const name of ["idempotency-key", "origin"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const signed = createApplicationProxySignature(request, body, proxySecret, dependencies.now);
    headers.set("x-dr-nona-proxy-version", signed.version);
    headers.set("x-dr-nona-proxy-timestamp", signed.timestamp);
    headers.set("x-dr-nona-client-key", signed.clientKey);
    headers.set("x-dr-nona-proxy-signature", signed.signature);

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
