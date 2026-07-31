import type { IncomingMessage, ServerResponse } from "node:http";
import applicationsHandler from "../../api/applications";

function requestBody(request: IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

export async function handleDevApplicationRequest(
  request: IncomingMessage,
  response: ServerResponse
) {
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  if (pathname !== "/api/applications") return false;

  try {
    const headers = new Headers();
    for (const [name, value] of Object.entries(request.headers)) {
      if (Array.isArray(value)) {
        for (const item of value) headers.append(name, item);
      } else if (value !== undefined) {
        headers.set(name, value);
      }
    }
    const method = request.method ?? "GET";
    const body =
      method === "GET" || method === "HEAD"
        ? undefined
        : (await requestBody(request)).toString("utf8");
    const host = request.headers.host ?? "127.0.0.1:4173";
    const result = await applicationsHandler.fetch(
      new Request(`http://${host}${request.url ?? "/api/applications"}`, {
        method,
        headers,
        body,
      })
    );
    response.statusCode = result.status;
    result.headers.forEach((value, name) => response.setHeader(name, value));
    response.end(Buffer.from(await result.arrayBuffer()));
  } catch {
    response.statusCode = 500;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.end(JSON.stringify({ ok: false, code: "SERVER_ERROR" }));
  }
  return true;
}
