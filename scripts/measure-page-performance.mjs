/* global window, document, scrollTo */
// Full-media lab companion to the existing isolated JavaScript runtime gate.
// Run after build: node scripts/measure-page-performance.mjs <output-dir> [runs]
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";
import { load } from "cheerio";

const output = process.argv[2] ?? "artifacts/reports/page-performance";
const runs = Number(process.argv[3] ?? 3);
if (!Number.isInteger(runs) || runs < 1) throw new Error("runs must be a positive integer");
mkdirSync(output, { recursive: true });
const port = await new Promise((resolve, reject) => {
  const server = createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    server.close(() => resolve(address.port));
  });
});
const origin = `http://127.0.0.1:${port}`;
const preview = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { windowsHide: true, stdio: "ignore" });
const chunks = readdirSync("dist/assets").filter((file) => /\.(js|css)$/.test(file)).map((file) => {
  const bytes = readFileSync(join("dist/assets", file));
  return { file, raw: bytes.length, gzip: gzipSync(bytes).length, brotli: brotliCompressSync(bytes).length };
});
const $ = load(readFileSync("dist/index.html", "utf8"));
const preloads = $("link[rel=preload],link[rel=modulepreload],link[rel=stylesheet],script[src]").map((_, el) => ({ ...el.attribs })).get();
writeFileSync(join(output, "payload.json"), JSON.stringify({ chunks, preloads }, null, 2));
const measurements = [];
let browser;
try {
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(origin)).ok) break; } catch (error) {
      if (attempt >= 100) throw error;
    }
    if (preview.exitCode !== null) throw new Error("Preview exited before measurements");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch();
  const surfaces = ["/", "/products", "/product/dynamic-hydrating-cream", "/editorial", "/contactus"];
  for (let run = 0; run < runs; run++) for (const locale of ["ru", "ro"]) for (const width of [375, 1440]) for (const surface of surfaces) {
    const path = locale === "ro" ? `/ro${surface === "/" ? "" : surface}` : surface;
    const key = `${locale}-${width}-${surface.replaceAll("/", "_") || "home"}`;
    const context = await browser.newContext({ viewport: { width, height: width === 375 ? 812 : 900 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Performance.enable");
    // Fixed CPU slowdown; network is local/live, not a field or Lighthouse score.
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      window.__pagePerf = { lcp: null, shifts: [], interactions: [], longTasks: [] };
      new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__pagePerf.lcp = { ms: e.startTime, url: e.url, tag: e.element?.tagName }; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__pagePerf.shifts.push({ time: e.startTime, value: e.value }); }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => { for (const e of list.getEntries()) if (e.interactionId) window.__pagePerf.interactions.push(e.duration); }).observe({ type: "event", buffered: true, durationThreshold: 16 });
      new PerformanceObserver((list) => { window.__pagePerf.longTasks.push(...list.getEntries().map((e) => e.duration)); }).observe({ type: "longtask", buffered: true });
    });
    const failures = [];
    page.on("requestfailed", (request) => failures.push({ url: request.url(), error: request.failure()?.errorText }));
    await cdp.send("Tracing.start", { categories: "devtools.timeline,disabled-by-default-devtools.timeline", transferMode: "ReturnAsStream" });
    await page.goto(`${origin}${path}`, { waitUntil: "load" });
    await page.locator("main h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    const initial = await page.evaluate(() => ({
      ...window.__pagePerf,
      resources: performance.getEntriesByType("resource").map((e) => ({ url: e.name, type: e.initiatorType, transfer: e.transferSize, encoded: e.encodedBodySize, duration: e.duration })),
      images: [...document.images].map((img) => ({ src: img.currentSrc || img.src, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height, top: img.getBoundingClientRect().top, loading: img.loading, complete: img.complete })),
    }));
    const metrics = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
    const complete = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve));
    await cdp.send("Tracing.end");
    const { stream } = await complete;
    let trace = "";
    for (;;) { const part = await cdp.send("IO.read", { handle: stream }); trace += part.data; if (part.eof) break; }
    await cdp.send("IO.close", { handle: stream });
    const events = JSON.parse(trace).traceEvents;
    const decodeEvents = events.filter((e) => /Decode Image|ImageDecodeTask/.test(e.name) && e.dur);
    // A real click through CDP/Playwright. Only open/close the menu or local save
    // state; never submit a contact form or navigate to another route.
    const action = page.locator("button:visible").first();
    if (await action.count()) { await action.click(); await page.waitForTimeout(150); await page.keyboard.press("Escape"); }
    const interactions = await page.evaluate(() => window.__pagePerf.interactions);
    let cls = 0, session = 0, start = 0, last = 0;
    for (const shift of initial.shifts) {
      if (shift.time - last > 1000 || shift.time - start > 5000) { session = 0; start = shift.time; }
      session += shift.value; last = shift.time; cls = Math.max(cls, session);
    }
    const row = { key, path, locale, width, run, lcp: initial.lcp, cls, interactionMaxMs: interactions.length ? Math.max(...interactions) : null, interactionNote: "Lab event timing, not field INP; null means no event >=16ms", scriptMs: metrics.ScriptDuration * 1000, taskMs: metrics.TaskDuration * 1000, decodeMs: decodeEvents.reduce((sum, e) => sum + e.dur / 1000, 0), decodeEvents: decodeEvents.length, longTasks: initial.longTasks, requests: initial.resources.length, resources: initial.resources, images: initial.images, failures };
    if (run === 0) {
      // Fresh navigation resets local interaction state for comparable screenshots.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`${origin}${path}`, { waitUntil: "load" });
      await page.locator("main h1").waitFor();
      await page.evaluate(() => document.fonts.ready);
      for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 700) { await page.evaluate((top) => scrollTo(0, top), y); await page.waitForTimeout(60); }
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(300);
      await page.screenshot({ path: join(output, `${key}.png`), fullPage: true, animations: "disabled" });
    }
    measurements.push(row);
    writeFileSync(join(output, "measurements.json"), JSON.stringify({ environment: { cpuSlowdown: 4, network: "cold local preview, live external media; transfer sizes not deployment gzip", dpr: 1, runs }, measurements }, null, 2));
    console.log(`${run + 1}/${runs} ${path} ${width}: LCP ${row.lcp?.ms} CLS ${cls.toFixed(4)} requests ${row.requests} script ${row.scriptMs.toFixed(1)}`);
    await context.close();
  }
} finally {
  await browser?.close();
  preview.kill();
}
