export const REPORT_ONLY_CSP_HEADER: string;
export const ENFORCED_CSP_HEADER: string;
export const REQUIRED_SECURITY_HEADERS: Record<string, string>;
export const EXPECTED_EXTERNAL_ORIGINS: Set<string>;

export type HeaderEntry = {
  key: string;
  value: string;
};

export type HeaderRule = {
  source: string;
  headers: HeaderEntry[];
};

export type SecurityConfiguration = {
  headers: HeaderRule[];
};

export function getGlobalHeaderEntries(
  configuration: SecurityConfiguration
): HeaderEntry[];

export function getGlobalHeaders(
  configuration: SecurityConfiguration,
  options?: { enforceCsp?: boolean }
): Record<string, string>;

export function parseCsp(value: string): Map<string, string[]>;

export function validateSecurityConfiguration(
  configuration: SecurityConfiguration
): string[];
