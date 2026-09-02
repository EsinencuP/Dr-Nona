import { describe, expect, it } from "vitest";
import {
  buildProductOverview,
  summarizeProductField,
} from "../../src/features/product/productPresentation";

const product = {
  officialName: "Dynamic Cream",
  category: "Кремы",
  longDescription: "",
  ingredients: "Соль Мёртвого моря, экстракт ромашки, масло жожобы, алоэ вера, витамин Е.",
  howToUse: "Нанести лёгкими движениями на чистую кожу.",
};

describe("product presentation copy", () => {
  it("keeps a publishable source description intact", () => {
    expect(
      buildProductOverview(
        { ...product, longDescription: "  Подробное   описание продукта.  " },
        "ru"
      )
    ).toBe("Подробное описание продукта.");
  });

  it("builds a useful neutral overview from publishable source fields", () => {
    const overview = buildProductOverview(product, "ru");

    expect(overview).toContain("Dynamic Cream представлен в каталоге Dr. Nona Moldova");
    expect(overview).toContain("Соль Мёртвого моря, экстракт ромашки, масло жожобы, алоэ вера");
    expect(overview).toContain("Нанести лёгкими движениями на чистую кожу");
  });

  it("uses Romanian framing for the Romanian route", () => {
    const overview = buildProductOverview(
      {
        ...product,
        category: "Creme",
        ingredients: "Sare din Marea Moartă, extract de mușețel",
        howToUse: "Se aplică pe pielea curată.",
      },
      "ro"
    );

    expect(overview).toContain("este prezentat în catalogul Dr. Nona Moldova");
    expect(overview).toContain("Modul de utilizare indicat de producător");
  });

  it("truncates long supporting details on a word boundary", () => {
    const summary = summarizeProductField("Ingredient ".repeat(40), 90);

    expect(summary.endsWith("…")).toBe(true);
    expect(summary.length).toBeLessThanOrEqual(91);
  });
});
