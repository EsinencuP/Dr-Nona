export const REPORT_ONLY_CSP_HEADER =
  "Content-Security-Policy-Report-Only";
export const ENFORCED_CSP_HEADER = "Content-Security-Policy";

export const REQUIRED_SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Cross-Origin-Opener-Policy": "same-origin",
};

export const EXPECTED_EXTERNAL_ORIGINS = new Set([
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
  "https://res.cloudinary.com",
]);

export function getGlobalHeaderEntries(configuration) {
  const globalRule = configuration?.headers?.find(
    (rule) => rule.source === "/(.*)"
  );
  return globalRule?.headers ?? [];
}

export function getGlobalHeaders(configuration, { enforceCsp = false } = {}) {
  const headers = Object.fromEntries(
    getGlobalHeaderEntries(configuration).map(({ key, value }) => [key, value])
  );
  if (enforceCsp && headers[REPORT_ONLY_CSP_HEADER]) {
    headers[ENFORCED_CSP_HEADER] = headers[REPORT_ONLY_CSP_HEADER];
    delete headers[REPORT_ONLY_CSP_HEADER];
  }
  return headers;
}

export function parseCsp(value) {
  return new Map(
    value
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [directive, ...sources] = part.split(/\s+/);
        return [directive, sources];
      })
  );
}

function addError(errors, message) {
  errors.push(message);
}

export function validateSecurityConfiguration(configuration) {
  const errors = [];
  const headers = getGlobalHeaders(configuration);
  const csp = headers[REPORT_ONLY_CSP_HEADER];

  if (!csp) {
    addError(errors, `${REPORT_ONLY_CSP_HEADER} is missing from the global rule.`);
    return errors;
  }

  for (const [key, expected] of Object.entries(REQUIRED_SECURITY_HEADERS)) {
    if (headers[key] !== expected) {
      addError(errors, `${key} must equal "${expected}".`);
    }
  }

  const directives = parseCsp(csp);
  const requiredDirectives = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "frame-src": ["'none'"],
    "form-action": ["'self'"],
    "script-src": ["'self'"],
  };
  for (const [directive, expected] of Object.entries(requiredDirectives)) {
    const actual = directives.get(directive);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      addError(
        errors,
        `${directive} must be exactly ${expected.join(" ")}; received ${
          actual?.join(" ") ?? "(missing)"
        }.`
      );
    }
  }

  const allSources = [...directives.values()].flat();
  for (const prohibited of ["'unsafe-eval'", "*", "http:", "https:"]) {
    if (allSources.includes(prohibited)) {
      addError(errors, `CSP contains prohibited broad source ${prohibited}.`);
    }
  }
  if (directives.get("script-src")?.includes("'unsafe-inline'")) {
    addError(errors, "script-src must not contain 'unsafe-inline'.");
  }

  const configuredExternalOrigins = new Set(
    allSources.filter((source) => /^https:\/\/[^/]+$/.test(source))
  );
  for (const origin of configuredExternalOrigins) {
    if (!EXPECTED_EXTERNAL_ORIGINS.has(origin)) {
      addError(errors, `CSP contains an unapproved external origin: ${origin}.`);
    }
  }
  for (const origin of EXPECTED_EXTERNAL_ORIGINS) {
    if (!configuredExternalOrigins.has(origin)) {
      addError(errors, `CSP does not include required runtime origin: ${origin}.`);
    }
  }

  const cacheRules = new Map(
    configuration.headers
      .filter((rule) => rule.source !== "/(.*)")
      .map((rule) => [
        rule.source,
        Object.fromEntries(rule.headers.map(({ key, value }) => [key, value])),
      ])
  );
  if (
    cacheRules.get("/assets/(.*)")?.["Cache-Control"] !==
    "public, max-age=31536000, immutable"
  ) {
    addError(errors, "Hashed /assets files require immutable one-year caching.");
  }
  for (const source of ["/brand/(.*)", "/products/(.*)"]) {
    if (!cacheRules.get(source)?.["Cache-Control"]?.includes("max-age=86400")) {
      addError(errors, `${source} requires bounded version-controlled caching.`);
    }
  }

  return errors;
}
