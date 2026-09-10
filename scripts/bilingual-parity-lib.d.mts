export function leafFields(value: unknown, prefix?: string): Record<string, unknown>;
export function keysetDifference(ru: unknown, ro: unknown): { missingRo: string[]; missingRu: string[] };
export function readLocaleMessages(file: string, name: string): Record<string, string>;
export function inlineLocaleResources(root?: string): Array<{file: string; line: number; ru: unknown; ro: unknown}>;
export function productFieldStatus(ru: string | null, ro: string | null, field: string): string;
