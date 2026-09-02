import { expect, test } from "@playwright/test";

const priorityRoutes = [
  "/",
  "/products",
  "/product/dynamic-hydrating-cream",
  "/about",
  "/ourformula",
  "/contactus",
];

type TypographyFinding = {
  selector: string;
  size: number;
  text: string;
};

async function typographyFindings(page: import("@playwright/test").Page) {
  return page.evaluate<TypographyFinding[]>(() => {
    const minimumTextPx = 14;
    const ignoredTags = new Set(["SCRIPT", "STYLE", "SVG", "SUP", "SUB"]);
    const selector = (element: Element) => {
      const name = element.tagName.toLowerCase();
      const id = element.id ? `#${element.id}` : "";
      const classes =
        element.classList.length > 0
          ? `.${[...element.classList].slice(0, 2).join(".")}`
          : "";
      return `${name}${id}${classes}`;
    };

    return [...document.querySelectorAll("body *")]
      .filter((element) => {
        if (
          ignoredTags.has(element.tagName) ||
          element.closest(".sr-only,[aria-hidden='true']")
        ) {
          return false;
        }
        const hasDirectText = [...element.childNodes].some(
          (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
        );
        if (!hasDirectText) return false;
        const style = getComputedStyle(element);
        const bounds = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0 &&
          bounds.width > 0 &&
          bounds.height > 0
        );
      })
      .map((element) => ({
        selector: selector(element),
        size: Number.parseFloat(getComputedStyle(element).fontSize),
        text: element.textContent?.trim().slice(0, 80) ?? "",
      }))
      .filter(({ size }) => size < minimumTextPx - 0.01);
  });
}

for (const route of priorityRoutes) {
  test(`important text stays at least 14px: ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.locator("main").waitFor();
    expect(await typographyFindings(page)).toEqual([]);
  });
}

test("320–1920px reflow includes a 200% zoom equivalent", async ({ page }) => {
  for (const width of [320, 640, 1920]) {
    await page.setViewportSize({ width, height: 900 });

    for (const route of priorityRoutes) {
      await page.goto(route);
      await page.locator("main").waitFor();
      const layout = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        mainVisible: Boolean(
          document.querySelector("main")?.getClientRects().length
        ),
        menuVisible:
          getComputedStyle(
            document.querySelector(".mobile-menu-button")!
          ).display !== "none",
      }));

      expect(layout.mainVisible, `${width}px ${route}`).toBe(true);
      expect(layout.menuVisible, `${width}px ${route}`).toBe(width < 1024);
      expect(await typographyFindings(page), `${width}px ${route}`).toEqual([]);
      expect(layout.documentWidth, `${width}px ${route}`).toBeLessThanOrEqual(
        layout.viewportWidth + 1
      );
    }
  }
});

test("WCAG text spacing does not clip interactive text", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of priorityRoutes) {
    await page.goto(route);
    await page.locator("main").waitFor();
    await page.addStyleTag({
      content: `
        * {
          line-height: 1.5 !important;
          letter-spacing: 0.12em !important;
          word-spacing: 0.16em !important;
        }
        p { margin-bottom: 2em !important; }
      `,
    });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    );

    const result = await page.evaluate(() => {
      const clippedInteractive = [
        ...document.querySelectorAll<HTMLElement>(
          "a, button, label, input, select, summary"
        ),
      ]
        .filter((element) => {
          const style = getComputedStyle(element);
          const bounds = element.getBoundingClientRect();
          const carriesVisibleText = Boolean(element.textContent?.trim());
          const isTextControl =
            element instanceof HTMLInputElement ||
            element instanceof HTMLSelectElement;
          return (
            element.getAttribute("aria-hidden") !== "true" &&
            (carriesVisibleText || isTextControl) &&
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            bounds.width > 0 &&
            bounds.height > 0 &&
            (element.scrollWidth > element.clientWidth + 1 ||
              element.scrollHeight > element.clientHeight + 1)
          );
        })
        .map((element) => ({
          tag: element.tagName,
          className: element.className,
          href: element instanceof HTMLAnchorElement ? element.getAttribute("href") : null,
          ariaHidden: element.getAttribute("aria-hidden"),
          client: [element.clientWidth, element.clientHeight],
          scroll: [element.scrollWidth, element.scrollHeight],
          text: element.textContent?.trim().slice(0, 80) ?? "",
        }));

      return {
        clippedInteractive,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      };
    });

    expect(result.clippedInteractive, route).toEqual([]);
    expect(result.documentWidth, route).toBeLessThanOrEqual(
      result.viewportWidth + 1
    );
  }
});
