export type ClientErrorKind =
  | "malformed-route"
  | "render-error"
  | "storage-error";

export type ClientErrorRecord = {
  id: string;
  timestamp: string;
  kind: ClientErrorKind;
  source: "router" | "react" | "storage";
  message: string;
  pathname: string;
  componentStack?: string;
};

type MonitoringContext = Omit<ClientErrorRecord, "id" | "timestamp" | "message" | "pathname">;

declare global {
  interface Window {
    __DR_NONA_MONITORING__?: {
      captureException: (error: Error, record: ClientErrorRecord) => void;
    };
  }
}

const STORAGE_KEY = "drnona:client-errors";
const MAX_RECORDS = 20;
let lastFingerprint = "";
let lastReportedAt = 0;

function readRecords() {
  try {
    const value = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value as ClientErrorRecord[] : [];
  } catch {
    return [];
  }
}

export function getClientErrorRecords() {
  return readRecords();
}

export function reportClientError(
  receivedError: unknown,
  context: MonitoringContext
) {
  const error = receivedError instanceof Error
    ? receivedError
    : new Error(String(receivedError));
  const pathname = window.location.pathname.slice(0, 500);
  const fingerprint = `${context.kind}:${pathname}:${error.message}`;
  const now = Date.now();
  if (fingerprint === lastFingerprint && now - lastReportedAt < 1000) return;
  lastFingerprint = fingerprint;
  lastReportedAt = now;

  const record: ClientErrorRecord = {
    id: globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date(now).toISOString(),
    kind: context.kind,
    source: context.source,
    message: error.message.slice(0, 500),
    pathname,
    ...(context.componentStack
      ? { componentStack: context.componentStack.slice(0, 2000) }
      : {}),
  };

  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...readRecords(), record].slice(-MAX_RECORDS))
    );
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }

  window.dispatchEvent(new CustomEvent("drnona:error", { detail: record }));

  try {
    window.__DR_NONA_MONITORING__?.captureException(error, record);
  } catch {
    // Monitoring transport failures must never break the customer experience.
  }
}
