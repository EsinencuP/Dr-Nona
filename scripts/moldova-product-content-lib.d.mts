import type { ProductSourceBlock } from "../src/data";
export function removeEmoji(value: string): string;
export function normalizeWhitespace(value: string): string;
export function cleanSourceText(value: string): string;
export function blocksText(blocks: ProductSourceBlock[]): string;
export function sourceIdentity(path: string): string;
export function discoverLinks(html: string, baseUrl: string, kind: "product" | "category"): string[];
export function parseMoldovaProductHtml(html: string): {
  title: string;
  sourceBlocks: ProductSourceBlock[];
  longDescription: string;
  shortDescription: string;
  plainSourceText: string;
};
