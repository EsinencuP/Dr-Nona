import { expect, test, type Page } from "@playwright/test";

const requiredViewports = [
  { name: "mobile-320", width: 320, height: 844 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 },
] as const;

const landscapeViewport = {
  name: "mobile-landscape",
  width: 844,
  height: 390,
} as const;

type ResponsiveFinding = {
  selector: string;
  text: string;
  width?: number;
  height?: number;
  left?: number;
  right?: number;
};

type ResponsiveHealth = {
  documentWidth: number;
  viewportWidth: number;
  clippedText: ResponsiveFinding[];
  smallTouchTargets: ResponsiveFinding[];
  overflowingElements: ResponsiveFinding[];
  clippedActions: ResponsiveFinding[];
  overlappingActions: Array<{
    first: string;
    second: string;
  }>;
};

async function preparePage(page: Page, path: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  await page.locator("main").waitFor();
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        scroll-behavior: auto !important;
      }
      .reveal { opacity: 1 !important; transform: none !important; }
      .product-card { content-visibility: visible !important; }
    `,
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map(async (image) => {
        image.loading = "eager";
        if (!image.complete) {
          await Promise.race([
            new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            }),
            new Promise<void>((resolve) => setTimeout(resolve, 5_000)),
          ]);
        }
        await image.decode().catch(() => undefined);
      })
    );
  });
}

async function responsiveHealth(
  page: Page,
  { checkTouchTargets = false } = {}
): Promise<ResponsiveHealth> {
  return page.evaluate(
    ({ checkTouchTargets }) => {
      const visible = (element: HTMLElement) => {
        const style = getComputedStyle(element);
        const bounds = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0 &&
          bounds.width > 0 &&
          bounds.height > 0
        );
      };
      const identify = (element: HTMLElement) => {
        const name = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : "";
        const classes = element.classList.length
          ? `.${[...element.classList].slice(0, 2).join(".")}`
          : "";
        return `${name}${id}${classes}`;
      };
      const finding = (element: HTMLElement): ResponsiveFinding => {
        const bounds = element.getBoundingClientRect();
        return {
          selector: identify(element),
          text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 90) ?? "",
          width: Math.round(bounds.width),
          height: Math.round(bounds.height),
          left: Math.round(bounds.left),
          right: Math.round(bounds.right),
        };
      };

      const criticalText = [
        ...document.querySelectorAll<HTMLElement>(
          [
            "h1",
            "h2",
            "h3",
            ".button",
            ".desktop-nav a",
            ".mobile-panel a",
            ".selection-link",
            ".mobile-filters-toggle",
            ".accordion-item > button",
            ".contact-direct__actions a",
            ".catalog-status",
            ".about-nav a",
          ].join(",")
        ),
      ].filter(visible);
      const clippedText = criticalText
        .filter((element) => {
          const style = getComputedStyle(element);
          const clipsX = ["hidden", "clip"].includes(style.overflowX);
          const clipsY = ["hidden", "clip"].includes(style.overflowY);
          return (
            (clipsX && element.scrollWidth > element.clientWidth + 1) ||
            (clipsY && element.scrollHeight > element.clientHeight + 1)
          );
        })
        .map(finding);

      const touchTargets = checkTouchTargets
        ? [
            ...document.querySelectorAll<HTMLElement>(
              [
                ".mobile-menu-button",
                ".selection-link",
                ".mobile-panel a",
                ".mobile-filters-toggle",
                ".catalog-toolbar input",
                ".catalog-toolbar select",
                ".button",
                ".save-button",
                ".product-card__actions .text-link",
                ".accordion-item > button",
                ".contact-direct__actions a",
                ".selection-list button",
                ".about-nav a",
              ].join(",")
            ),
          ].filter(visible)
        : [];
      const smallTouchTargets = touchTargets
        .filter((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.width < 44 - 0.5 || bounds.height < 44 - 0.5;
        })
        .map(finding);

      const actions = [
        ...new Set(
          document.querySelectorAll<HTMLElement>(
            "button, a.button, a.text-link, .mobile-menu-button, .selection-link"
          )
        ),
      ].filter(visible);
      const exposedActions = actions.filter((element) => {
        const bounds = element.getBoundingClientRect();
        if (
          bounds.bottom <= 0 ||
          bounds.top >= window.innerHeight ||
          bounds.right <= 0 ||
          bounds.left >= window.innerWidth
        ) {
          return false;
        }
        const centerX = Math.min(
          window.innerWidth - 1,
          Math.max(0, bounds.left + bounds.width / 2)
        );
        const centerY = Math.min(
          window.innerHeight - 1,
          Math.max(0, bounds.top + bounds.height / 2)
        );
        const topmost = document.elementFromPoint(centerX, centerY);
        return Boolean(topmost && (topmost === element || element.contains(topmost)));
      });
      const clippedActions = actions
        .filter((element) => {
          const bounds = element.getBoundingClientRect();
          let ancestor = element.parentElement;
          while (ancestor && ancestor !== document.body) {
            const style = getComputedStyle(ancestor);
            if (
              ["hidden", "clip"].includes(style.overflowX) ||
              ["hidden", "clip"].includes(style.overflowY)
            ) {
              const ancestorBounds = ancestor.getBoundingClientRect();
              if (
                bounds.left < ancestorBounds.left - 1 ||
                bounds.right > ancestorBounds.right + 1 ||
                bounds.top < ancestorBounds.top - 1 ||
                bounds.bottom > ancestorBounds.bottom + 1
              ) {
                return true;
              }
            }
            ancestor = ancestor.parentElement;
          }
          return false;
        })
        .map(finding);
      const overflowingElements =
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1
          ? [...document.querySelectorAll<HTMLElement>("body *")]
              .filter(visible)
              .filter((element) => {
                const bounds = element.getBoundingClientRect();
                return (
                  bounds.right > document.documentElement.clientWidth + 1 ||
                  bounds.left < -1
                );
              })
              .sort(
                (left, right) =>
                  right.getBoundingClientRect().right -
                  left.getBoundingClientRect().right
              )
              .slice(0, 20)
              .map(finding)
          : [];
      const overlappingActions = [];
      for (
        let firstIndex = 0;
        firstIndex < exposedActions.length;
        firstIndex += 1
      ) {
        for (
          let secondIndex = firstIndex + 1;
          secondIndex < exposedActions.length;
          secondIndex += 1
        ) {
          const first = exposedActions[firstIndex];
          const second = exposedActions[secondIndex];
          if (first.contains(second) || second.contains(first)) continue;
          const firstBounds = first.getBoundingClientRect();
          const secondBounds = second.getBoundingClientRect();
          const overlapWidth = Math.min(firstBounds.right, secondBounds.right) -
            Math.max(firstBounds.left, secondBounds.left);
          const overlapHeight = Math.min(firstBounds.bottom, secondBounds.bottom) -
            Math.max(firstBounds.top, secondBounds.top);
          if (overlapWidth > 1 && overlapHeight > 1) {
            overlappingActions.push({
              first: identify(first),
              second: identify(second),
            });
          }
        }
      }

      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        clippedText,
        smallTouchTargets,
        overflowingElements,
        clippedActions,
        overlappingActions,
      };
    },
    { checkTouchTargets }
  );
}

async function expectHealthyLayout(
  page: Page,
  label: string,
  checkTouchTargets: boolean
) {
  const health = await responsiveHealth(page, { checkTouchTargets });
  expect(
    health.overflowingElements,
    `${label}: elements outside the viewport`
  ).toEqual([]);
  expect(health.documentWidth, `${label}: document overflow`).toBeLessThanOrEqual(
    health.viewportWidth + 1
  );
  expect(health.clippedText, `${label}: clipped critical text`).toEqual([]);
  expect(health.clippedActions, `${label}: actions clipped by a parent`).toEqual(
    []
  );
  expect(health.overlappingActions, `${label}: overlapping actions`).toEqual([]);
  expect(health.smallTouchTargets, `${label}: touch targets below 44px`).toEqual(
    []
  );
}

async function runViewportContract(
  page: Page,
  viewport: { name: string; width: number; height: number }
) {
  const touch = viewport.width <= 1024;
  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height,
  });

  await preparePage(page, "/");
  await expect(page.locator(".home-hero h1")).toBeVisible();
  if (viewport.width <= 960) {
    const menu = page.locator(".mobile-menu-button");
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(
      page.getByRole("navigation", { name: "Мобильная навигация" })
    ).toBeVisible();
  } else {
    await expect(
      page.getByRole("navigation", { name: "Основная навигация" })
    ).toBeVisible();
  }
  await expect(page.locator(".site-footer")).toBeAttached();
  await expectHealthyLayout(page, `${viewport.name} home`, touch);

  await preparePage(page, "/products");
  if (viewport.width <= 640) {
    const filtersToggle = page.getByRole("button", {
      name: "Поиск и сортировка",
    });
    await expect(filtersToggle).toBeVisible();
    await filtersToggle.click();
  }
  await expect(
    page.getByRole("searchbox", { name: "Поиск по названию" })
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Все категории" })).toBeVisible();
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50);
  await page.evaluate(() => {
    document.documentElement.lang = "ro";
    const title = document.querySelector(".catalog-page h1");
    const status = document.querySelector(".catalog-status span");
    const selection = document.querySelector(".selection-link span");
    if (title) {
      title.textContent =
        "Catalogul complet al produselor pentru îngrijire zilnică Dr. Nona";
    }
    if (status) {
      status.textContent =
        "Produse disponibile pentru consultație personalizată în Republica Moldova";
    }
    if (selection) {
      selection.textContent = "Selecția personală";
    }
  });
  await expectHealthyLayout(page, `${viewport.name} catalog-long-ro`, touch);

  const search = page.getByRole("searchbox", { name: "Поиск по названию" });
  await search.fill("not-a-real-product");
  await expect(
    page.getByRole("heading", {
      name: "По этим параметрам ничего не найдено.",
    })
  ).toBeVisible();
  await expectHealthyLayout(page, `${viewport.name} catalog-empty`, touch);

  await preparePage(page, "/product/lord-deodorant");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Deodorant Lord",
    })
  ).toBeVisible();
  const accordionButtons = page.locator(".accordion-item > button");
  await expect(accordionButtons).toHaveCount(3);
  for (const button of await accordionButtons.all()) {
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
  }
  await page.evaluate(() => {
    const title = document.querySelector(".product-info h1");
    const firstAccordionLabel = document.querySelector(
      ".accordion-item button span"
    );
    if (title) {
      title.textContent =
        "Deodorant antiperspirant pentru protecție îndelungată și îngrijire zilnică";
    }
    if (firstAccordionLabel) {
      firstAccordionLabel.textContent =
        "Descriere completă și recomandări detaliate pentru utilizare";
    }
  });
  await expectHealthyLayout(page, `${viewport.name} product-long-ro`, touch);

  await page.addInitScript(() => {
    localStorage.removeItem("drnona-selection");
  });
  await preparePage(page, "/selection");
  await expect(
    page.getByRole("heading", { name: "В подборке пока нет продуктов" })
  ).toBeVisible();
  await expectHealthyLayout(page, `${viewport.name} selection-empty`, touch);

  await preparePage(page, "/contactus");
  await expect(
    page.getByRole("heading", { level: 1, name: "Контакты в Молдове" })
  ).toBeVisible();
  await expect(page.locator("form.application-form")).toHaveCount(1);
  await expect(page.locator(".contact-direct__actions a")).toHaveCount(3);
  await expectHealthyLayout(page, `${viewport.name} contact`, touch);

  await preparePage(page, "/about/company");
  await expect(
    page.getByRole("navigation", { name: "Разделы о компании" })
  ).toBeVisible();
  const aboutNavigationFindings = await page
    .locator(".page-intro .about-nav a")
    .evaluateAll((links) =>
      links.flatMap((link) => {
        const label = link.querySelector("span");
        const icon = link.querySelector("svg");
        if (!label || !icon) return ["missing label or icon"];
        const labelBounds = label.getBoundingClientRect();
        const iconBounds = icon.getBoundingClientRect();
        const findings: string[] = [];
        if (labelBounds.width < 60) findings.push("label column is too narrow");
        if (labelBounds.right > iconBounds.left - 4) {
          findings.push("label overlaps the arrow");
        }
        return findings;
      })
    );
  expect(
    aboutNavigationFindings,
    `${viewport.name}: about navigation geometry`
  ).toEqual([]);
  await expectHealthyLayout(page, `${viewport.name} about-company`, touch);

  await preparePage(page, "/bad-request");
  await expect(
    page.getByRole("heading", { name: "Ссылка повреждена" })
  ).toBeVisible();
  await expectHealthyLayout(page, `${viewport.name} controlled-error`, touch);
}

test.beforeEach(({ browserName }, testInfo) => {
  expect(browserName).toBe("chromium");
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "The viewport matrix runs once in Chromium and defines its own dimensions."
  );
});

test.describe("responsive viewport contracts", () => {
  test.describe.configure({ mode: "serial" });

  for (const viewport of [...requiredViewports, landscapeViewport]) {
    test(`responsive contract: ${viewport.name}`, async ({ page }) => {
      await runViewportContract(page, viewport);
    });
  }
});

test.describe("catalogue visual baselines", () => {
  test.describe.configure({ mode: "serial" });

  for (const viewport of requiredViewports) {
    test(`visual catalogue baseline: ${viewport.name}`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await preparePage(page, "/products");
      if (viewport.width <= 640) {
        await page
          .getByRole("button", { name: "Поиск и сортировка" })
          .click();
      }
      await expect(page.locator(".catalog-grid .product-card")).toHaveCount(50, {
        timeout: 15_000,
      });
      await page
        .locator(".catalog-grid .product-card img")
        .evaluateAll((images) =>
          images.forEach((image) => {
            (image as HTMLImageElement).loading = "eager";
          })
        );
      await page.locator(".site-footer").scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () =>
          Array.from(
            document.querySelectorAll<HTMLImageElement>(
              ".catalog-grid .product-card img"
            )
          ).every((image) => image.complete && image.naturalWidth > 0),
        undefined,
        { timeout: 60_000 }
      );
      await page.addStyleTag({
        content:
          ".catalog-grid .product-card { content-visibility: visible !important; }",
      });
      await page.evaluate(() => window.scrollTo(0, 0));

      await expect(page).toHaveScreenshot(`catalog-${viewport.name}.png`, {
        animations: "disabled",
        caret: "hide",
        fullPage: true,
        timeout: 15_000,
        maxDiffPixelRatio: 0.03,
        threshold: 0.35,
      });
    });
  }
});

test("200% zoom equivalent preserves priority actions", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 450 });
  for (const route of [
    "/",
    "/products",
    "/product/lord-deodorant",
    "/selection",
    "/contactus",
  ]) {
    await preparePage(page, route);
    if (route === "/products") {
      await page
        .getByRole("button", { name: "Поиск и сортировка" })
        .click();
    }
    await expectHealthyLayout(page, `200% zoom ${route}`, true);
  }
});
