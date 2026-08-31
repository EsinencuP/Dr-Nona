import { reportClientError } from "./monitoring";

export type StorageSchema<T> = Readonly<{
  parse: (raw: string) => T | undefined;
  serialize: (value: T) => string;
}>;

type StorageErrorReporter = (
  error: Error,
  context: { operation: "get" | "set"; key: string }
) => void;

type SafeStorageOptions = {
  resolveStorage?: () => Storage;
  reportError?: StorageErrorReporter;
};

export type SafeStorageAdapter = {
  get: <T>(key: string, schema: StorageSchema<T>, fallback: T) => T;
  set: <T>(key: string, value: T, schema: StorageSchema<T>) => boolean;
  resetMemory: () => void;
};

function defaultStorageReporter(
  error: Error,
  context: { operation: "get" | "set"; key: string }
) {
  const diagnostic = new Error(
    `Browser storage ${context.operation} failed for "${context.key}": ${error.message}`
  );
  reportClientError(diagnostic, {
    kind: "storage-error",
    source: "storage",
  });
}

function toError(error: unknown) {
  if (error instanceof Error) return error;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const normalized = new Error(String(error.message));
    if ("name" in error && typeof error.name === "string") {
      normalized.name = error.name;
    }
    return normalized;
  }
  return new Error(String(error));
}

export function createSafeStorageAdapter(
  options: SafeStorageOptions = {}
): SafeStorageAdapter {
  const resolveStorage = options.resolveStorage ?? (() => window.localStorage);
  const reportError = options.reportError ?? defaultStorageReporter;
  const memory = new Map<string, string>();
  const fallbackKeys = new Set<string>();

  function report(
    error: unknown,
    operation: "get" | "set",
    key: string
  ) {
    try {
      reportError(toError(error), { operation, key });
    } catch {
      // Diagnostics must never become a new application failure.
    }
  }

  function parse<T>(
    raw: string,
    key: string,
    schema: StorageSchema<T>,
    fallback: T
  ) {
    try {
      const parsed = schema.parse(raw);
      if (parsed !== undefined) return parsed;
      report(new Error("Stored value failed schema validation"), "get", key);
    } catch (error) {
      report(error, "get", key);
    }
    return fallback;
  }

  return {
    get<T>(key: string, schema: StorageSchema<T>, fallback: T) {
      if (fallbackKeys.has(key)) {
        const inMemory = memory.get(key);
        return inMemory === undefined
          ? fallback
          : parse(inMemory, key, schema, fallback);
      }

      try {
        const persisted = resolveStorage().getItem(key);
        if (persisted === null) {
          memory.delete(key);
          return fallback;
        }
        memory.set(key, persisted);
        return parse(persisted, key, schema, fallback);
      } catch (error) {
        fallbackKeys.add(key);
        report(error, "get", key);
        const inMemory = memory.get(key);
        return inMemory === undefined
          ? fallback
          : parse(inMemory, key, schema, fallback);
      }
    },

    set<T>(key: string, value: T, schema: StorageSchema<T>) {
      let serialized: string;
      try {
        serialized = schema.serialize(value);
        if (schema.parse(serialized) === undefined) {
          throw new Error("Value failed schema validation before persistence");
        }
      } catch (error) {
        report(error, "set", key);
        return false;
      }

      memory.set(key, serialized);
      if (fallbackKeys.has(key)) return false;

      try {
        resolveStorage().setItem(key, serialized);
        return true;
      } catch (error) {
        fallbackKeys.add(key);
        report(error, "set", key);
        return false;
      }
    },

    resetMemory() {
      memory.clear();
      fallbackKeys.clear();
    },
  };
}

export type SupportedLocale = "ru" | "ro";

export const localeSchema: StorageSchema<SupportedLocale> = {
  parse: (raw) => raw === "ru" || raw === "ro" ? raw : undefined,
  serialize: (value) => value,
};

export const ruLocaleSchema = localeSchema;

export const selectionSchema: StorageSchema<string[]> = {
  parse(raw) {
    const value: unknown = JSON.parse(raw);
    if (
      !Array.isArray(value) ||
      value.length > 100 ||
      !value.every(
        (slug) =>
          typeof slug === "string" &&
          slug.length > 0 &&
          slug.length <= 200 &&
          slug.trim() === slug
      )
    ) {
      return undefined;
    }
    return [...new Set(value)];
  },
  serialize: (value) => JSON.stringify(value),
};

export const safeLocalStorage = createSafeStorageAdapter();
