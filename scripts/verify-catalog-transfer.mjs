import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";
import * as cheerio from "cheerio";
import { removeEmoji, normalizeWhitespace } from "./moldova-product-content-lib.mjs";

const manifest = JSON.parse(await readFile("src/data/catalog-source-manifest.json", "utf8"));
const products = JSON.parse(await readFile("src/data/products.json", "utf8"));
const baseUrl = process.env.CATALOG_VERIFY_URL || "http://127.0.0.1:4173";
const outputDir = "artifacts/catalog-transfer";
await mkdir(outputDir, { recursive: true });

// Independent plain-DOM extraction: do not use the importer's structured parser
// or its output as expected text. Read every original description atom in order.
function expectedText(html) {
  const $ = cheerio.load(html);
  const atoms = $(".tn-atom").toArray();
  const brand = atoms.findIndex(node => /^Dr\.?\s*Nona$/iu.test(normalizeWhitespace($(node).text())));
  if (brand < 0) throw new Error("Missing source brand boundary");
  return normalizeWhitespace(atoms.slice(brand + 1).map(node => {
    const atom = $(node).clone();
    atom.find("br").replaceWith("\n");
    atom.find("p,li,div,h1,h2,h3,h4,h5,h6").append("\n");
    return atom.text().split(/\n/u).map(line =>
      removeEmoji(line).replace(/^\s*[•▪◾◆◇✓✔●◦]\uFE0F?\s*/u, "")
    ).join("\n");
  }).join("\n"));
}

const originals = new Map();
const errors = [];
let cursor = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (cursor < manifest.records.length) {
    const record = manifest.records[cursor++];
    try {
      let html;
      if (process.argv.includes("--source-cache")) {
        html = await readFile(`artifacts/catalog-source/${new URL(record.sourceUrl).pathname.slice(1)}.html`, "utf8");
      } else {
        let lastError;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const response = await fetch(record.sourceUrl, { signal: AbortSignal.timeout(25000) });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            html = await response.text();
            break;
          } catch (error) { lastError = error; }
        }
        if (html === undefined) throw lastError;
      }
      const text = expectedText(html);
      if (createHash("sha256").update(text).digest("hex") !== record.textHash) throw new Error("Original differs from import manifest");
      originals.set(`${record.locale}:${record.slug}`, text);
    } catch (error) { errors.push(`${record.sourceUrl}: ${error.message}`); }
  }
}));

const rows = [];
const browser = await chromium.launch();
try {
  for (const viewport of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("drnona-privacy-choice-v1", JSON.stringify({ version: 1, choice: "rejected", decidedAt: Date.now(), expiresAt: Date.now() + 86400000 })));
    for (const record of manifest.records) {
      const route = `/${record.locale}/product/${record.slug}`;
      const key = `${record.locale}:${record.slug}`;
      try {
        if (!originals.has(key)) throw new Error("Source unavailable; cannot verify completeness");
        await page.goto(`${baseUrl}${route}`);
        const full = page.getByTestId("full-product-description");
        await full.waitFor({ state: "visible" });
        const refuse = page.getByRole("button", { name: /^(?:Отказаться|Refuză)$/u });
        if (await refuse.count()) await refuse.click();
        const actual = normalizeWhitespace(await full.innerText());
        const expected = originals.get(key);
        if (actual !== expected) {
          const i = [...expected].findIndex((char, index) => char !== [...actual][index]);
          throw new Error(`Rendered/source mismatch near ${i}: ${expected.slice(Math.max(0,i-25), i+60)}`);
        }
        const clipped = await full.evaluate(element => {
          const doc = element.ownerDocument;
          const view = doc.defaultView;
          return element.getBoundingClientRect().width < 200 || [element, ...element.querySelectorAll("*")].some(node => {
            const style = view.getComputedStyle(node);
            return style.textOverflow === "ellipsis" || (style.webkitLineClamp !== "none" && style.webkitLineClamp !== "") || style.maxHeight !== "none" || style.overflowY === "hidden";
          }) || doc.documentElement.scrollWidth > view.innerWidth + 1;
        });
        if (clipped) throw new Error("Clipped text or horizontal overflow");
        if (["okseen", "dnd-chewing-gum-tablets"].includes(record.slug)) {
          await page.screenshot({ path: `${outputDir}/${record.slug}-${record.locale}-${viewport.name}.png`, fullPage: true });
        }
        rows.push({ ...record, route, viewport: viewport.name, status: "PASS", characters: actual.length, differences: [] });
      } catch (error) {
        errors.push(`${viewport.name} ${route}: ${error.message}`);
        rows.push({ ...record, route, viewport: viewport.name, status: "FAIL", differences: [error.message] });
      }
    }
    await page.close();
  }
} finally { await browser.close(); }

const result = { verifiedAt: new Date().toISOString(), sourceMode: process.argv.includes("--source-cache") ? "HTML fetched by live import in this session" : "fresh HTTP requests", products: products.length, originals: originals.size, comparisons: rows.length, errors, rows };
await writeFile(`${outputDir}/verification.json`, `${JSON.stringify(result, null, 2)}\n`);
if (process.argv.includes("--write-report")) {
  const docPath = "docs/CATALOG_TEXT_RESTORATION_2026-10-30.md";
  const intro = (await readFile(docPath, "utf8")).split("<!-- comparison-table -->")[0];
  const table = manifest.records.map(record => {
    const checked = rows.filter(row => row.slug === record.slug && row.locale === record.locale);
    const pass = checked.length === 2 && checked.every(row => row.status === "PASS");
    const product = products.find(p => p.slug === record.slug);
    return `| ${product.officialName} (${record.locale.toUpperCase()}; ${product.sku || "SKU NOT VERIFIED"}) | ${record.sourceUrl} | /${record.locale}/product/${record.slug} | ${pass ? "Полный текст: desktop + mobile PASS" : "FAIL"} | ${pass ? "Нет текстовых расхождений" : checked.flatMap(row => row.differences).join("; ")} |`;
  });
  await writeFile(docPath, `${intro}\n<!-- comparison-table -->\n\nПроверено ${result.verifiedAt}: ${originals.size} исходных текстов, ${rows.length} сравнений с реально отрисованным DOM. Допустимые различия: эмодзи удалены, маркеры заменены HTML-списками, пробелы нормализованы. Исходные HTML получены при полном live-обходе в этой сессии. Источники недоступны: ${manifest.records.length - originals.size}. Ошибки сравнения: ${errors.length}.\n\n| Товар / язык / SKU | URL источника | Новая страница | Полнота переноса | Оставшиеся расхождения |\n|---|---|---|---|---|\n${table.join("\n")}\n`);
}
console.log(`Source → rendered DOM: ${originals.size} originals, ${rows.length} desktop/mobile comparisons, ${errors.length} errors.`);
for (const error of errors) console.error(error);
if (errors.length) process.exitCode = 1;
