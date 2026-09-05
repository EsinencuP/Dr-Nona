import { expect, test, type Page } from "@playwright/test";

async function expectReadableSelection(page: Page, context: string) {
  const violations = await page.locator(".selection-list article").evaluateAll((rows) =>
    rows.flatMap((row) => {
      const title = row.querySelector<HTMLElement>("h2");
      const remove = row.querySelector("button");
      if (!title || !remove) return ["Missing title or remove action"];
      const titleBox = title.getBoundingClientRect();
      const rowBox = row.getBoundingClientRect();
      const removeBox = remove.getBoundingClientRect();
      const clipped = title.scrollHeight > title.clientHeight + 1 || title.scrollWidth > title.clientWidth + 1;
      const overlap = titleBox.right > removeBox.left || titleBox.bottom > rowBox.bottom;
      const badTarget = removeBox.width < 44 || removeBox.height < 44 || removeBox.right > rowBox.right + 1;
      return clipped || overlap || badTarget ? [title.textContent] : [];
    })
  );
  expect(violations, context).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const locale of ["ru", "ro"]) {
  test(`${locale}: all selected product identities remain readable across widths and text spacing`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(`/${locale}/products`);
    await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50);
    const products = await page.locator(".catalog-grid .product-card h2 a").evaluateAll((links) =>
      links.map((link) => ({
        slug: new URL((link as HTMLAnchorElement).href).pathname.split("/").pop(),
        name: link.textContent,
      }))
    );
    expect(products).toHaveLength(50);
    await page.evaluate((slugs) => localStorage.setItem("drnona-selection", JSON.stringify(slugs)), products.map((product) => product.slug));
    await page.goto(`/${locale}/selection`);
    await expect(page.locator(".selection-list article")).toHaveCount(50);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.locator(".selection-list h2").allTextContents()).toEqual(products.map((product) => product.name));

    for (const width of [320, 375, 430, 720, 768, 1024, 1440, 1920, 2048]) {
      await page.setViewportSize({ width, height: 900 });
      await expectReadableSelection(page, `${locale} ${width}px`);
    }

    await page.setViewportSize({ width: 320, height: 812 });
    // Diagnostic text only: production content and persisted selection stay intact.
    await page.locator(".selection-list h2 a").first().evaluate((element, text) => {
      element.textContent = text;
    }, locale === "ru"
      ? "Очень длинное название выбранного продукта для проверки переносов и читаемости"
      : "Denumire foarte lungă a produsului selectat pentru verificarea lizibilității și a diacriticelor");
    await page.locator(".selection-list h2").evaluateAll((headings) => headings.forEach((heading) => {
      const element = heading as HTMLElement;
      element.style.lineHeight = "1.5";
      element.style.letterSpacing = "0.12em";
      element.style.wordSpacing = "0.16em";
    }));
    await expectReadableSelection(page, `${locale} long-string / text-spacing stress`);

    await page.emulateMedia({ reducedMotion: "reduce" });
    const remove = page.locator(".selection-list button").first();
    await remove.hover();
    await page.mouse.down();
    await expect.poll(() => remove.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
    await page.mouse.move(0, 0);
    await page.mouse.up();
  });
}
