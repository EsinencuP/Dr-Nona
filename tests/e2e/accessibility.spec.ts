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

test("product breadcrumbs and accordion expose their relationships", async ({
  page,
}) => {
  await page.goto("/product/lord-deodorant");

  const breadcrumb = page.getByRole("navigation", {
    name: "Хлебные крошки",
  });
  await expect(breadcrumb.locator('span[aria-hidden="true"]')).toHaveCount(2);
  await expect(
    breadcrumb.getByText("Deodorant Lord")
  ).toHaveAttribute("aria-current", "page");

  const trigger = page.getByRole("button", { name: "Состав" });
  const panelId = await trigger.getAttribute("aria-controls");
  expect(panelId).toBeTruthy();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  const panel = page.locator(`#${panelId}`);
  await expect(panel).toHaveAttribute("role", "region");
  await expect(panel).toHaveAttribute("aria-labelledby", await trigger.getAttribute("id") ?? "");

  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toBeHidden();
});
