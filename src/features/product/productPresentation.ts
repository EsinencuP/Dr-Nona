// The caller supplies only publishable copy after the existing claims gate.
// Missing descriptions stay absent instead of being synthesized from other fields.
export function buildProductOverview(product: { longDescription: string }) {
  return product.longDescription.replace(/\s+/gu, " ").trim();
}
