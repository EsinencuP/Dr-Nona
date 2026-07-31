import { expect, test } from "@playwright/test";

const canonicalRoutes = [
  "/",
  "/products",
  "/product/lord-deodorant",
  "/selection",
  "/contactus",
  "/ourformula",
  "/about",
  "/editorial",
  "/privacypolicy",
  "/termsofuse",
];

const notFoundRoutes = ["/privacy-policy", "/terms", "/unknown-route"];

test("cleanup preserves canonical routes across direct navigation and refresh", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  const failedLocalAssets: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    if (new URL(request.url()).hostname === "127.0.0.1") {
      failedLocalAssets.push(request.url());
    }
  });

  for (const route of canonicalRoutes) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await page.reload();
    await expect(page.locator("main")).toBeVisible();
  }

  expect(pageErrors).toEqual([]);
  expect(failedLocalAssets).toEqual([]);
});

test("non-canonical and unknown routes show a controlled 404", async ({ page }) => {
  for (const route of notFoundRoutes) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Эта страница ушла за горизонт",
      })
    ).toBeVisible();
  }
});
