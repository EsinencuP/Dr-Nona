import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const host = "127.0.0.1";
const port = await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.once("error", reject);
  probe.listen(0, host, () => {
    const address = probe.address();
    if (!address || typeof address === "string") {
      probe.close();
      reject(new Error("Runtime performance: could not reserve a port."));
      return;
    }
    probe.close((error) => {
      if (error) reject(error);
      else resolve(address.port);
    });
  });
});
const origin = `http://${host}:${port}`;
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
        `Runtime performance: preview exited early.\n${previewOutput}`
      );
    }
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Runtime performance: preview did not start.\n${previewOutput}`);
}

const routes = [
  { name: "Home", path: "/", parseBudgetMs: 500, scriptBudgetMs: 1000, taskBudgetMs: 2000 },
  { name: "Contact", path: "/contactus", parseBudgetMs: 350, scriptBudgetMs: 750, taskBudgetMs: 1500 },
  { name: "Catalog", path: "/products", parseBudgetMs: 500, scriptBudgetMs: 1000, taskBudgetMs: 2000 },
];

async function measureRoute(browser, route) {
  const context = await browser.newContext();
  await context.route("**/*", async (requestRoute) => {
    const request = requestRoute.request();
    const url = new URL(request.url());
    if (
      url.origin !== origin ||
      request.resourceType() === "image" ||
      request.resourceType() === "font"
    ) {
      await requestRoute.abort();
      return;
    }
    await requestRoute.continue();
  });
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  await session.send("Performance.enable");
  await session.send("Tracing.start", {
    categories:
      "devtools.timeline,v8,disabled-by-default-v8.compile",
    transferMode: "ReturnAsStream",
  });
  await page.goto(`${origin}${route.path}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1");
  await page.waitForTimeout(250);
  const response = await session.send("Performance.getMetrics");
  const tracingComplete = new Promise((resolve) =>
    session.once("Tracing.tracingComplete", resolve)
  );
  await session.send("Tracing.end");
  const { stream } = await tracingComplete;
  let traceJson = "";
  while (true) {
    const chunk = await session.send("IO.read", { handle: stream });
    traceJson += chunk.data;
    if (chunk.eof) break;
  }
  await session.send("IO.close", { handle: stream });
  const traceEvents = JSON.parse(traceJson).traceEvents;
  const parseMs =
    traceEvents
      .filter(
        (event) =>
          (event.name === "V8.ParseProgram" ||
            event.name === "V8.ParseFunction") &&
          typeof event.dur === "number"
      )
      .reduce((sum, event) => sum + event.dur, 0) / 1000;
  const metrics = new Map(
    response.metrics.map((metric) => [metric.name, metric.value])
  );
  await context.close();

  return {
    ...route,
    parseMs,
    scriptMs: (metrics.get("ScriptDuration") ?? 0) * 1000,
    taskMs: (metrics.get("TaskDuration") ?? 0) * 1000,
  };
}

let browser;
try {
  await waitForPreview();
  browser = await chromium.launch({ headless: true });
  const measurements = [];
  for (const route of routes) {
    measurements.push(await measureRoute(browser, route));
  }

  const errors = measurements.flatMap((item) => {
    const routeErrors = [];
    if (item.parseMs > item.parseBudgetMs) {
      routeErrors.push(
        `${item.name}: V8 parse ${item.parseMs.toFixed(1)} ms exceeds ${item.parseBudgetMs} ms.`
      );
    }
    if (item.scriptMs > item.scriptBudgetMs) {
      routeErrors.push(
        `${item.name}: script ${item.scriptMs.toFixed(1)} ms exceeds ${item.scriptBudgetMs} ms.`
      );
    }
    if (item.taskMs > item.taskBudgetMs) {
      routeErrors.push(
        `${item.name}: task ${item.taskMs.toFixed(1)} ms exceeds ${item.taskBudgetMs} ms.`
      );
    }
    return routeErrors;
  });

  const report = `# Runtime performance report

Generated from isolated production-preview navigations in headless Chromium.
External requests, images and fonts are excluded so the measurements focus on
local JavaScript parsing and execution.

| Route | V8 parse | Script execution | Main-thread tasks |
|---|---:|---:|---:|
${measurements
  .map(
    (item) =>
      `| ${item.name} \`${item.path}\` | ${item.parseMs.toFixed(1)} ms / ${item.parseBudgetMs} ms | ${item.scriptMs.toFixed(1)} ms / ${item.scriptBudgetMs} ms | ${item.taskMs.toFixed(1)} ms / ${item.taskBudgetMs} ms |`
  )
  .join("\n")}
`;
  mkdirSync("artifacts/reports", { recursive: true });
  writeFileSync("artifacts/reports/RUNTIME_PERFORMANCE_REPORT.md", report, "utf8");

  if (errors.length) {
    throw new Error(`Runtime performance failed:\n- ${errors.join("\n- ")}`);
  }
  console.log(
    `Runtime performance: PASS (${measurements
      .map(
        (item) =>
          `${item.name} ${item.parseMs.toFixed(1)}/${item.scriptMs.toFixed(1)}/${item.taskMs.toFixed(1)} ms`
      )
      .join("; ")} parse/script/task).`
  );
} finally {
  await browser?.close();
  if (preview.exitCode === null) {
    preview.kill();
    await Promise.race([
      new Promise((resolve) => preview.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 3_000)),
    ]);
  }
}
