import { safeLocalStorage, type StorageSchema } from "../../app/storage";

export const PRIVACY_CHOICE_KEY = "drnona-privacy-choice-v1";
export const PRIVACY_CHOICE_EVENT = "drnona:privacy-choice";
export const PRIVACY_CHOICE_LIFETIME = 180 * 24 * 60 * 60 * 1000;
export type PrivacyChoice = "accepted" | "rejected";
type ChoiceRecord = { version: 1; choice: PrivacyChoice; decidedAt: number; expiresAt: number };

const schema: StorageSchema<ChoiceRecord | null> = {
  parse(raw) {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return undefined;
    if (!("version" in value && value.version === 1 && "choice" in value &&
      (value.choice === "accepted" || value.choice === "rejected") &&
      "decidedAt" in value && typeof value.decidedAt === "number" && Number.isFinite(value.decidedAt) &&
      "expiresAt" in value && typeof value.expiresAt === "number" && Number.isFinite(value.expiresAt))) return undefined;
    if (value.expiresAt !== value.decidedAt + PRIVACY_CHOICE_LIFETIME) return undefined;
    return { version: 1, choice: value.choice, decidedAt: value.decidedAt, expiresAt: value.expiresAt };
  },
  serialize: (value) => JSON.stringify(value),
};

export function getPrivacyChoice(): PrivacyChoice | "pending" {
  const record = safeLocalStorage.get(PRIVACY_CHOICE_KEY, schema, null);
  if (!record || record.expiresAt <= Date.now() || record.decidedAt > Date.now() + 60_000) return "pending";
  return record.choice;
}

export function setPrivacyChoice(choice: PrivacyChoice) {
  const decidedAt = Date.now();
  safeLocalStorage.set(PRIVACY_CHOICE_KEY, {
    version: 1, choice, decidedAt, expiresAt: decidedAt + PRIVACY_CHOICE_LIFETIME,
  }, schema);
  window.dispatchEvent(new Event(PRIVACY_CHOICE_EVENT));
}

export function subscribePrivacyChoice(callback: () => void) {
  const storageChanged = (event: StorageEvent) => {
    if (event.key === PRIVACY_CHOICE_KEY || event.key === null) callback();
  };
  window.addEventListener(PRIVACY_CHOICE_EVENT, callback);
  window.addEventListener("storage", storageChanged);
  return () => {
    window.removeEventListener(PRIVACY_CHOICE_EVENT, callback);
    window.removeEventListener("storage", storageChanged);
  };
}

export function openPrivacyPreferences() {
  window.dispatchEvent(new Event("drnona:open-privacy"));
}
