import type { ApplicationAttribution } from "../../../shared/applications/application-schema";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
const FIRST_TOUCH_KEY = "attribution_first_touch_v1";
const LAST_TOUCH_KEY = "attribution_last_touch_v1";
const PRODUCT_HISTORY_KEY = "session_product_history";

type UtmKey = (typeof UTM_KEYS)[number];
type Touch = ApplicationAttribution["firstTouch"];

function safeSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function rawValue(value: string | null) {
  const safe = value
    ? Array.from(value)
        .filter((character) => {
          const codePoint = character.codePointAt(0) ?? 0;
          return codePoint > 31 && codePoint !== 127;
        })
        .join("")
        .trim()
        .slice(0, 200)
    : undefined;
  return safe || undefined;
}

function normalizedValue(value: string | null) {
  const safe = rawValue(value)?.normalize("NFKC").replace(/\s+/gu, " ").toLocaleLowerCase("ro-MD").slice(0, 100);
  return safe || undefined;
}

function readJson<T>(storage: Storage, key: string): T | null {
  try {
    const value = storage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // Restricted storage is equivalent to an empty session.
    }
    return null;
  }
}

function safeSetItem(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Attribution is optional and must never prevent page startup or submission.
  }
}

function makeTouch(search: URLSearchParams, capturedAt: string): Touch {
  const values = Object.fromEntries(UTM_KEYS.map((key) => [key, search.get(key)])) as Record<UtmKey, string | null>;
  const source = normalizedValue(values.utm_source);
  const medium = normalizedValue(values.utm_medium);
  const campaign = normalizedValue(values.utm_campaign);
  const content = normalizedValue(values.utm_content);
  const hasCampaign = Boolean(source || medium || campaign || content);
  const raw = {
    source: rawValue(values.utm_source),
    medium: rawValue(values.utm_medium),
    campaign: rawValue(values.utm_campaign),
    content: rawValue(values.utm_content),
  };
  return {
    kind: hasCampaign ? "campaign" : "direct",
    ...(source ? { source } : {}),
    ...(medium ? { medium } : {}),
    ...(campaign ? { campaign } : {}),
    ...(content ? { content } : {}),
    ...(Object.values(raw).some(Boolean) ? { raw } : {}),
    capturedAt,
  };
}

export function readSessionValue(key: string): string | undefined {
  const storage = safeSessionStorage();
  if (!storage) return undefined;
  try {
    return storage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

export function captureUtmParameters(now = new Date()): void {
  const storage = safeSessionStorage();
  if (!storage) return;
  const params = new URLSearchParams(window.location.search);
  const touch = makeTouch(params, now.toISOString());
  if (!readJson<Touch>(storage, FIRST_TOUCH_KEY)) safeSetItem(storage, FIRST_TOUCH_KEY, JSON.stringify(touch));
  if (touch.kind === "campaign") safeSetItem(storage, LAST_TOUCH_KEY, JSON.stringify(touch));
  else if (!readJson<Touch>(storage, LAST_TOUCH_KEY)) safeSetItem(storage, LAST_TOUCH_KEY, JSON.stringify(touch));

  for (const key of UTM_KEYS) {
    const value = normalizedValue(params.get(key));
    if (value) safeSetItem(storage, key, value);
  }
}

export function recordProductView(slug: string): void {
  const storage = safeSessionStorage();
  if (!storage || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) return;
  const existing = readJson<unknown>(storage, PRODUCT_HISTORY_KEY);
  const history = Array.isArray(existing) ? existing.filter((item): item is string => typeof item === "string") : [];
  safeSetItem(
    storage,
    PRODUCT_HISTORY_KEY,
    JSON.stringify([...history.filter((item) => item !== slug), slug].slice(-20)),
  );
}

export function readApprovedProductHistory(allowedProductSlugs: ReadonlySet<string>) {
  const storage = safeSessionStorage();
  if (!storage) return [];
  const rawHistory = readJson<unknown>(storage, PRODUCT_HISTORY_KEY);
  return Array.isArray(rawHistory)
    ? rawHistory
        .filter((slug): slug is string => typeof slug === "string" && allowedProductSlugs.has(slug))
        .slice(-20)
    : [];
}

export function buildApplicationAttribution(input: {
  locale: "ru-MD" | "ro-MD";
  path: string;
  allowedProductSlugs: ReadonlySet<string>;
  consentAccepted: boolean;
}): ApplicationAttribution | undefined {
  if (!input.consentAccepted) return undefined;
  const storage = safeSessionStorage();
  if (!storage) return undefined;
  const firstTouch = readJson<Touch>(storage, FIRST_TOUCH_KEY);
  const lastTouch = readJson<Touch>(storage, LAST_TOUCH_KEY);
  if (!firstTouch || !lastTouch) return undefined;
  const sessionHistory = readApprovedProductHistory(input.allowedProductSlugs);
  const isRomanianPath = input.path === "/ro" || input.path.startsWith("/ro/");
  if ((input.locale === "ro-MD") !== isRomanianPath) return undefined;
  return {
    version: 1,
    consent: "application_submission",
    firstTouch,
    lastTouch,
    entry: { path: input.path.slice(0, 300) || "/", locale: input.locale },
    sessionHistory,
  };
}
