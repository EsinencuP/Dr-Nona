import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  getGlobalHeaders,
  validateSecurityConfiguration,
} from "../../scripts/security-headers-lib.mjs";

const validConfiguration = JSON.parse(
  readFileSync("vercel.json", "utf8")
);

function changedConfiguration(transform: (value: string) => string) {
  const configuration = structuredClone(validConfiguration);
  const csp = configuration.headers[0].headers.find(
    ({ key }: { key: string }) =>
      key === "Content-Security-Policy"
  );
  csp.value = transform(csp.value);
  return configuration;
}

describe("security header deployment contract", () => {
  test("accepts the version-controlled Vercel policy", () => {
    expect(validateSecurityConfiguration(validConfiguration)).toEqual([]);
  });

  test("ships the validated CSP in enforcement mode", () => {
    const headers = getGlobalHeaders(validConfiguration);

    expect(headers["Content-Security-Policy"]).toContain(
      "default-src 'self'"
    );
    expect(headers).not.toHaveProperty("Content-Security-Policy-Report-Only");
  });

  test("rejects unsafe-eval", () => {
    const errors = validateSecurityConfiguration(
      changedConfiguration((value) =>
        value.replace("script-src 'self'", "script-src 'self' 'unsafe-eval'")
      )
    );

    expect(errors).toContain(
      "CSP contains prohibited broad source 'unsafe-eval'."
    );
  });

  test("rejects broad schemes and unapproved external origins", () => {
    const broadErrors = validateSecurityConfiguration(
      changedConfiguration((value) =>
        value.replace("img-src 'self'", "img-src 'self' https:")
      )
    );
    const originErrors = validateSecurityConfiguration(
      changedConfiguration((value) =>
        value.replace(
          "img-src 'self'",
          "img-src 'self' https://tracking.example"
        )
      )
    );

    expect(broadErrors).toContain(
      "CSP contains prohibited broad source https:."
    );
    expect(originErrors).toContain(
      "CSP contains an unapproved external origin: https://tracking.example."
    );
  });

  test("rejects a missing frame restriction", () => {
    const errors = validateSecurityConfiguration(
      changedConfiguration((value) =>
        value.replace("frame-ancestors 'none'; ", "")
      )
    );

    expect(errors).toContain(
      "frame-ancestors must be exactly 'none'; received (missing)."
    );
  });
});
