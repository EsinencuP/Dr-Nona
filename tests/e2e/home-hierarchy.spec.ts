import { expect, test } from "@playwright/test";

test("home introduces Halo Complex before product promotion", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Halo");

  await expect(
    page.getByRole("link", { name: "Открыть каталог", exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Исследовать формулу", exact: true })
  ).toHaveCount(0);

  const hierarchy = await page.locator("#main-content").evaluate((main) =>
    [...main.children]
      .filter((element) => element.tagName === "SECTION")
      .map((element) => element.className)
  );

  expect(hierarchy[0]).toContain("home-hero");
  expect(hierarchy[1]).toContain("science-section");
  expect(hierarchy[2]).toContain("home-product-showcase");
});
