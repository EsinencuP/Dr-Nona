import * as cheerio from "cheerio";

const emojiPattern = /\p{Extended_Pictographic}|\p{Emoji_Modifier}|\uFE0F|\u200D/gu;

export function cleanRomanianText(value = "") {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .replace(emojiPattern, " ")
    .replace(/^[\s•▪◾◆◇✓✔]+/gu, "")
    .replace(/\s+/gu, " ")
    .replace(/\s+([,.;:!?])/gu, "$1")
    .trim();
}

function richLines($, selection) {
  const content = selection.clone();
  content.find("br").replaceWith("\n");
  content.find("p,li,div,h1,h2,h3,h4,h5,h6").each((_, element) => {
    $(element).append("\n");
  });
  return content
    .text()
    .split(/\n+/u)
    .map(cleanRomanianText)
    .filter(Boolean);
}

function contentLines($) {
  const candidates = $(".tn-atom")
    .toArray()
    .map((element) => richLines($, $(element)))
    .filter((lines) => lines.join(" ").length >= 120)
    .sort((left, right) => right.join(" ").length - left.join(" ").length);
  if (candidates[0]) return candidates[0];
  return richLines($, $("body"));
}

function withoutProductHeading(lines) {
  const output = [...lines];
  if (!output.length) return output;
  const first = output[0]
    .replace(/^[^.!?]{1,120}?Dr\.?\s*Nona\s*(?:[-—–:]\s*)?/iu, "")
    .trim();
  if (first.length >= 20) output[0] = first;
  else output.shift();
  return output;
}

function sentenceSummary(value) {
  const sentences = [...new Intl.Segmenter("ro", { granularity: "sentence" }).segment(value)]
    .map(({ segment }) => cleanRomanianText(segment))
    .filter(Boolean);
  let summary = "";
  for (const sentence of sentences) {
    const next = cleanRomanianText(`${summary} ${sentence}`);
    if (summary.length >= 50 && !/\bDr\.$/iu.test(summary)) break;
    if (next.length > 200) {
      summary = next.slice(0, 200).replace(/\s+\S*$/u, "").trim();
      break;
    }
    summary = next;
  }
  if (!summary) summary = cleanRomanianText(value).slice(0, 200);
  if (summary.length > 200) {
    summary = `${summary.slice(0, 197).replace(/\s+\S*$/u, "")}…`;
  }
  return summary;
}

function extractSection(lines, starts, ends, forbidden) {
  const startIndex = lines.findIndex((line) => starts.some((pattern) => pattern.test(line)));
  if (startIndex < 0) return null;
  const selected = [];
  const startLine = lines[startIndex];
  const inline = cleanRomanianText(startLine.split(":").slice(1).join(":"));
  if (inline) selected.push(inline);
  for (const line of lines.slice(startIndex + 1)) {
    if (ends.some((pattern) => pattern.test(line))) break;
    selected.push(line);
  }
  const value = cleanRomanianText(
    selected
      .map((line) => cleanRomanianText(line).replace(/[.,;:]+$/u, ""))
      .filter(Boolean)
      .join(". ")
  );
  if (value.length < 20 || forbidden.some((pattern) => pattern.test(value))) {
    return null;
  }
  return value;
}

const ingredientStarts = [
  /^compozi(?:ție|ția)(?:\s|:)/iu,
  /^.{1,140}\bcompozi(?:ție|ția)(?:\s+[\p{L}-]+){0,3}:$/iu,
  /^ingrediente(?:\s|:)/iu,
  /^de asemenea,? compoziția sa include/iu,
  /^în compoziție se mai regăsesc/iu,
  /^conține,? de asemenea/iu,
  /^acest (?:ceai|produs) conține/iu,
];
const ingredientEnds = [
  /^(?:datorită formulei|beneficii|ideal pentru|recomandări|mod de utilizare|utilizare|cum se utilizează|utilizați|ajută la)/iu,
  /^(?:lasă|după ce|încearcă|cu\s+[A-Z])/iu,
];
const ingredientForbidden = [
  /\b(?:ajută la|ideal pentru|mod de utilizare|utilizați|vindecarea|ameliorează durer)/iu,
];
const useStarts = [
  /^mod de utilizare(?:\s|:)/iu,
  /^cum se utilizează(?:\s|:)/iu,
  /^utilizați(?:\s|:)/iu,
  /^aplicați(?:\s|:)/iu,
];
const useEnds = [
  /^(?:compoziție|ingrediente|important|contraindicații|beneficii|ideal pentru)/iu,
  /^(?:lasă|după ce|încearcă|cu\s+[A-Z])/iu,
];
const useForbidden = [
  /\b(?:vei simți diferența|beneficiază de îngrijire|ingrediente|compoziție bogată)/iu,
];

export function assessRomanianProductCopy(record) {
  const errors = [];
  if (record.shortDescription.length < 50 || record.shortDescription.length > 200) {
    errors.push("shortDescription must contain 50-200 characters");
  }
  if (record.longDescription.length < 120) {
    errors.push("longDescription must contain at least 120 source characters");
  }
  for (const [field, value] of [["ingredients", record.ingredients], ["howToUse", record.howToUse]]) {
    if (value && /^(?:[,;:]|și\b|i sale\b|unică\b|zilnic\b)/iu.test(value)) {
      errors.push(`${field} starts with a fragment`);
    }
  }
  if (record.ingredients && ingredientForbidden.some((pattern) => pattern.test(record.ingredients))) {
    errors.push("ingredients contains another semantic section");
  }
  if (record.howToUse && useForbidden.some((pattern) => pattern.test(record.howToUse))) {
    errors.push("howToUse contains promotional or composition copy");
  }
  return errors;
}

export function parseRomanianProductHtml(html) {
  const $ = cheerio.load(html);
  $("script,style,noscript,svg").remove();
  const lines = withoutProductHeading(contentLines($));
  const longDescription = cleanRomanianText(lines.join(" "));
  if (longDescription.length < 120) {
    throw new Error("Romanian product page has no usable product copy.");
  }
  const record = {
    shortDescription: sentenceSummary(longDescription),
    longDescription,
    ingredients: extractSection(lines, ingredientStarts, ingredientEnds, ingredientForbidden),
    howToUse: extractSection(lines, useStarts, useEnds, useForbidden),
  };
  const errors = assessRomanianProductCopy(record);
  if (errors.length) throw new Error(errors.join("; "));
  return record;
}
