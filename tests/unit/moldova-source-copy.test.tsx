import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { parseMoldovaProductHtml, removeEmoji, discoverLinks } from "../../scripts/moldova-product-content-lib.mjs";
import { ProductSourceText } from "../../src/features/product/ProductSourceText";

describe("verbatim Moldova originals", () => {
  it("removes whole emoji sequences while retaining numbers, units and meaningful symbols", () => {
    expect(removeEmoji("👩🏽‍⚕️ 🇲🇩 1️⃣ 🛡️ 💠 98% — 45 секунд, 30 ml; © ® ™ + →")).toBe("     98% — 45 секунд, 30 ml; © ® ™ + →");
  });

  it("keeps every text atom, opening, list and conclusion without correcting source punctuation", () => {
    const parsed = parseMoldovaProductHtml(`<div class="tn-atom">DND</div><div class="tn-atom">Dr. Nona</div>
      <div class="tn-atom">✨ DND — описание!!<br>98% за 45 секунд.<br><br>Состав:<br>🔹 Halo Complex 🌊<br>🔹 Витамин B3 💊</div>
      <div class="tn-atom"><p>Последний абзац. Попробуй!</p><ul><li>10 ml</li><li>3 ml</li></ul></div>`);
    expect(parsed.longDescription).toBe("DND — описание!!\n\n98% за 45 секунд.\n\nСостав:\n\nHalo Complex\n\nВитамин B3\n\nПоследний абзац. Попробуй!\n\n10 ml\n\n3 ml");
    render(<div data-testid="copy"><ProductSourceText blocks={parsed.sourceBlocks} text={parsed.longDescription} /></div>);
    expect(screen.getAllByRole("listitem").map(item => item.textContent)).toEqual(["Halo Complex", "Витамин B3", "10 ml", "3 ml"]);
    expect(screen.getByText("Последний абзац. Попробуй!")).toBeVisible();
  });

  it("discovers a newly linked product rather than relying on importer inventory", () => {
    expect(discoverLinks('<a href="http://drnona.md/new_product_ro">Informații</a><a href="/catalog_ro">Каталог</a>', "https://www.drnona.md/hygiene_ro", "product")).toEqual(["https://www.drnona.md/new_product_ro"]);
  });

  it("keeps an emoji-led conclusion as a paragraph after a list break", () => {
    const parsed = parseMoldovaProductHtml('<div class="tn-atom">OKSEEN</div><div class="tn-atom">Dr. Nona</div><div class="tn-atom">Состав:<br>🌿 Растения<br>💧 Минералы<br><br>🔥 Попробуй продукт!</div>');
    expect(parsed.sourceBlocks).toEqual([
      { type: "heading", text: "Состав:" },
      { type: "list", ordered: false, items: ["Растения", "Минералы"] },
      { type: "paragraph", text: "Попробуй продукт!" },
    ]);
  });

  it("fails on changed source structure instead of importing navigation or a fallback", () => {
    expect(() => parseMoldovaProductHtml("<body>Product unavailable</body>")).toThrow("boundary");
  });
});
