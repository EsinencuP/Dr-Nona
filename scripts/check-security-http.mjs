import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { createServer } from "node:net";
import {
  ENFORCED_CSP_HEADER,
  REPORT_ONLY_CSP_HEADER,
  getGlobalHeaders,
} from "./security-headers-lib.mjs";

const host = "127.0.0.1";
const configuration = JSON.parse(await readFile("vercel.json", "utf8"));
const expectedHeaders = getGlobalHeaders(configuration);
const port = await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.once("error", reject);
  probe.listen(0, host, () => {
    const address = probe.address();
    if (!address || typeof address === "string") {
      probe.close();
      reject(new Error("Security HTTP gate could not reserve a port."));
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
  const assets = (await readdir("dist/assets")).filter((file) =>
    /\.(?:js|css)$/.test(file)
  );
  const routes = [
    "/",
    "/products",
    "/product/lord-deodorant",
    "/blog/what-to-eat-after-coronavirus",
    "/contactus",
    "/definitely-missing",
    `/assets/${assets[0]}`,
  ];
  const errors = [];

  for (const route of routes) {
    const response = await fetch(`${origin}${route}`);
    if (!response.ok) {
      errors.push(`${route}: expected successful response, got ${response.status}.`);
      continue;
    }
    for (const [key, expected] of Object.entries(expectedHeaders)) {
      const actual = response.headers.get(key);
      if (actual !== expected) {
        errors.push(
          `${route}: ${key} mismatch; expected "${expected}", got "${
            actual ?? "(missing)"
          }".`
        );
      }
    }
    if (response.headers.has(REPORT_ONLY_CSP_HEADER)) {
      errors.push(`${route}: report-only CSP remained during enforced check.`);
    }
    if (!response.headers.has(ENFORCED_CSP_HEADER)) {
      errors.push(`${route}: enforced CSP is missing.`);
    }
  }

  const redirect = await fetch(`${origin}/main`, { redirect: "manual" });
  if (redirect.status !== 308) {
    errors.push(`/main: expected 308, received ${redirect.status}.`);
  }
  for (const [key, expected] of Object.entries(expectedHeaders)) {
    if (redirect.headers.get(key) !== expected) {
      errors.push(`/main: ${key} is inconsistent on the redirect response.`);
    }
  }

  if (errors.length) {
    throw new Error(`Security HTTP gate failed:\n- ${errors.join("\n- ")}`);
  }
  console.log(
    `Security HTTP gate: PASS (${routes.length} responses and /main redirect share the enforced policy).`
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
