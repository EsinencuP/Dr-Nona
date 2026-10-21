import { expect, test } from "@playwright/test";

test("home introduces Halo Complex before the category overview", async ({
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
  expect(hierarchy[2]).toContain("home-about");
  expect(hierarchy[3]).toContain("home-categories");
});

for (const locale of ["ru", "ro"]) {
  test(`${locale}: about section is distinct, centered and uses one consistent text block`, async ({ page }) => {
    await page.goto(`/${locale}`);
    const section = page.locator(".home-about");
    await expect(section.getByRole("heading", { level: 2 })).toHaveText(locale === "ro" ? "Despre noi" : "О нас");
    await expect(section.locator("p")).toHaveCount(1);
    for (const width of [320, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await section.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      const layout = await section.evaluate((element) => {
        const heading = element.querySelector("h2")!;
        const body = element.querySelector("p")!;
        const h = heading.getBoundingClientRect();
        const b = body.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          centered: Math.abs((h.left + h.right) / 2 - innerWidth / 2) <= 1,
          stacked: h.bottom <= b.top,
          titleSize: parseFloat(getComputedStyle(heading).fontSize),
          textSize: parseFloat(getComputedStyle(body).fontSize),
          background: style.backgroundColor,
          padding: parseFloat(style.paddingTop),
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        };
      });
      expect(layout.centered, `${width}px`).toBe(true);
      expect(layout.stacked).toBe(true);
      expect(layout.titleSize).toBeGreaterThanOrEqual(48);
      expect(layout.textSize).toBeGreaterThanOrEqual(18);
      expect(layout.background).toBe("rgb(255, 255, 255)");
      expect(layout.padding).toBeGreaterThanOrEqual(56);
      expect(layout.overflow).toBe(false);
    }
  });
}
