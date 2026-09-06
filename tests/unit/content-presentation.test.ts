import { describe, expect, it, vi } from "vitest";
import pagesJson from "../../src/data/official-pages.json";
import type { OfficialPage } from "../../src/data";
import { getOfficialPageDescription } from "../../src/claims";
import { editorialMediaRole, uncroppedOfficialImage } from "../../src/components/contentMedia";

vi.mock("../../src/data/runtime-content.json", async (importOriginal) => {
  const original = await importOriginal<{ default: typeof import("../../src/data/runtime-content.json") }>();
  return { default: { ...original.default, claims: {
    ...original.default.claims,
    fieldPublishability: { ...original.default.claims.fieldPublishability,
      ["official-page\u001f/news/test-pending-description\u001fdescription"]: false,
    },
  } } };
});

describe("official content presentation", () => {
  const pages = pagesJson as OfficialPage[];
  const article = pages.find((page) => page.path === "/news/zoom-08-07-2026")!;

  it("suppresses the imported site-wide excerpt throughout the current editorial archive", () => {
    const editorial = pages.filter((page) => /^\/(news|blog)\//u.test(page.path) && !page.error);
    expect(editorial).toHaveLength(114);
    for (const page of editorial) {
      const source = page.description;
      expect(getOfficialPageDescription(page), page.path).toBe("");
      expect(page.description).toBe(source);
    }
  });

  it("recognizes whitespace variants without inventing replacement summaries", () => {
    expect(getOfficialPageDescription({ ...article, description: `  ${article.description.replaceAll(" ", "\n")}  ` })).toBe("");
  });

  it("does not suppress meaningful source text just because it uses English", () => {
    const description = "Event programme and meeting time.";
    expect(getOfficialPageDescription({ ...article, description })).toBe(description);
    expect(getOfficialPageDescription({ ...article, description: "" })).toBe("");
  });

  it("continues to suppress pending description claims independently of boilerplate", () => {
    expect(getOfficialPageDescription({ ...article, path: "/news/test-pending-description", description: "Non-boilerplate fixture" })).toBe("");
  });

  it("requests the same official asset without the destructive server crop", () => {
    const source = "https://res.cloudinary.com/drnona-com/image/upload/w_1200,h_400,c_fill/news/zoom-08-07-2026";
    expect(uncroppedOfficialImage(source)).toBe("https://res.cloudinary.com/drnona-com/image/upload/f_auto,q_auto,w_1200,c_limit/news/zoom-08-07-2026");
    expect(uncroppedOfficialImage(uncroppedOfficialImage(source))).toBe(uncroppedOfficialImage(source));
  });

  it("leaves other providers, versioned URLs and product assets untouched", () => {
    for (const source of [
      "https://example.com/image/upload/w_1200,h_400,c_fill/news/event",
      "https://res.cloudinary.com/other/image/upload/w_1200,h_400,c_fill/news/event",
      "https://res.cloudinary.com/drnona-com/image/upload/v123/news/event",
      "https://res.cloudinary.com/drnona-com/image/upload/w_1200,h_400,c_fill/products/cream",
      "/images/official-poster.png",
    ]) expect(uncroppedOfficialImage(source)).toBe(source);
  });

  it("preserves unclassified artwork; only an inspected photograph opts into cropping", () => {
    expect(editorialMediaRole(article.path)).toBe("artwork");
    expect(editorialMediaRole("/news/new-poster")).toBe("artwork");
    expect(editorialMediaRole("/news/inactive-cleanup")).toBe("photo");
  });
});
