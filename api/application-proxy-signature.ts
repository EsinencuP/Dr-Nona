import { createHash, createHmac } from "node:crypto";

export const PROXY_SIGNATURE_VERSION = "1";

function sha256(body: ArrayBuffer) {
  return createHash("sha256").update(Buffer.from(body)).digest("base64url");
}

function hmac(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function trustedVercelClientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "address-unavailable";
  return forwarded.split(",", 1)[0]?.trim() || "address-unavailable";
}

export function createApplicationProxySignature(
  request: Request,
  body: ArrayBuffer,
  secret: string,
  now: () => number = Date.now,
) {
  const timestamp = String(Math.floor(now() / 1000));
  const clientKey = hmac(secret, `client:${trustedVercelClientAddress(request)}`);
  const payload = `${PROXY_SIGNATURE_VERSION}:${timestamp}:${clientKey}:${sha256(body)}`;
  return {
    version: PROXY_SIGNATURE_VERSION,
    timestamp,
    clientKey,
    signature: hmac(secret, payload),
  };
}
