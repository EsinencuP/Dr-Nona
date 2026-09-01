import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";
import { getClientErrorRecords } from "../../src/app/monitoring";
import { isLocaleRouteSupported, localePathFor } from "../../src/locale-routing.mjs";
import {
  Link,
  isPathnameEncodingValid,
  Route,
  Router,
  Routes,
  safeDecodeRouteSegment,
  useParams,
  useSearchParams,
} from "../../src/router";

function ProductProbe() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();

  return (
    <div>
      <p>slug:{slug}</p>
      <p>query:{params.get("q") ?? ""}</p>
      <button type="button" onClick={() => setParams({ q: "halo" })}>
        Set query
      </button>
      <Link to="/">Home</Link>
    </div>
  );
}

function RouterHarness() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Link to="/product/parfum-faya">Product</Link>} />
        <Route path="/product/:slug" element={<ProductProbe />} />
        <Route
          path="*"
          element={<div><p>Not found</p><Link to="/">Home</Link></div>}
        />
      </Routes>
    </Router>
  );
}

describe("custom router", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  test("adds locale prefixes only to routes with complete localized content", () => {
    expect(isLocaleRouteSupported("/products")).toBe(true);
    expect(isLocaleRouteSupported("/product/dynamic-hydrating-cream")).toBe(true);
    expect(isLocaleRouteSupported("/blog")).toBe(true);
    expect(isLocaleRouteSupported("/blog/original-article")).toBe(false);
    expect(isLocaleRouteSupported("/faq")).toBe(false);
    expect(localePathFor("/products", "?category=face", "ro")).toBe(
      "/ro/products?category=face"
    );
    expect(localePathFor("/blog/original-article", "", "ro")).toBe(
      "/blog/original-article"
    );
  });

  test("removes an unsupported locale prefix without losing the UI preference", async () => {
    window.history.replaceState({}, "", "/ro/blog/original-article");
    render(<RouterHarness />);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/blog/original-article");
    });
    expect(localStorage.getItem("drnona-locale")).toBe("ro");
    expect(screen.getByText("Not found")).toBeInTheDocument();
  });

  test("matches dynamic routes and updates search params", async () => {
    const user = userEvent.setup();
    render(<RouterHarness />);

    await user.click(screen.getByRole("link", { name: "Product" }));
    expect(screen.getByText("slug:parfum-faya")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Set query" }));
    expect(screen.getByText("query:halo")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/product/parfum-faya");
    expect(window.location.search).toBe("?q=halo");
  });

  test("renders the fallback for an unknown route", () => {
    window.history.replaceState({}, "", "/missing");
    render(<RouterHarness />);
    expect(screen.getByText("Not found")).toBeInTheDocument();
  });

  test("decodes valid encoded route segments", () => {
    expect(safeDecodeRouteSegment("halo%20cream")).toBe("halo cream");
    expect(isPathnameEncodingValid("/product/halo%20cream")).toBe(true);
    expect(isPathnameEncodingValid("/any/%E0%A4%A/path")).toBe(false);
  });

  test.each(["/product/%", "/product/%E0%A4%A"])(
    "turns malformed route %s into a monitored fallback and remains navigable",
    async (path) => {
      window.history.replaceState({}, "", path);
      const user = userEvent.setup();
      render(<RouterHarness />);

      expect(screen.getByText("Not found")).toBeInTheDocument();
      expect(getClientErrorRecords()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "malformed-route",
            source: "router",
            pathname: path,
          }),
        ])
      );

      await user.click(screen.getByRole("link", { name: "Home" }));
      expect(window.location.pathname).toBe("/");
      expect(
        screen.getByRole("link", { name: "Product" })
      ).toBeInTheDocument();
    }
  );
});
