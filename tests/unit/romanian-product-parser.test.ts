import { describe, expect, test } from "vitest";
// @ts-expect-error Framework-neutral JavaScript content parser.
import { assessRomanianProductCopy, parseRomanianProductHtml } from "../../scripts/romanian-product-content-lib.mjs";

const page = (copy: string) => `<html><body><div class="tn-atom" field="tn_text_1">${copy}</div></body></html>`;

describe("Romanian product semantic parser", () => {
  test("keeps composition and usage inside their explicit boundaries", () => {
    const result = parseRomanianProductHtml(page([
      "DYNAMIC CREAM Dr. Nona<br><br>",
      "Cremă universală pentru îngrijirea zilnică a pielii. Oferă hidratare și confort pentru întreaga familie.<br><br>",
      "Compoziție:<br>Minerale din Marea Moartă<br>Ulei de jojoba și avocado<br><br>",
      "Utilizați zilnic:<br>aplicați pe pielea curată<br>masați ușor până la absorbție<br><br>",
      "Cu DYNAMIC CREAM, îngrijirea zilnică devine simplă și plăcută pentru fiecare membru al familiei.",
    ].join("")));
    expect(result.ingredients).toBe("Minerale din Marea Moartă. Ulei de jojoba și avocado");
    expect(result.howToUse).toBe("aplicați pe pielea curată. masați ușor până la absorbție");
    expect(result.ingredients).not.toContain("Utilizați");
    expect(result.howToUse).not.toContain("Cu DYNAMIC");
  });

  test("returns null instead of inventing sections from promotional prose", () => {
    const result = parseRomanianProductHtml(page(
      "HAND AND NAIL CREAM Dr. Nona — Mâinile tale merită cea mai bună îngrijire și protecție în fiecare zi.<br>" +
      "Formula include uleiuri atent selectate și oferă confort pielii mâinilor după aplicare.<br>" +
      "Încearcă puterea Mării Moarte în acțiune și vei simți diferența după prima utilizare."
    ));
    expect(result.ingredients).toBeNull();
    expect(result.howToUse).toBeNull();
  });

  test("recognizes a descriptive composition heading and stops before benefits", () => {
    const result = parseRomanianProductHtml(page([
      "SOLARIS BODY LOTION Dr. Nona<br>",
      "Loțiune cosmetică pentru îngrijirea corpului, creată pentru utilizarea zilnică și confortul pielii uscate.<br>",
      "Formula se bazează pe o compoziție unică:<br>",
      "Apă și săruri din Marea Moartă,<br>Extract de aloe vera,<br>Vitamina E.<br>",
      "Beneficii pentru rutina zilnică:<br>Pielea rămâne plăcută la atingere și bine îngrijită după aplicare.<br>",
      "Textul editorial final oferă context suplimentar despre produs și completează descrierea sursei fără a inventa instrucțiuni.",
    ].join("")));
    expect(result.ingredients).toBe("Apă și săruri din Marea Moartă. Extract de aloe vera. Vitamina E");
    expect(result.ingredients).not.toContain("Beneficii");
    expect(result.howToUse).toBeNull();
  });

  test("accepts a legitimately short source page without manufacturing copy", () => {
    const result = parseRomanianProductHtml(page(
      "Conținutul setului include mostre pentru opt produse cosmetice Dr. Nona, cu volume indicate pe ambalaj. " +
      "Lista permite identificarea clară a fiecărei mostre și nu publică instrucțiuni sau ingrediente care lipsesc din sursă."
    ));
    expect(result.longDescription.length).toBeGreaterThanOrEqual(120);
    expect(result.ingredients).toBeNull();
    expect(result.howToUse).toBeNull();
  });

  test("flags the fragment and section-bleed examples from the audit", () => {
    expect(assessRomanianProductCopy({
      shortDescription: "Descriere română suficient de lungă pentru verificarea automată a câmpului.",
      longDescription: "Descriere română completă ".repeat(10),
      ingredients: "și ingrediente! Beneficii și mod de utilizare",
      howToUse: ", vei simți diferența!",
    })).toEqual(expect.arrayContaining([
      "ingredients starts with a fragment",
      "howToUse starts with a fragment",
      "howToUse contains promotional or composition copy",
    ]));
  });
});
