import { defineConfig, devices } from "@playwright/test";

const playwrightPort = process.env.PLAYWRIGHT_PORT ?? "4173";
const playwrightBaseUrl = `http://127.0.0.1:${playwrightPort}`;
const playwrightServerCommand = process.env.PLAYWRIGHT_PRODUCTION === "1" ? "preview" : "dev";
const returningVisitorDecision = Date.now();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : "line",
  outputDir: "test-results",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  use: {
    baseURL: playwrightBaseUrl,
    // Existing navigation suites represent a returning visitor who declined optional data.
    // The privacy suite overrides this with a clean browser to exercise the first visit.
    storageState: {
      cookies: [],
      origins: [{ origin: playwrightBaseUrl, localStorage: [{
        name: "drnona-privacy-choice-v1",
        value: JSON.stringify({ version: 1, choice: "rejected", decidedAt: returningVisitorDecision,
          expiresAt: returningVisitorDecision + 180 * 24 * 60 * 60 * 1000 }),
      }] }],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command:
      process.platform === "win32"
        ? `npm.cmd run ${playwrightServerCommand} -- --host 127.0.0.1 --port ${playwrightPort}`
        : `npm run ${playwrightServerCommand} -- --host 127.0.0.1 --port ${playwrightPort}`,
    url: playwrightBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
