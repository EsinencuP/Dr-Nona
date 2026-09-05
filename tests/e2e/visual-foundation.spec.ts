import { expect, test } from "@playwright/test";

for (const locale of ["ru", "ro"]) {
  test(`${locale}: category labels and counts fit across the responsive matrix`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(`/${locale}/products`);
    await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50);
    await page.evaluate(() => document.fonts.ready);
    for (const width of [320, 375, 430, 720, 768, 1024, 1440, 1920, 2048]) {
      await page.setViewportSize({ width, height: 900 });
      const violations = await page.locator(".catalog-categories button").evaluateAll((buttons) =>
        buttons.flatMap((button) => {
          const label = button.querySelector("span");
          const count = button.querySelector("small");
          if (!label || !count) return ["Missing category label or count"];
          const range = document.createRange();
          range.selectNodeContents(label);
          const text = range.getBoundingClientRect();
          const countBox = count.getBoundingClientRect();
          const box = button.getBoundingClientRect();
          return text.right > countBox.left - 2 || text.left < box.left || countBox.right > box.right
            ? [button.textContent]
            : [];
        })
      );
      expect(violations, `${locale} at ${width}px`).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });

  test(`${locale}: mobile panel has an opaque surface and exits with Escape`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/${locale}`);
    const toggle = page.locator(".mobile-menu-button");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const panel = page.locator(".mobile-panel");
    await expect(panel).toBeVisible();
    const surface = await panel.evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, filter: style.backdropFilter };
    });
    expect(surface.background).toBe("rgb(247, 251, 252)");
    expect(surface.filter).toBe("none");
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
}

test("reduced motion removes reveal delays and hover displacement without hiding content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ru");
  await expect(page.locator("main h1")).toBeVisible();
  const reveal = await page.locator(".reveal").evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      return {
        opacity: style.opacity,
        stationary: style.transform === "none" || new DOMMatrixReadOnly(style.transform).isIdentity,
        delay: style.transitionDelay,
      };
    })
  );
  expect(reveal.length).toBeGreaterThan(0);
  expect(reveal.every((style) => style.opacity === "1" && style.stationary && style.delay === "0s")).toBe(true);
  const button = page.locator("main .button").first();
  await button.hover();
  expect(await button.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
});

test("primary button press remains visible under hover and respects reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/ru");
  const button = page.locator("main .button--primary").first();
  await button.hover();
  await page.mouse.down();
  await expect.poll(() => button.evaluate((element) => {
    const transform = getComputedStyle(element).transform;
    return transform === "none" ? 1 : new DOMMatrixReadOnly(transform).a;
  })).toBeLessThan(1);
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await button.hover();
  await page.mouse.down();
  await expect.poll(() => button.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
  await page.mouse.move(0, 0);
  await page.mouse.up();
});
