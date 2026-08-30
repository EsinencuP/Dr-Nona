/* global document, window */
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { chromium } from "@playwright/test";

const host = "127.0.0.1";
async function reservePort(preferredPort) {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", (error) => {
      if (preferredPort !== 0 && error.code === "EADDRINUSE") {
        reservePort(0).then(resolve, reject);
      } else {
        reject(error);
      }
    });
    probe.listen(preferredPort, host, () => {
      const address = probe.address();
      if (!address || typeof address === "string") {
        probe.close();
        reject(new Error("CSP runtime gate could not reserve a port."));
        return;
      }
      probe.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

async function rebuildForOriginIfNeeded(origin) {
  const html = await readFile("dist/index.html", "utf8");
  const builtOrigin =
    html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1] ??
    "";
  if (builtOrigin.startsWith(`${origin}/`)) return;

  const command =
    process.platform === "win32"
      ? process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe"
      : "npm";
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", "npm.cmd run build"]
      : ["run", "build"];
  const build = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, SITE_URL: origin },
    stdio: "inherit",
    windowsHide: true,
  });
  const exitCode = await new Promise((resolve, reject) => {
    build.once("error", reject);
    build.once("exit", resolve);
  });
  if (exitCode !== 0) {
    throw new Error(`CSP runtime origin build failed with exit code ${exitCode}.`);
  }
}

const port = await reservePort(4173);
const origin = `http://${host}:${port}`;
await rebuildForOriginIfNeeded(origin);
const preview = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    host,
    "--port",
    String(port),
    "--strictPort",
  ],
  {
    cwd: process.cwd(),
    env: process.env,
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
      throw new Error(`Preview exited before readiness.\n${previewOutput}`);
    }
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Preview did not start.\n${previewOutput}`);
}

async function run() {
  await waitForPreview();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /content security policy|violat(?:e|ion)/i.test(message.text())
    ) {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on("requestfailed", (request) => {
    if (/csp/i.test(request.failure()?.errorText ?? "")) {
      errors.push(
        `request: ${request.url()} (${request.failure()?.errorText ?? "failed"})`
      );
    }
  });
  await page.addInitScript(() => {
    window.__drNonaCspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.__drNonaCspViolations.push({
        blockedURI: event.blockedURI,
        directive: event.effectiveDirective,
      });
    });
  });

  const routes = [
    "/",
    "/products",
    "/product/lord-deodorant",
    "/blog/what-to-eat-after-coronavirus",
    "/contactus",
  ];
  for (const route of routes) {
    await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
    await page.locator("#root").waitFor({ state: "attached" });
    await page.waitForTimeout(250);
    const state = await page.evaluate(() => ({
      rootText: document.querySelector("#root")?.textContent?.trim().length ?? 0,
      violations: window.__drNonaCspViolations,
      csp: performance
        .getEntriesByType("navigation")
        .length,
    }));
    if (state.rootText < 40) {
      errors.push(`${route}: application root did not render meaningful content.`);
    }
    for (const violation of state.violations) {
      errors.push(
        `${route}: ${violation.directive} blocked ${violation.blockedURI || "(inline)"}.`
      );
    }
  }

  await browser.close();
  if (errors.length) {
    throw new Error(`CSP runtime gate failed:\n- ${errors.join("\n- ")}`);
  }
  console.log(
    `CSP runtime gate: PASS (${routes.length} routes rendered under enforced CSP; 0 violations).`
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
