import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { load } from "cheerio";

const host = "127.0.0.1";
const port = await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.once("error", reject);
  probe.listen(0, host, () => {
    const address = probe.address();
    if (!address || typeof address === "string") {
      probe.close();
      reject(new Error("SEO HTTP gate: could not reserve a local preview port."));
      return;
    }
    const availablePort = address.port;
    probe.close((error) => {
      if (error) reject(error);
      else resolve(availablePort);
    });
  });
});
const localOrigin = `http://${host}:${port}`;
const viteCli = "node_modules/vite/bin/vite.js";
const sitemapXml = readFileSync("dist/sitemap.xml", "utf8");
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1]
);

if (sitemapUrls.length === 0) {
  throw new Error("SEO HTTP gate: sitemap.xml contains no URLs.");
}
if (new Set(sitemapUrls).size !== sitemapUrls.length) {
  throw new Error("SEO HTTP gate: sitemap.xml contains duplicate URLs.");
}

const preview = spawn(
  process.execPath,
  [viteCli, "preview", "--host", host, "--port", String(port), "--strictPort"],
  {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  }
);
let previewOutput = "";
preview.stdout.on("data", (chunk) => {
  previewOutput += chunk.toString();
});
preview.stderr.on("data", (chunk) => {
  previewOutput += chunk.toString();
});

async function waitForPreview() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (preview.exitCode !== null) {
      throw new Error(
        `SEO HTTP gate: preview exited before it was ready.\n${previewOutput}`
      );
    }
    try {
      const response = await fetch(localOrigin);
      if (response.ok) return;
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`SEO HTTP gate: preview did not start.\n${previewOutput}`);
}

async function checkSitemapUrl(url) {
  const published = new URL(url);
  const response = await fetch(`${localOrigin}${published.pathname}`);
  if (response.status !== 200) {
    return `${published.pathname}: expected 200, received ${response.status}.`;
  }
  const html = await response.text();
  const $ = load(html);
  if (
    $('[data-prerendered-route]').attr("data-prerendered-route") !==
    published.pathname
  ) {
    return `${published.pathname}: prerendered route marker mismatch.`;
  }
  if ($('link[rel="canonical"]').attr("href") !== url) {
    return `${published.pathname}: served canonical differs from sitemap URL.`;
  }
  return null;
}

async function run() {
  await waitForPreview();
  const errors = [];
  const concurrency = 12;

  for (let index = 0; index < sitemapUrls.length; index += concurrency) {
    const batch = sitemapUrls.slice(index, index + concurrency);
    const results = await Promise.all(batch.map(checkSitemapUrl));
    errors.push(...results.filter(Boolean));
  }

  const main = await fetch(`${localOrigin}/main`, { redirect: "manual" });
  if (main.status !== 308 || main.headers.get("location") !== "/") {
    errors.push(
      `/main: expected 308 Location /, received ${main.status} Location ${
        main.headers.get("location") ?? "(missing)"
      }.`
    );
  }

  for (const asset of ["/robots.txt", "/sitemap.xml"]) {
    const response = await fetch(`${localOrigin}${asset}`);
    if (response.status !== 200) {
      errors.push(`${asset}: expected 200, received ${response.status}.`);
    }
  }

  for (const pathname of ["/missing-page", "/missing/nested/", "/product/missing-product", "/ro/missing-page"]) {
    const response = await fetch(`${localOrigin}${pathname}`);
    const $ = load(await response.text());
    if (response.status !== 404) errors.push(`${pathname}: expected HTTP 404, received ${response.status}.`);
    if ($('meta[name="robots"]').attr("content") !== "noindex,follow") {
      errors.push(`${pathname}: the raw error response must contain noindex metadata.`);
    }
    if ($(".not-found__actions a").length !== 2 || $("h1").length !== 1) {
      errors.push(`${pathname}: custom error content and recovery links must work without JavaScript.`);
    }
    const locale = pathname.startsWith("/ro/") ? "ro" : "ru";
    if ($("html").attr("lang") !== locale) errors.push(`${pathname}: raw error response locale mismatch.`);
    if ($('link[rel="canonical"], link[rel="alternate"][hreflang]').length) {
      errors.push(`${pathname}: error fallback must not claim a canonical page or translated alias.`);
    }
    const head = await fetch(`${localOrigin}${pathname}`, { method: "HEAD" });
    if (head.status !== 404 || !head.headers.get("x-robots-tag")?.includes("noindex")) {
      errors.push(`${pathname}: HEAD must preserve the 404 status and noindex header.`);
    }
  }
  const fallback = load(readFileSync("dist/404.html", "utf8"));
  if (fallback('meta[name="robots"]').attr("content") !== "noindex,follow" || fallback(".not-found__actions a").length !== 2) {
    errors.push("dist/404.html: deployable static error page is missing metadata or recovery links.");
  }

  if (errors.length) {
    throw new Error(`SEO HTTP gate failed:\n- ${errors.join("\n- ")}`);
  }

  console.log(
    `SEO HTTP gate: PASS (${sitemapUrls.length} sitemap URLs returned canonical prerendered HTML; /main returned 308; 4 missing paths returned localized 404/noindex for GET and HEAD).`
  );
}

try {
  await run();
} finally {
  if (preview.exitCode === null) {
    preview.kill();
    await Promise.race([
      new Promise((resolve) => preview.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 3_000)),
    ]);
  }
}
