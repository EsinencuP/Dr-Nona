import {
  createSafeStorageAdapter,
  type StorageSchema,
} from "../../app/storage";

const sessionTextSchema: StorageSchema<string> = {
  parse: (raw) => raw,
  serialize: (value) => value,
};

export const safeSessionStorage = createSafeStorageAdapter({
  resolveStorage: () => window.sessionStorage,
});

export function readSessionValue(key: string): string | undefined {
  const value = safeSessionStorage.get(key, sessionTextSchema, "");
  return value || undefined;
}

/**
 * Captures UTM parameters from the current URL for the current browser session.
 * Existing values are replaced only when the URL contains a non-empty value.
 */
export function captureUtmParameters(): void {
  const params = new URLSearchParams(window.location.search);
  const utmKeys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
  ] as const;

  for (const key of utmKeys) {
    const value = params.get(key);
    if (value) safeSessionStorage.set(key, value, sessionTextSchema);
  }
}
