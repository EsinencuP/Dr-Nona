// Owner decision 2026-10-30: reproduce Moldova originals without editorial
// shortening. This is a provenance policy, never medical/legal approval.
export function hasVerbatimMoldovaCopy(product) {
  return product.sourceCopy?.method === "verbatim-md-no-emoji" &&
    product.sourceCopy.sourceUrl === product.sourceUrl &&
    /^https:\/\/www\.drnona\.md\/[^/?#]+$/u.test(product.sourceUrl) &&
    Array.isArray(product.sourceBlocks) && product.sourceBlocks.length > 0 &&
    product.sourceBlocks.flatMap(block => block.type === "list" ? block.items : [block.text]).join("\n\n") === product.longDescription;
}
