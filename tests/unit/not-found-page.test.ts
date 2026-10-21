import { readFileSync } from "node:fs";
import { load } from "cheerio";
import { describe, expect, test } from "vitest";
import { renderNotFoundHtml } from "../../scripts/render-not-found.mjs";

const template = readFileSync("index.html", "utf8");

describe("static 404 fallback", () => {
  test.each(["ru", "ro"] as const)("%s is usable and non-indexable before JavaScript runs", (locale) => {
    const $ = load(renderNotFoundHtml(template, "/missing", locale, "https://example.com"));
    expect($("html").attr("lang")).toBe(locale);
    expect($("h1").text()).toBe(locale === "ro" ? "Această pagină a dispărut din orizont" : "Эта страница ушла за горизонт");
    expect($('meta[name="robots"]').length).toBe(1);
    expect($('meta[name="robots"]').attr("content")).toBe("noindex,follow");
    expect($('link[rel="canonical"], link[rel="alternate"][hreflang], script[type="application/ld+json"]').length).toBe(0);
    expect($('link[as="image"][href^="/brand/hero/"]').length).toBe(0);
    expect($(".not-found__actions a").map((_, link) => $(link).attr("href")).get()).toEqual([
      `/${locale}/products`, `/${locale}`,
    ]);
  });
});
