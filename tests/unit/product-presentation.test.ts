import { describe, expect, it } from "vitest";
import { buildProductOverview } from "../../src/features/product/productPresentation";

const product = {
  officialName: "Dynamic Cream",
  category: "Кремы",
  longDescription: "",
  ingredients: "Соль Мёртвого моря, экстракт ромашки, масло жожобы, алоэ вера.",
  howToUse: "Нанести лёгкими движениями на чистую кожу.",
};

describe("product presentation copy", () => {
  it("keeps a publishable source description intact", () => {
    expect(buildProductOverview({ ...product, longDescription: "  Подробное   описание продукта.  " })).toBe("Подробное описание продукта.");
  });

  it("does not synthesize a description from identity, ingredients or usage", () => {
    expect(buildProductOverview(product)).toBe("");
  });

  it("keeps Romanian copy without adding a template introduction", () => {
    expect(buildProductOverview({ longDescription: "Îngrijire delicată pentru piele." })).toBe("Îngrijire delicată pentru piele.");
  });

  it("keeps a full source description without truncating it into teaser copy", () => {
    const longDescription = "Описание продукта без сокращений. ".repeat(40).trim();
    expect(buildProductOverview({ longDescription })).toBe(longDescription);
  });
});
