import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/products",
  "/product/lord-deodorant",
  "/selection",
  "/contactus",
  "/certificates",
  "/about",
  "/ourformula",
];

for (const route of routes) {
  test(`axe WCAG A/AA: ${route}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    await page.locator("main").waitFor();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    await testInfo.attach("axe-results", {
      body: JSON.stringify(results, null, 2),
      contentType: "application/json",
    });
    expect(results.violations).toEqual([]);
  });
}

test("product breadcrumbs and visible information expose their relationships", async ({
  page,
}) => {
  await page.goto("/product/lord-deodorant");

  const breadcrumb = page.getByRole("navigation", {
    name: "Хлебные крошки",
  });
  await expect(breadcrumb.locator('span[aria-hidden="true"]')).toHaveCount(2);
  await expect(
    breadcrumb.getByText("Deodorant ( LORD )")
  ).toHaveAttribute("aria-current", "page");

  const overview = page.getByRole("heading", { level: 3, name: "О продукте" });
  const ingredients = page.getByRole("heading", { level: 3, name: "Состав" });
  await expect(overview).toBeVisible();
  await expect(ingredients).toBeVisible();
  await expect(overview.locator("xpath=ancestor::article[1]")).toHaveClass(
    /product-copy-card/
  );
  await expect(ingredients.locator("xpath=ancestor::article[1]")).toHaveClass(
    /product-copy-card/
  );
  await expect(page.getByRole("button", { name: "Состав" })).toHaveCount(0);
});
