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
      const hero = document.querySelector<HTMLElement>(".home-hero");
      const science = document.querySelector<HTMLElement>(".science-section");
      const spotlight = document.querySelector<HTMLElement>(
        ".home-product-spotlight > article"
      );
      const spotlightActions = document.querySelector<HTMLElement>(
        ".home-product-spotlight__actions"
      );
      const promo = document.querySelector<HTMLElement>(
        ".home-promo-banner > article"
      );
      const promoImage = promo?.querySelector<HTMLImageElement>("img");
      const promoContent = promo?.querySelector<HTMLElement>(
        ".home-promo-banner__content"
      );
      const lordImages = [
        ...document.querySelectorAll<HTMLImageElement>(
          ".home-lord-banner__visual img"
        ),
      ];
      const heroRect = hero?.getBoundingClientRect();
      const scienceRect = science?.getBoundingClientRect();
      const spotlightRect = spotlight?.getBoundingClientRect();
      const actionsRect = spotlightActions?.getBoundingClientRect();
      const promoStyle = promo ? getComputedStyle(promo) : null;
      const promoImageStyle = promoImage ? getComputedStyle(promoImage) : null;
      const promoImageRect = promoImage?.getBoundingClientRect();
      const promoContentRect = promoContent?.getBoundingClientRect();

      return {
        heroBottom: heroRect?.bottom ?? 0,
        scienceTop: scienceRect?.top ?? 0,
        viewportHeight: window.innerHeight,
        spotlightActionGap: spotlightRect && actionsRect
          ? Math.round(spotlightRect.bottom - actionsRect.bottom)
          : 999,
        promoColumns: promoStyle?.gridTemplateColumns ?? "",
        promoRows: promoStyle?.gridTemplateRows ?? "",
        promoImageTop: promoImageRect?.top ?? 0,
        promoImageLeft: promoImageRect?.left ?? 0,
        promoContentBottom: promoContentRect?.bottom ?? 0,
        promoContentRight: promoContentRect?.right ?? 0,
        promoImageFit: promoImageStyle?.objectFit ?? "",
        lordImageFits: lordImages.map((image) => getComputedStyle(image).objectFit),
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      };
    });

    expect(homeLayout.heroBottom, `${viewport.name}: hero fills first screen`).toBeGreaterThanOrEqual(
      viewport.height - 1
    );
    expect(homeLayout.scienceTop, `${viewport.name}: science below fold`).toBeGreaterThanOrEqual(
      homeLayout.viewportHeight - 1
    );
    expect(homeLayout.spotlightActionGap, `${viewport.name}: spotlight actions`).toBeLessThanOrEqual(
      viewport.width <= 640 ? 24 : 44
    );
    expect(homeLayout.promoImageFit).toBe("contain");
    expect(homeLayout.lordImageFits).toEqual(["contain", "contain"]);
    expect(homeLayout.documentWidth).toBeLessThanOrEqual(homeLayout.viewportWidth + 1);

    if (viewport.width <= 640) {
      expect(homeLayout.promoColumns.trim().split(/\s+/)).toHaveLength(1);
      expect(homeLayout.promoImageTop).toBeGreaterThanOrEqual(
        homeLayout.promoContentBottom - 1
      );
    } else {
      expect(homeLayout.promoColumns.trim().split(/\s+/)).toHaveLength(2);
      expect(homeLayout.promoImageLeft).toBeGreaterThanOrEqual(
        homeLayout.promoContentRight - 1
      );
    }

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
        const copy = card.children.item(1) as HTMLElement | null;
        const remove = card.querySelector<HTMLButtonElement>("button");
        const cardRect = card.getBoundingClientRect();
        const mediaRect = media?.getBoundingClientRect();
        const copyRect = copy?.getBoundingClientRect();
        const removeRect = remove?.getBoundingClientRect();
        return {
          mediaWidth: Math.round(mediaRect?.width ?? 0),
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
    expect(selectionLayout.mediaLeft).toBeLessThan(selectionLayout.copyLeft);
    expect(selectionLayout.copyRight).toBeLessThanOrEqual(selectionLayout.removeLeft);
    expect(selectionLayout.removeRight).toBeLessThanOrEqual(selectionLayout.cardRight + 1);
    expect(selectionLayout.imageFit).toBe("contain");
  }
});
