import { expect, test, type Page } from "@playwright/test";

const compositionViewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "tablet", width: 960, height: 900 },
  { name: "small-tablet", width: 640, height: 844 },
  { name: "mobile", width: 375, height: 812 },
] as const;

async function preparePage(page: Page, path: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  await page.locator("main").waitFor();
  await page.getByText("Загрузка страницы", { exact: true }).waitFor({
    state: "detached",
    timeout: 15_000,
  });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }
      .reveal { opacity: 1 !important; transform: none !important; }
    `,
  });
  await page.evaluate(async () => document.fonts.ready);
}

test.beforeEach(({ browserName }, testInfo) => {
  expect(browserName).toBe("chromium");
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "The composition matrix defines its own viewport sizes."
  );
});

test("home and selection keep the approved composition at priority widths", async ({
  page,
}) => {
  test.setTimeout(90_000);

  for (const viewport of compositionViewports) {
    await page.setViewportSize(viewport);
    await preparePage(page, "/");

    const homeLayout = await page.evaluate(() => {
      const hero = document.querySelector(".home-hero")!.getBoundingClientRect();
      const science = document.querySelector(".science-section")!.getBoundingClientRect();
      const grid = document.querySelector(".home-categories__grid")!;
      const clipped = [...grid.querySelectorAll("h3, p")].filter((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const text = range.getBoundingClientRect();
        const box = element.getBoundingClientRect();
        return text.left < box.left - 1 || text.right > box.right + 1 || text.bottom > box.bottom + 1;
      });
      return {
        heroBottom: hero.bottom,
        scienceTop: science.top,
        columns: getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length,
        clipped: clipped.map((element) => element.textContent),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(homeLayout.heroBottom).toBeGreaterThanOrEqual(viewport.height - 1);
    expect(homeLayout.scienceTop).toBeGreaterThanOrEqual(viewport.height - 1);
    expect(homeLayout.columns).toBe(viewport.width <= 960 ? 1 : 2);
    expect(homeLayout.clipped).toEqual([]);
    expect(homeLayout.overflow).toBe(false);
    await expect(page.locator(".home-categories .home-category")).toHaveCount(8);
    await expect(page.locator(".home-product-showcase, .home-campaign-grid")).toHaveCount(0);
    await expect(page.locator("main a[href^='/product/']")).toHaveCount(0);
    await page.getByRole("link", { name: "Весь каталог", exact: true }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50);

    await page.evaluate(() => {
      localStorage.setItem(
        "drnona-selection",
        JSON.stringify([
          "dynamic-hydrating-cream",
          "hand-and-nail-treatment",
          "gonseen",
        ])
      );
    });
    await preparePage(page, "/selection");
    await expect(page.locator(".selection-list article")).toHaveCount(3);

    const selectionLayout = await page.locator(".selection-list article").first().evaluate(
      (card) => {
        const media = card.querySelector<HTMLElement>(".selection-list__media");
        const picture = media?.querySelector<HTMLElement>(".product-picture");
        const copy = card.children.item(1) as HTMLElement | null;
        const remove = card.querySelector<HTMLButtonElement>("button");
        const cardRect = card.getBoundingClientRect();
        const mediaRect = media?.getBoundingClientRect();
        const pictureRect = picture?.getBoundingClientRect();
        const copyRect = copy?.getBoundingClientRect();
        const removeRect = remove?.getBoundingClientRect();
        return {
          mediaWidth: Math.round(mediaRect?.width ?? 0),
          pictureWidth: Math.round(pictureRect?.width ?? 0),
          pictureHeight: Math.round(pictureRect?.height ?? 0),
          mediaLeft: mediaRect?.left ?? 0,
          copyLeft: copyRect?.left ?? 0,
          copyRight: copyRect?.right ?? 0,
          removeLeft: removeRect?.left ?? 0,
          removeRight: removeRect?.right ?? 0,
          cardRight: cardRect.right,
          imageFit: media
            ? getComputedStyle(media.querySelector("img") as HTMLImageElement).objectFit
            : "",
        };
      }
    );

    expect(selectionLayout.mediaWidth).toBe(viewport.width <= 640 ? 100 : 160);
    expect(selectionLayout.pictureWidth).toBeGreaterThanOrEqual(
      selectionLayout.mediaWidth - 2
    );
    expect(selectionLayout.pictureHeight).toBeGreaterThanOrEqual(
      selectionLayout.mediaWidth - 2
    );
    expect(selectionLayout.mediaLeft).toBeLessThan(selectionLayout.copyLeft);
    expect(selectionLayout.copyRight).toBeLessThanOrEqual(selectionLayout.removeLeft);
    expect(selectionLayout.removeRight).toBeLessThanOrEqual(selectionLayout.cardRight + 1);
    expect(selectionLayout.imageFit).toBe("contain");
  }
});
