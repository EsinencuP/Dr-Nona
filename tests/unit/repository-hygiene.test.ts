import { describe, expect, test } from "vitest";
import { findForbiddenTrackedPaths } from "../../scripts/repository-hygiene-lib.mjs";

describe("repository hygiene path policy", () => {
  test("rejects generated, archived and nested-project paths", () => {
    const paths = [
      "dist/index.html",
      "docs/evidence.zip",
      "docs/audit/2020-01-01/home.png",
      "docs/tool/pyproject.toml",
      "docs/BUILD_REPORT.md",
      ".env.local",
      "public/generated/qa-home.png",
    ];

    expect(findForbiddenTrackedPaths(paths)).toEqual(paths);
  });

  test("keeps runtime media, visual baselines and the environment template", () => {
    expect(
      findForbiddenTrackedPaths([
        "public/products/item.png",
        "tests/e2e/example.spec.ts-snapshots/catalog-mobile.png",
        ".env.example",
        "docs/DESIGN_SYSTEM.md",
      ])
    ).toEqual([]);
  });
});
