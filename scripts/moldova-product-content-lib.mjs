import * as cheerio from "cheerio";

const graphemes = new Intl.Segmenter("und", { granularity: "grapheme" });

// Work on graphemes so flags, keycaps, skin tones and ZWJ sequences disappear
// together. Plain trademark/copyright symbols are meaningful source text.
export function removeEmoji(value) {
  return [...graphemes.segment(value)].map(({ segment }) => {
    if (/^[©®™]$/u.test(segment)) return segment;
    return /[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Presentation}\u20e3]/u.test(segment)
      ? "" : segment;
  }).join("");
}

export const normalizeWhitespace = value => value.replace(/\s+/gu, " ").trim();
export const cleanSourceText = value => normalizeWhitespace(removeEmoji(value));
const listMarker = /^\s*(?:[•▪◾◆◇✓✔●◦]\uFE0F?|🔹|🔸|💠|✅|☑️?|✔️?)\s*/u;

export function blocksText(blocks) {
  return blocks.flatMap(block => block.type === "list" ? block.items : [block.text]).join("\n\n");
}

// Tilda product pages have separate title/brand atoms followed by the complete
// description. Collect ALL text atoms after that brand, never just the longest.
export function parseMoldovaProductHtml(html) {
  const $ = cheerio.load(html);
  $("script,style,noscript,svg").remove();
  const atoms = $(".tn-atom").toArray().filter(element => normalizeWhitespace($(element).text()));
  const brand = atoms.findIndex(element => /^Dr\.?\s*Nona$/iu.test(normalizeWhitespace($(element).text())));
  if (brand < 0) throw new Error("Product title/brand boundary not found; source structure needs review.");
  const title = cleanSourceText(atoms.slice(0, brand).map(element => $(element).text()).join(" "));
  const content = atoms.slice(brand + 1);
  const blocks = [];
  let rawText = "";
  let separated = true;
  function addLine(raw, kind = "paragraph", ordered = false) {
    rawText += `${raw}\n`;
    const marked = listMarker.test(raw);
    const text = cleanSourceText(marked ? raw.replace(listMarker, "") : raw);
    if (!text) return;
    const previous = blocks.at(-1);
    const heading = text.endsWith(":") && text.length < 140;
    const emojiLed = /^\s*\p{Extended_Pictographic}/u.test(raw);
    const sectionItem = emojiLed && !heading &&
      ((!separated && previous?.type === "list") || previous?.type === "heading");
    if (kind === "list" || (marked && !heading) || sectionItem) {
      if (!separated && previous?.type === "list" && previous.ordered === ordered) previous.items.push(text);
      else blocks.push({ type: "list", ordered, items: [text] });
    } else blocks.push({ type: kind === "paragraph" && heading ? "heading" : kind, text });
    separated = false;
  }
  for (const atom of content) {
    separated = true;
    let line = "";
    function flush(kind, ordered) {
      if (line.trim()) addLine(line, kind, ordered);
      line = "";
    }
    function walk(node, kind = "paragraph", ordered = false) {
      if (node.type === "text") { line += node.data; return; }
      if (node.type !== "tag") return;
      if (node.name === "br") {
        if (!line.trim()) separated = true;
        else flush(kind, ordered);
        return;
      }
      const boundary = /^(?:p|div|li|ul|ol|h[1-6])$/u.test(node.name);
      if (boundary) flush(kind, ordered);
      const nextKind = node.name === "li" ? "list" : /^h[1-6]$/u.test(node.name) ? "heading" : kind;
      const nextOrdered = node.name === "ol" ? true : node.name === "ul" ? false : ordered;
      for (const child of node.children ?? []) walk(child, nextKind, nextOrdered);
      if (boundary) flush(nextKind, nextOrdered);
    }
    for (const child of atom.children ?? []) walk(child);
    flush("paragraph", false);
  }
  if (!title || !blocks.length) throw new Error("Source has no product title or text blocks.");
  const longDescription = blocksText(blocks);
  const plainSourceText = normalizeWhitespace(removeEmoji(rawText).replace(/^[\s•▪◾◆◇✓✔●◦]+/gmu, ""));
  if (normalizeWhitespace(longDescription) !== plainSourceText) {
    const actual = normalizeWhitespace(longDescription);
    const index = [...plainSourceText].findIndex((char, i) => char !== [...actual][i]);
    throw new Error(`Text extraction changed non-emoji source characters near ${index}: source=${plainSourceText.slice(index - 30, index + 50)}; actual=${actual.slice(index - 30, index + 50)}`);
  }
  const first = blocks.flatMap(block => block.type === "list" ? block.items : [block.text])[0];
  const shortDescription = first.length <= 200 ? first : `${first.slice(0, 197).replace(/\s+\S*$/u, "")}…`;
  return { title, sourceBlocks: blocks, longDescription, shortDescription, plainSourceText };
}

export function sourceIdentity(path) {
  return path.replace(/^\//u, "").replace(/_(?:ru|ro)$/u, "").replace("lavander", "lavender");
}

export function discoverLinks(html, baseUrl, kind) {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const excluded = new Set(["/", "/ro", "/catalog", "/catalog_ro"]);
  return [...new Set($("a[href]").toArray().flatMap(element => {
    const href = $(element).attr("href");
    if (!href || href.startsWith("#")) return [];
    const url = new URL(href, base);
    if (!/^(?:www\.)?drnona\.md$/u.test(url.hostname) || excluded.has(url.pathname)) return [];
    const label = normalizeWhitespace($(element).text());
    if (kind === "product" && !/^(?:Информация|Informații|Informație|Informatii|Detalii)$/iu.test(label)) return [];
    return [`https://www.drnona.md${url.pathname.replace(/\/$/u, "")}`];
  }))];
}
