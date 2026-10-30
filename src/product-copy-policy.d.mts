export function hasVerbatimMoldovaCopy(product: {
  sourceCopy?: { method: string; sourceUrl: string; textHash: string };
  sourceUrl: string;
  longDescription: string | null;
  sourceBlocks?: Array<{ type: "paragraph" | "heading"; text: string } | { type: "list"; ordered: boolean; items: string[] }>;
}): boolean;
