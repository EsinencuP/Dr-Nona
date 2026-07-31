import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { load } from "cheerio";

const html = readFileSync("dist/index.html", "utf8");
const $ = load(html);
const initialAssetUrls = [
  ...$("script[type='module'][src]")
    .map((_, node) => $(node).attr("src"))
    .get(),
  ...$("link[rel='modulepreload'][href]")
    .map((_, node) => $(node).attr("href"))
    .get(),
  ...$("link[rel='stylesheet'][href]")
    .map((_, node) => $(node).attr("href"))
    .get(),
];
const localInitialAssetUrls = [...new Set(initialAssetUrls)].filter((url) =>
  url.startsWith("/assets/")
);
const initialFiles = localInitialAssetUrls.map((url) =>
  join("dist", ...new URL(url, "http://local").pathname.split("/").filter(Boolean))
);
const measurements = initialFiles.map((file) => {
  const source = readFileSync(file);
  return {
    file: basename(file),
    raw: source.length,
    gzip: gzipSync(source).length,
    brotli: brotliCompressSync(source).length,
  };
});
const totals = measurements.reduce(
  (sum, item) => ({
    raw: sum.raw + item.raw,
    gzip: sum.gzip + item.gzip,
    brotli: sum.brotli + item.brotli,
  }),
  { raw: 0, gzip: 0, brotli: 0 }
);

const errors = [];
function expect(condition, message) {
  if (!condition) errors.push(message);
}

expect(
  !localInitialAssetUrls.some((url) =>
    /official-content|catalog-data|CatalogPage/.test(url)
  ),
  "Initial HTML preloads route data or the catalogue route chunk."
);
expect(
  totals.gzip <= 140 * 1024,
  `Initial gzip budget exceeded: ${totals.gzip} > ${140 * 1024} bytes.`
);
expect(
  totals.brotli <= 115 * 1024,
  `Initial Brotli budget exceeded: ${totals.brotli} > ${115 * 1024} bytes.`
);

const assetNames = readdirSync("dist/assets");
const catalogRouteChunk = assetNames.find((name) =>
  /^CatalogPage-.*\.js$/.test(name)
);
const catalogDataChunk = assetNames.find((name) =>
  /^catalog-data-.*\.js$/.test(name)
);
const officialContentChunk = assetNames.find((name) =>
  /^official-content-.*\.js$/.test(name)
);
expect(Boolean(catalogRouteChunk), "CatalogPage route chunk is missing.");
expect(Boolean(catalogDataChunk), "Product data chunk is missing.");
expect(Boolean(officialContentChunk), "Official content chunk is missing.");

expect(
  !/official-content|catalog-data|CatalogPage/.test(
    html.match(/<link rel="modulepreload"[^>]+>/g)?.join("") ?? ""
  ),
  "Route-only chunks are present in modulepreload."
);

const report = `# Frontend performance budget

Generated automatically by \`npm run build\`.

## Initial route payload

| Asset | Raw | Gzip | Brotli |
|---|---:|---:|---:|
${measurements
  .map(
    (item) =>
      `| \`${item.file}\` | ${item.raw} B | ${item.gzip} B | ${item.brotli} B |`
  )
  .join("\n")}
| **Total** | **${totals.raw} B** | **${totals.gzip} B** | **${totals.brotli} B** |

Budgets: initial gzip ≤ 140 KiB; initial Brotli ≤ 115 KiB.

## Split guarantees

- initial HTML does not preload \`official-content\`;
- initial HTML does not preload \`catalog-data\`;
- initial HTML does not preload the \`CatalogPage\` route module;
- separate route chunk: \`${catalogRouteChunk ?? "MISSING"}\`;
- separate product-data chunk: \`${catalogDataChunk ?? "MISSING"}\`;
- separate official-content chunk: \`${officialContentChunk ?? "MISSING"}\`;
- route-network assertions for Home, Contact and Catalog run in Playwright.
`;
mkdirSync("artifacts/reports", { recursive: true });
writeFileSync("artifacts/reports/PERFORMANCE_REPORT.md", report, "utf8");

if (errors.length) {
  throw new Error(`Performance budget failed:\n- ${errors.join("\n- ")}`);
}

console.log(
  `Performance budget: PASS (initial ${totals.gzip} B gzip / ${totals.brotli} B Brotli; ${measurements.length} assets).`
);
