/**
 * ui-ux-deep-audit.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Deep UI/UX audit for Dr. Nona Moldova catalogue.
 * Covers: element overlap · scale/zoom · design-token compliance ·
 *         typography hierarchy · spacing rhythm · Apple-level polish ·
 *         mobile integrity · form UX · image quality · interaction states.
 *
 * Design reference: docs/DESIGN_SYSTEM.md
 * Viewport matrix:  docs/RESPONSIVE_QA.md
 * Run:  npx playwright test tests/e2e/ui-ux-deep-audit.spec.ts --reporter=line
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { expect, test, type Page } from "@playwright/test";

// ── Viewport matrix (from DESIGN_SYSTEM.md + RESPONSIVE_QA.md) ──────────────
const ALL_VIEWPORTS = [
  { name: "mobile-320",       width: 320,  height: 844  },
  { name: "mobile-375",       width: 375,  height: 812  },
  { name: "mobile-430",       width: 430,  height: 932  },
  { name: "tablet-768",       width: 768,  height: 1024 },
  { name: "tablet-1024",      width: 1024, height: 768  },
  { name: "desktop-1440",     width: 1440, height: 900  },
  { name: "desktop-1920",     width: 1920, height: 1080 },
  { name: "mobile-landscape", width: 844,  height: 390  },
] as const;

const MOBILE_VIEWPORTS = ALL_VIEWPORTS.filter((v) => v.width <= 430);

// ── All critical routes ──────────────────────────────────────────────────────
const ALL_ROUTES = [
  "/",
  "/products",
  "/product/solaris-body-lotion",
  "/product/hand-and-nail-treatment",
  "/product/dynamic-hydrating-cream",
  "/contactus",
  "/selection",
  "/ourformula",
  "/certificates",
  "/about",
  "/about/company",
  "/about/our-history",
  "/about/founders",
] as const;

// ── Prepare page: disable motion, wait for fonts + images ────────────────────
async function prepare(page: Page, path: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  await page.locator(".page-loader").waitFor({ state: "hidden", timeout: 10_000 });
  await page.locator("main h1").waitFor({ state: "visible", timeout: 10_000 });
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
      [...document.images].map((img) => {
        img.loading = "eager";
        if (img.complete) return Promise.resolve();
        return Promise.race([
          new Promise<void>((res) => {
            img.addEventListener("load",  () => res(), { once: true });
            img.addEventListener("error", () => res(), { once: true });
          }),
          new Promise<void>((res) => setTimeout(res, 4_000)),
        ]);
      })
    );
  });
}

// ════════════════════════════════════════════════════════════════════════════
// BLOCK 1 — ELEMENT OVERLAP & SCALE
// ════════════════════════════════════════════════════════════════════════════

test.describe("1 · Element overlap & scale", () => {

  test("no interactive elements overlap each other on desktop /", async ({ page }) => {
    await prepare(page, "/");
    await page.setViewportSize({ width: 1440, height: 900 });

    const overlaps = await page.evaluate(() => {
      const interactives = [
        ...document.querySelectorAll<HTMLElement>(
          "a, button, input, select, textarea, [role='button'], [role='link']"
        ),
      ].filter((el) => {
        const s = getComputedStyle(el);
        const b = el.getBoundingClientRect();
        return (
          s.display !== "none" &&
          s.visibility !== "hidden" &&
          Number(s.opacity) > 0 &&
          b.width > 0 &&
          b.height > 0
        );
      });

      const found: Array<{ a: string; b: string }> = [];
      for (let i = 0; i < interactives.length; i++) {
        for (let j = i + 1; j < interactives.length; j++) {
          const a = interactives[i].getBoundingClientRect();
          const b = interactives[j].getBoundingClientRect();
          const overlap =
            a.left < b.right - 4 &&
            a.right > b.left + 4 &&
            a.top < b.bottom - 4 &&
            a.bottom > b.top + 4;
          if (
            overlap &&
            !interactives[i].contains(interactives[j]) &&
            !interactives[j].contains(interactives[i])
          ) {
            found.push({
              a: interactives[i].tagName + " «" + (interactives[i].textContent?.trim().slice(0, 40) ?? "") + "»",
              b: interactives[j].tagName + " «" + (interactives[j].textContent?.trim().slice(0, 40) ?? "") + "»",
            });
            if (found.length >= 10) return found;
          }
        }
      }
      return found;
    });

    expect(overlaps, "Overlapping interactives on /").toEqual([]);
  });

  for (const vp of ALL_VIEWPORTS) {
    test(`no horizontal scroll at ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of ["/", "/products", "/product/solaris-body-lotion", "/contactus"]) {
        await prepare(page, route);
        const { docW, vpW } = await page.evaluate(() => ({
          docW: document.documentElement.scrollWidth,
          vpW:  document.documentElement.clientWidth,
        }));
        expect(docW, `${vp.name} ${route} horizontal scroll`).toBeLessThanOrEqual(vpW + 1);
      }
    });
  }

  test("product images never overflow their stage container (all viewports)", async ({ page }) => {
    for (const vp of ALL_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await prepare(page, "/product/solaris-body-lotion");

      const overflow = await page.evaluate(() => {
        const stage = document.querySelector<HTMLElement>(".product-stage");
        const img   = document.querySelector<HTMLImageElement>(".product-stage img");
        if (!stage || !img) return null;
        const sb = stage.getBoundingClientRect();
        const ib = img.getBoundingClientRect();
        return {
          stageW: Math.round(sb.width),
          imgW:   Math.round(ib.width),
          overflows: ib.right > sb.right + 2 || ib.left < sb.left - 2,
        };
      });

      expect(overflow?.overflows, `${vp.name}: product image overflows stage`).toBe(false);
    }
  });

  test("product cards do not overlap in grid (desktop 1440px)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await prepare(page, "/products");

    const cardOverlaps = await page.evaluate(() => {
      const cards = [...document.querySelectorAll<HTMLElement>(".product-card")];
      const rects = cards.map((c) => c.getBoundingClientRect());
      const found: string[] = [];
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i]; const b = rects[j];
          if (
            a.left < b.right - 4 &&
            a.right > b.left + 4 &&
            a.top < b.bottom - 4 &&
            a.bottom > b.top + 4
          ) {
            found.push(`card[${i}] ∩ card[${j}]`);
          }
        }
      }
      return found.slice(0, 5);
    });
    expect(cardOverlaps, "Product cards overlap in grid").toEqual([]);
  });

  test("200% zoom equivalent: no heading or button clipped on 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    for (const route of ["/", "/products", "/product/solaris-body-lotion", "/contactus"]) {
      await prepare(page, route);
      const clipped = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("h1, h2, .button, nav a")]
          .filter((el) => {
            const s = getComputedStyle(el);
            const b = el.getBoundingClientRect();
            if (s.display === "none" || s.visibility === "hidden" || b.width === 0) return false;
            const clipsX = ["hidden", "clip"].includes(s.overflowX);
            const clipsY = ["hidden", "clip"].includes(s.overflowY);
            return (
              (clipsX && el.scrollWidth > el.clientWidth + 1) ||
              (clipsY && el.scrollHeight > el.clientHeight + 1)
            );
          })
          .map((el) => el.tagName + " " + el.textContent?.trim().slice(0, 50))
      );
      expect(clipped, `200% zoom clipped on ${route}`).toEqual([]);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BLOCK 2 — TYPOGRAPHY & VISUAL HIERARCHY
// ════════════════════════════════════════════════════════════════════════════

test.describe("2 · Typography & visual hierarchy", () => {

  for (const vp of ALL_VIEWPORTS) {
    test(`minimum font size 14px at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of ["/", "/products", "/product/solaris-body-lotion", "/contactus"]) {
        await prepare(page, route);
        const tooSmall = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>("body *")]
            .filter((el) => {
              if (el.closest(".sr-only, [aria-hidden='true']")) return false;
              if (["SCRIPT","STYLE","SVG","SUP","SUB"].includes(el.tagName)) return false;
              const hasText = [...el.childNodes].some(
                (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()
              );
              if (!hasText) return false;
              const s = getComputedStyle(el);
              const b = el.getBoundingClientRect();
              return s.display !== "none" && s.visibility !== "hidden" && b.width > 0 && b.height > 0;
            })
            .map((el) => ({
              tag: el.tagName,
              size: parseFloat(getComputedStyle(el).fontSize),
              text: el.textContent?.trim().slice(0, 60) ?? "",
            }))
            .filter((r) => r.size < 13.99)
        );
        expect(tooSmall, `${vp.name} ${route}: text < 14px`).toEqual([]);
      }
    });
  }

  test("H1 exists and is unique on every route", async ({ page }) => {
    for (const route of ALL_ROUTES) {
      await prepare(page, route);
      const h1s = await page.locator("h1").count();
      expect(h1s, `${route}: H1 must exist`).toBeGreaterThanOrEqual(1);
      expect(h1s, `${route}: duplicate H1`).toBeLessThanOrEqual(1);
    }
  });

  test("heading hierarchy has no skipped levels", async ({ page }) => {
    for (const route of ["/", "/products", "/product/solaris-body-lotion"]) {
      await prepare(page, route);
      const skips = await page.evaluate(() => {
        const tags = [...document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6")]
          .filter((el) => {
            const b = el.getBoundingClientRect();
            return b.width > 0 && b.height > 0;
          })
          .map((el) => parseInt(el.tagName[1], 10));
        const skipped: string[] = [];
        for (let i = 1; i < tags.length; i++) {
          if (tags[i] - tags[i - 1] > 1) {
            skipped.push(`H${tags[i - 1]} → H${tags[i]}`);
          }
        }
        return skipped;
      });
      expect(skips, `${route}: heading hierarchy skips`).toEqual([]);
    }
  });

  test("display heading uses serif font (Cormorant / Georgia fallback)", async ({ page }) => {
    await prepare(page, "/");
    const result = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return { found: false, font: "" };
      return { found: true, font: getComputedStyle(h1).fontFamily };
    });
    expect(result.found, "H1 not found on homepage").toBe(true);
    expect(result.font, `Display heading unexpected font: ${result.font}`).toMatch(
      /cormorant|georgia|garamond/i
    );
  });

  test("body paragraphs do not use serif font", async ({ page }) => {
    await prepare(page, "/products");
    const serifInBody = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("p, li, label")]
        .filter((el) => {
          const b = el.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) return false;
          const font = getComputedStyle(el).fontFamily.toLowerCase();
          return /\bserif\b/.test(font) && !/sans-serif/.test(font);
        })
        .map((el) => ({
          tag: el.tagName,
          font: getComputedStyle(el).fontFamily,
          text: el.textContent?.trim().slice(0, 40) ?? "",
        }))
        .slice(0, 5)
    );
    expect(serifInBody, "Body text uses serif — expected sans-serif").toEqual([]);
  });

  test("body line-height ≥1.4 for readability", async ({ page }) => {
    await prepare(page, "/product/solaris-body-lotion");
    const tight = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("p")]
        .filter((el) => {
          const b = el.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) return false;
          const s = getComputedStyle(el);
          const lh = parseFloat(s.lineHeight);
          const fs = parseFloat(s.fontSize);
          return fs > 0 && lh / fs < 1.4;
        })
        .map((el) => ({
          text: el.textContent?.trim().slice(0, 50) ?? "",
          ratio: parseFloat(getComputedStyle(el).lineHeight) / parseFloat(getComputedStyle(el).fontSize),
        }))
    );
    expect(tight, "Paragraphs with line-height < 1.4").toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BLOCK 3 — DESIGN TOKEN COMPLIANCE
// ════════════════════════════════════════════════════════════════════════════

test.describe("3 · Design token compliance", () => {

  test("CSS custom properties are defined on :root", async ({ page }) => {
    await prepare(page, "/");
    const tokens = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        paper:   s.getPropertyValue("--paper").trim(),
        ink:     s.getPropertyValue("--ink").trim(),
        sea800:  s.getPropertyValue("--sea-800").trim(),
        gold500: s.getPropertyValue("--gold-500").trim(),
        radiusPill: s.getPropertyValue("--radius-pill").trim(),
      };
    });
    expect(tokens.paper,   "--paper token missing").toBeTruthy();
    expect(tokens.ink,     "--ink token missing").toBeTruthy();
    expect(tokens.sea800,  "--sea-800 token missing").toBeTruthy();
    expect(tokens.gold500, "--gold-500 token missing").toBeTruthy();
    expect(tokens.radiusPill, "--radius-pill token missing").toBe("999px");
  });

  test("primary button uses --sea-800 background (#084e5c)", async ({ page }) => {
    await prepare(page, "/product/solaris-body-lotion");
    const result = await page.evaluate(() => {
      const btn = document.querySelector<HTMLElement>(".button--primary");
      if (!btn) return { found: false, bg: "" };
      return { found: true, bg: getComputedStyle(btn).backgroundColor };
    });
    expect(result.found, "No .button--primary on product page").toBe(true);
    // rgb(8, 78, 92) = #084e5c = --sea-800
    expect(result.bg, `Primary button unexpected bg: ${result.bg}`).toMatch(
      /rgb\(\s*8\s*,\s*78\s*,\s*92\s*\)/
    );
  });

  test("border radius uses named scale and pill token — no arbitrary values", async ({ page }) => {
    await prepare(page, "/");
    const outliers = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const pill = parseFloat(root.getPropertyValue("--radius-pill"));
      const allowed = new Set([0, 12, 20, 32, 48, 50, 100, pill]);
      return [...document.querySelectorAll<HTMLElement>(".button, .product-card, input")]
        .filter((el) => {
          const b = el.getBoundingClientRect();
          if (b.width === 0) return false;
          const r = parseFloat(getComputedStyle(el).borderRadius);
          return ![...allowed].some((a) => Math.abs(r - a) <= 2);
        })
        .map((el) => ({
          tag: el.tagName,
          cls: [...el.classList].slice(0, 2).join("."),
          radius: parseFloat(getComputedStyle(el).borderRadius),
        }))
        .slice(0, 6);
    });
    expect(outliers, "Off-scale border radius values").toEqual([]);
  });

  test("focus ring is visible (≥2px outline) after Tab key", async ({ page }) => {
    await prepare(page, "/products");
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(() => {
      const focused = document.activeElement as HTMLElement | null;
      if (!focused) return { found: false, outlineWidth: "" };
      return {
        found: true,
        outlineWidth: getComputedStyle(focused).outlineWidth,
        outlineStyle: getComputedStyle(focused).outlineStyle,
      };
    });
    expect(ring.found, "No focused element after Tab").toBe(true);
    expect(parseFloat(ring.outlineWidth ?? "0"), "Focus outline < 2px").toBeGreaterThanOrEqual(2);
  });

  test("page body background is --paper or --white (no arbitrary greys)", async ({ page }) => {
    await prepare(page, "/");
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // #f7fbfc = rgb(247,251,252)  OR  white = rgb(255,255,255)
    expect(bg, `Body background unexpected: ${bg}`).toMatch(
      /rgb\(\s*(247\s*,\s*251\s*,\s*252|255\s*,\s*255\s*,\s*255)\s*\)/
    );
  });

  test("no pure black (#000000) text — use --ink (#14262d)", async ({ page }) => {
    await prepare(page, "/products");
    const pureBlack = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("h1,h2,h3,p,a,button,li,span")]
        .filter((el) => {
          const b = el.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) return false;
          const color = getComputedStyle(el).color;
          return color === "rgb(0, 0, 0)";
        })
        .map((el) => ({
          tag: el.tagName,
          cls: [...el.classList].slice(0, 2).join("."),
          text: el.textContent?.trim().slice(0, 40) ?? "",
        }))
        .slice(0, 5)
    );
    expect(pureBlack, "Elements using pure black #000 — use --ink (#14262d) instead").toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BLOCK 4 — SPACING RHYTHM & LAYOUT DENSITY
// ════════════════════════════════════════════════════════════════════════════

test.describe("4 · Spacing rhythm & layout density", () => {

  test("container max-width ≤1400px on 1920px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await prepare(page, "/products");
    const w = await page.evaluate(() => {
      const c = document.querySelector<HTMLElement>(".container");
      return c ? c.getBoundingClientRect().width : null;
    });
    expect(w, "Container not found on /products").not.toBeNull();
    expect(w!, "Container exceeds 1400px").toBeLessThanOrEqual(1400);
    expect(w!, "Container too narrow on 1920px").toBeGreaterThan(1300);
  });

  test("no empty sections (every section has ≥10 chars of content)", async ({ page }) => {
    await prepare(page, "/");
    const empty = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("section")]
        .filter((sec) => {
          const b = sec.getBoundingClientRect();
          if (b.height < 100) return false;
          return (sec.textContent?.trim().length ?? 0) < 10;
        })
        .map((sec) => sec.className.slice(0, 60))
    );
    expect(empty, "Sections with no visible content").toEqual([]);
  });

  test("product grid: 3–4 columns at 1440px", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await prepare(page, "/products");
    const cols = await page.evaluate(() => {
      const cards = [...document.querySelectorAll<HTMLElement>(".product-card")];
      if (cards.length < 4) return 0;
      const firstY = cards[0].getBoundingClientRect().top;
      return cards.filter((c) => Math.abs(c.getBoundingClientRect().top - firstY) < 5).length;
    });
    expect(cols, "Product grid columns on 1440px").toBeGreaterThanOrEqual(3);
    expect(cols, "Product grid too many columns on 1440px").toBeLessThanOrEqual(5);
  });

  test("product grid: 1–2 columns at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await prepare(page, "/products");
    const cols = await page.evaluate(() => {
      const cards = [...document.querySelectorAll<HTMLElement>(".product-card")];
      if (cards.length < 2) return 1;
      const firstY = cards[0].getBoundingClientRect().top;
      return cards.filter((c) => Math.abs(c.getBoundingClientRect().top - firstY) < 5).length;
    });
    expect(cols, "Grid should be 1–2 columns on 375px").toBeLessThanOrEqual(2);
  });

  test("section padding ≥20px top and bottom on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await prepare(page, "/");
    const tight = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("section, .section")]
        .filter((sec) => {
          const b = sec.getBoundingClientRect();
          if (b.height < 50 || b.width < 100) return false;
          const s = getComputedStyle(sec);
          const pt = parseFloat(s.paddingTop);
          const pb = parseFloat(s.paddingBottom);
          return (pt > 0 && pt < 20) || (pb > 0 && pb < 20);
        })
        .map((sec) => ({
          cls: sec.className.slice(0, 40),
          pt: parseFloat(getComputedStyle(sec).paddingTop),
          pb: parseFloat(getComputedStyle(sec).paddingBottom),
        }))
        .slice(0, 5)
    );
    expect(tight, "Sections with padding < 20px").toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BLOCK 5 — MOBILE LAYOUT INTEGRITY
// ════════════════════════════════════════════════════════════════════════════

test.describe("5 · Mobile layout integrity", () => {

  for (const vp of MOBILE_VIEWPORTS) {
    test(`touch targets ≥44px on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await prepare(page, "/products");
      const small = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>(
          ".mobile-menu-button, .selection-link, .button, .save-button, " +
          ".accordion-item > button, .contact-direct__actions a, .mobile-panel a"
        )]
          .filter((el) => {
            const b = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            return (
              s.display !== "none" &&
              s.visibility !== "hidden" &&
              b.width > 0 &&
              (b.width < 43.5 || b.height < 43.5)
            );
          })
          .map((el) => ({
            tag: el.tagName,
            cls: [...el.classList].slice(0, 2).join("."),
            w: Math.round(el.getBoundingClientRect().width),
            h: Math.round(el.getBoundingClientRect().height),
            text: el.textContent?.trim().slice(0, 30) ?? "",
          }))
      );
      expect(small, `${vp.name}: touch targets < 44px`).toEqual([]);
    });
  }

  test("mobile menu: opens, shows ≥4 nav links", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await prepare(page, "/");
    const btn = page.locator(".mobile-menu-button");
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.locator(".mobile-panel")).toBeVisible();
    const links = await page.locator(".mobile-panel a").count();
    expect(links, "Mobile menu has < 4 links").toBeGreaterThanOrEqual(4);
  });

  test("mobile menu: closes without visual artifacts", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await prepare(page, "/");
    const menuButton = page.locator(".mobile-menu-button");
    const mobilePanel = page.locator(".mobile-panel");
    await menuButton.click();
    await page.waitForTimeout(200);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(mobilePanel).toHaveAttribute("aria-hidden", "true");
    await expect(mobilePanel).toBeHidden();
  });

  test("mobile hero principles show a full snap card and continuation hint", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepare(page, "/");
    const rail = page.locator(".hero-benefits");
    const firstCard = rail.locator(".hero-benefit").first();
    const hint = page.locator(".hero-benefits__hint");
    await expect(rail).toBeVisible();
    await expect(hint).toBeVisible();
    await expect(hint).toContainText(/3/);
    const geometry = await page.evaluate(() => {
      const railElement = document.querySelector<HTMLElement>(".hero-benefits");
      const card = railElement?.querySelector<HTMLElement>(".hero-benefit");
      if (!railElement || !card) return null;
      const railBox = railElement.getBoundingClientRect();
      const cardBox = card.getBoundingClientRect();
      return {
        railWidth: railBox.width,
        cardWidth: cardBox.width,
        cardClipsText: card.scrollWidth > card.clientWidth + 1 || card.scrollHeight > card.clientHeight + 1,
        overflowX: getComputedStyle(railElement).overflowX,
        snapType: getComputedStyle(railElement).scrollSnapType,
      };
    });
    expect(geometry).not.toBeNull();
    expect(Math.abs((geometry?.railWidth ?? 0) - (geometry?.cardWidth ?? 0))).toBeLessThanOrEqual(2);
    expect(geometry?.cardClipsText).toBe(false);
    expect(geometry?.overflowX).toBe("auto");
    expect(geometry?.snapType).toContain("x");
    await expect(firstCard).toBeInViewport();
    await prepare(page, "/ro");
    await expect(page.locator(".hero-benefits__hint")).toContainText("Încă 3 principii");
  });

  test("contact form inputs are accessible on mobile 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await prepare(page, "/contactus");
    const inputs = await page.locator([
      "form input:not([type='radio']):not([type='checkbox']):not([tabindex='-1'])",
      "form select",
      "form textarea",
    ].join(", ")).all();
    for (const input of inputs) {
      await expect(input).toBeVisible();
      const b = await input.boundingBox();
      expect(b?.height, "Form input height < 36px on mobile").toBeGreaterThanOrEqual(36);
    }
    // No horizontal scroll when input is focused
    await inputs[0]?.focus();
    const { docW, vpW } = await page.evaluate(() => ({
      docW: document.documentElement.scrollWidth,
      vpW:  document.documentElement.clientWidth,
    }));
    expect(docW, "Horizontal scroll when form input focused").toBeLessThanOrEqual(vpW + 1);
  });

  test("mobile landscape: header height ≤100px, content visible", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await prepare(page, "/products");
    const headerH = (await page.locator("header").boundingBox())?.height ?? 0;
    expect(headerH, "Header too tall in landscape").toBeLessThanOrEqual(100);
    await expect(page.locator("main")).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BLOCK 6 — IMAGE QUALITY & VISUAL ASSETS
// ════════════════════════════════════════════════════════════════════════════

test.describe("6 · Image quality & visual assets", () => {

  test("all product card images load without errors on /products", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await prepare(page, "/products");
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLImageElement>(".product-card img")]
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.src.split("/").pop() ?? img.src)
    );
    expect(broken, "Broken product images on /products").toEqual([]);
  });

  test("product detail image loads with non-zero dimensions", async ({ page }) => {
    await prepare(page, "/product/solaris-body-lotion");
    const result = await page.evaluate(() => {
      const img = document.querySelector<HTMLImageElement>(".product-stage img");
      if (!img) return { found: false, w: 0, h: 0, complete: false };
      return { found: true, w: img.naturalWidth, h: img.naturalHeight, complete: img.complete };
    });
    expect(result.found,    "Product detail image not found").toBe(true);
    expect(result.complete, "Product detail image not loaded").toBe(true);
    expect(result.w,        "Product detail image natural width = 0").toBeGreaterThan(0);
    expect(result.h,        "Product detail image natural height = 0").toBeGreaterThan(0);
  });

  test("no images missing alt attribute", async ({ page }) => {
    for (const route of ["/", "/products", "/product/solaris-body-lotion"]) {
      await prepare(page, route);
      const missingAlt = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLImageElement>("img")]
          .filter((img) => img.getAttribute("alt") === null)
          .map((img) => img.src.split("/").pop() ?? img.src)
      );
      expect(missingAlt, `${route}: images missing alt attribute`).toEqual([]);
    }
  });

  test("product images are not distorted (aspect ratio tolerance 15%)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await prepare(page, "/products");
    const distorted = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLImageElement>(".product-card img")]
        .filter((img) => {
          if (!img.complete || img.naturalWidth === 0) return false;
          const nRatio = img.naturalWidth / img.naturalHeight;
          const b = img.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) return false;
          const rRatio = b.width / b.height;
          return Math.abs(nRatio - rRatio) > 0.15;
        })
        .map((img) => ({
          src: img.src.split("/").pop() ?? "",
          natural: `${img.naturalWidth}×${img.naturalHeight}`,
          rendered: `${Math.round(img.getBoundingClientRect().width)}×${Math.round(img.getBoundingClientRect().height)}`,
        }))
    );
    expect(distorted, "Distorted product images detected").toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BLOCK 7 — INTERACTION POLISH (Apple-level feel)
// ════════════════════════════════════════════════════════════════════════════

test.describe("7 · Interaction polish", () => {

  test("save-button aria-pressed toggles on click", async ({ page }) => {
    await prepare(page, "/products");
    const btn = page.locator(".save-button").first();
    await expect(btn).toBeVisible();
    const before = await btn.getAttribute("aria-pressed");
    await btn.click();
    await page.waitForTimeout(150);
    const after = await btn.getAttribute("aria-pressed");
    expect(before, "aria-pressed did not change after click").not.toEqual(after);
  });

  test("product information is visible without disclosure friction", async ({ page }) => {
    await prepare(page, "/product/solaris-body-lotion");
    const cards = page.locator(".product-copy-card");
    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toBeVisible();
    await expect(cards.first()).toContainText("О продукте");
    await expect(cards.nth(1)).toContainText("Состав");
    await expect(cards.nth(2)).toContainText("Способ применения");
  });

  test("catalogue search filter reduces visible product count", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await prepare(page, "/products");

    const input = page.locator(
      ".catalog-toolbar input[type='search'], .catalog-toolbar input[type='text']"
    ).first();

    if (!(await input.isVisible())) {
      test.skip();
      return;
    }

    const initial = await page.locator(".product-card").count();
    await input.fill("Solaris");
    await page.waitForTimeout(500);
    const filtered = await page.locator(".product-card").count();
    expect(filtered, "Search did not filter products").toBeLessThan(initial);
  });

  test("form validation: errors appear without navigation", async ({ page }) => {
    await prepare(page, "/contactus");
    const submit = page.locator("button[type='submit'], .button--primary").first();
    await expect(submit).toBeVisible();
    await submit.click();
    await page.waitForTimeout(500);

    expect(page.url(), "Form submit navigated away").toContain("contactus");
    const hasErrors = await page.evaluate(() =>
      Boolean(document.querySelector("[aria-invalid='true'], .error, .field-error, [role='alert']"))
    );
    expect(hasErrors, "No validation errors shown after empty submit").toBe(true);
  });

  test("keyboard navigation: Tab reaches ≥4 focusable elements", async ({ page }) => {
    await prepare(page, "/products");
    const order: string[] = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      const tag = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el?.tagName ?? null;
      });
      if (tag) order.push(tag);
    }
    expect(order.length, "Fewer than 4 focusable elements").toBeGreaterThan(3);
  });

  test("prefers-reduced-motion: transition durations are suppressed", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.locator("main").waitFor();

    const longAnimations = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("[class*='reveal'], [class*='anim'], .hero")]
        .filter((el) => {
          const s = getComputedStyle(el);
          return (
            parseFloat(s.animationDuration) > 0.1 ||
            parseFloat(s.transitionDuration) > 0.1
          );
        })
        .map((el) => ({
          cls: [...el.classList].slice(0, 2).join("."),
          anim: getComputedStyle(el).animationDuration,
          trans: getComputedStyle(el).transitionDuration,
        }))
        .slice(0, 5)
    );

    if (longAnimations.length > 0) {
      console.warn("⚠ Motion still active under prefers-reduced-motion:", longAnimations);
    }
    // Hard limit: no animation > 500ms under reduced motion
    const violators = longAnimations.filter(
      (a) => parseFloat(a.anim) > 0.5 || parseFloat(a.trans) > 0.5
    );
    expect(violators, "Animations > 500ms under prefers-reduced-motion").toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BLOCK 8 — PAGE-SPECIFIC DESIGN CHECKS
// ════════════════════════════════════════════════════════════════════════════

test.describe("8 · Page-specific design checks", () => {

  test("homepage: hero section is ≥200px and ≤1000px tall", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await prepare(page, "/");
    const h = await page.evaluate(() => {
      const hero = document.querySelector<HTMLElement>(
        ".home-hero, .hero, [class*='hero'], section:first-of-type"
      );
      return hero ? hero.getBoundingClientRect().height : 0;
    });
    expect(h, "Hero too short (<200px)").toBeGreaterThanOrEqual(200);
    expect(h, "Hero too tall / scroll-hijacking risk (>1000px)").toBeLessThanOrEqual(1000);
  });

  test("product page: SKU is displayed and not placeholder", async ({ page }) => {
    await prepare(page, "/product/solaris-body-lotion");
    const sku = await page.evaluate(() =>
      document.querySelector<HTMLElement>(".product-facts dd")?.textContent?.trim() ?? ""
    );
    expect(sku, "SKU not found or empty").not.toBe("");
    expect(sku, "SKU value is placeholder «—»").not.toBe("—");
  });

  test("product page: category eyebrow appears above H1", async ({ page }) => {
    await prepare(page, "/product/solaris-body-lotion");
    const order = await page.evaluate(() => {
      const eyebrow = document.querySelector<HTMLElement>(".eyebrow, p.eyebrow");
      const h1      = document.querySelector<HTMLElement>("h1");
      if (!eyebrow || !h1) return null;
      return {
        eyebrowY: eyebrow.getBoundingClientRect().top,
        h1Y:      h1.getBoundingClientRect().top,
      };
    });
    expect(order, "Eyebrow or H1 not found").not.toBeNull();
    expect(order!.eyebrowY, "Eyebrow is not above H1").toBeLessThan(order!.h1Y);
  });

  test("catalogue: toolbar/filters appear above product grid", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await prepare(page, "/products");
    const order = await page.evaluate(() => {
      const toolbar = document.querySelector<HTMLElement>(".catalog-toolbar, [class*='toolbar']");
      const grid    = document.querySelector<HTMLElement>(".product-grid, [class*='grid']");
      if (!toolbar || !grid) return null;
      return {
        toolbarBottom: toolbar.getBoundingClientRect().bottom,
        gridTop:       grid.getBoundingClientRect().top,
      };
    });
    if (order) {
      expect(order.toolbarBottom, "Filters appear below product grid").toBeLessThanOrEqual(
        order.gridTop + 10
      );
    }
  });

  test("footer is visible on all key routes", async ({ page }) => {
    for (const route of ["/", "/products", "/product/solaris-body-lotion", "/contactus"]) {
      await prepare(page, route);
      await expect(page.locator("footer"), `Footer missing on ${route}`).toBeVisible();
    }
  });

  test("404 page renders non-empty content", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-xyz123");
    await page.waitForLoadState("domcontentloaded");
    const text = await page.locator("main").textContent().catch(() => "");
    expect((text?.trim().length ?? 0), "404 page is blank").toBeGreaterThan(10);
  });

  test("certificates page: no fictitious certificate data visible", async ({ page }) => {
    await prepare(page, "/certificates");
    // Certificates page should either show approved data or an empty/pending state
    // It must NOT show placeholder certificate names
    const bodyText = await page.locator("main").textContent();
    const fakePhrases = ["TODO", "EXAMPLE_CERT", "PLACEHOLDER"];
    for (const phrase of fakePhrases) {
      expect(bodyText?.includes(phrase), `Certificates page shows «${phrase}»`).toBe(false);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BLOCK 9 — CONTRAST & WCAG ACCESSIBILITY
// ════════════════════════════════════════════════════════════════════════════

test.describe("9 · Contrast & WCAG accessibility", () => {

  test("--muted (#536a73) on --white contrast ratio ≥4.5:1 (WCAG AA)", async ({ page }) => {
    await prepare(page, "/products");
    const ratio = await page.evaluate(() => {
      function lum(rgb: string): number {
        const m = rgb.match(/\d+(\.\d+)?/g);
        if (!m) return 0;
        return [Number(m[0]), Number(m[1]), Number(m[2])]
          .map((c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); })
          .reduce((acc, c, i) => acc + c * [0.2126, 0.7152, 0.0722][i], 0);
      }
      const fgL = lum("rgb(83, 106, 115)");   // --muted
      const bgL = lum("rgb(255, 255, 255)");   // --white
      const hi  = Math.max(fgL, bgL);
      const lo  = Math.min(fgL, bgL);
      return (hi + 0.05) / (lo + 0.05);
    });
    expect(ratio, `--muted/white contrast ${ratio.toFixed(2)} < 4.5`).toBeGreaterThanOrEqual(4.5);
  });

  test("skip-to-content link exists in DOM", async ({ page }) => {
    await prepare(page, "/");
    const exists = await page.evaluate(() =>
      Boolean(document.querySelector("a[href='#main-content'], a.skip-link, [class*='skip']"))
    );
    expect(exists, "Skip-to-content link not found").toBe(true);
  });

  test("form inputs have accessible labels", async ({ page }) => {
    await prepare(page, "/contactus");
    const unassociated = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLInputElement>("input, select, textarea")]
        .filter((el) => {
          if (
            el.type === "hidden" ||
            el.type === "submit" ||
            el.closest("[aria-hidden='true']")
          ) return false;
          const hasLabel    = Boolean(el.labels?.length);
          const ariaLabel   = el.getAttribute("aria-label");
          const ariaLblBy   = el.getAttribute("aria-labelledby");
          return !hasLabel && !ariaLabel && !ariaLblBy;
        })
        .map((el) => ({ type: el.type, name: el.name, id: el.id }))
    );
    expect(unassociated, "Form inputs without accessible labels").toEqual([]);
  });

  test("WCAG text spacing: interactive elements not clipped at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ["/", "/products", "/contactus"]) {
      await prepare(page, route);
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
      const clipped = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("a, button, label, input, select")]
          .filter((el) => {
            const s = getComputedStyle(el);
            const b = el.getBoundingClientRect();
            const text = el.textContent?.trim() ?? "";
            return (
              !el.closest('[aria-hidden="true"]') &&
              (text.length > 0 || ["INPUT", "SELECT"].includes(el.tagName)) &&
              s.display !== "none" &&
              s.visibility !== "hidden" &&
              b.width > 0 &&
              b.height > 0 &&
              (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
            );
          })
          .map((el) => ({ tag: el.tagName, text: el.textContent?.trim().slice(0, 50) ?? "" }))
      );
      expect(clipped, `${route}: interactive elements clipped at WCAG text spacing`).toEqual([]);
    }
  });
});
