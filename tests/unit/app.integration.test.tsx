import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";
import App from "../../src/App";
import {
  isProductContentFieldApplicable,
  loadProductData,
  type Product,
} from "../../src/data";
import { marketData } from "../../src/market";
import { Router } from "../../src/router";

const { allProducts, productBySlug, products } = await loadProductData();

function renderApp(path: string) {
  window.history.replaceState({}, "", path);
  return render(
    <Router>
      <App />
    </Router>
  );
}

describe("Dr. Nona application", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  test("filters the catalogue and keeps the query in the URL", async () => {
    const user = userEvent.setup();
    renderApp("/products");

    const search = await screen.findByRole("searchbox", {
      name: "Поиск по названию",
    });
    await user.type(search, "404001");

    await waitFor(() => {
      expect(window.location.search).toBe("?q=404001");
    });
    expect(screen.getByText("1 товар")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Dynamic Cream" })
    ).toBeInTheDocument();
  });

  test("labels source freshness honestly and supports legacy newest URLs", async () => {
    const user = userEvent.setup();
    renderApp("/products?sort=newest");

    const sort = await screen.findByRole("combobox", { name: "Сортировка" });
    expect(sort).toHaveValue("updated");
    expect(
      screen.getByRole("option", { name: "Недавно обновлённые" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Сначала новые" })
    ).not.toBeInTheDocument();

    await user.selectOptions(sort, "az");
    await waitFor(() => {
      expect(window.location.search).toBe("?sort=az");
    });
  });

  test("restores and removes a persisted selection", async () => {
    localStorage.setItem("drnona-selection", JSON.stringify(["lord-deodorant"]));
    const user = userEvent.setup();
    renderApp("/selection");

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Deodorant ( LORD )",
      })
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: "Удалить Deodorant ( LORD )",
      })
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "В подборке пока нет продуктов",
      })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(localStorage.getItem("drnona-selection")).toBe("[]");
    });
  });

  test("synchronizes the selection after another browser tab updates storage", async () => {
    renderApp("/");

    expect(
      await screen.findByRole("link", { name: "Подборка: 0" })
    ).toBeInTheDocument();

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "drnona-selection",
        newValue: JSON.stringify(["lord-deodorant"]),
        storageArea: localStorage,
      })
    );

    expect(
      await screen.findByRole("link", { name: "Подборка: 1" })
    ).toBeInTheDocument();
  });

  test("exposes the temporary CRM entry from the e-catalog header", async () => {
    renderApp("/");

    expect(
      await screen.findByRole("link", { name: "Открыть внутреннюю CRM" })
    ).toHaveAttribute("href", "http://127.0.0.1:3001/dashboard");
  });

  test("serves responsive AVIF and WebP product images with a PNG fallback", async () => {
    const { container } = renderApp("/products");

    await screen.findByRole("heading", { level: 1, name: /Каталог/ });
    const picture = container.querySelector(".product-card picture");
    expect(picture).not.toBeNull();
    expect(
      picture?.querySelector('source[type="image/avif"]')?.getAttribute("srcset")
    ).toContain("-480.avif 480w");
    expect(
      picture?.querySelector('source[type="image/webp"]')?.getAttribute("srcset")
    ).toContain("-1200.webp 1200w");
    expect(picture?.querySelector("img")?.getAttribute("src")).toMatch(
      /catalog-normalized\/.+\.png$/
    );
  });

  test("discards unavailable products before showing the selection count", async () => {
    localStorage.setItem(
      "drnona-selection",
      JSON.stringify(["removed-catalog-product"])
    );
    renderApp("/");

    const selectionLink = await screen.findByRole("link", {
      name: "Подборка: 0",
    });
    expect(within(selectionLink).getByText("0")).toBeInTheDocument();
    await waitFor(() => {
      expect(localStorage.getItem("drnona-selection")).toBe("[]");
    });
  });

  test("shows the selected product context in the real application form", async () => {
    renderApp("/contactus?products=lord-deodorant");

    expect(
      await screen.findByRole("heading", { level: 3, name: "В заявку войдут" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("SKU 324001")).toHaveLength(2);
    expect(screen.getByRole("form")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Заказ" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.getByRole("link", { name: "Подготовить письмо" })
    ).toHaveAttribute("href", expect.stringContaining("lord-deodorant"));
    expect(
      screen.getAllByRole("link", { name: "+373 69 281 916" }).length
    ).toBeGreaterThan(0);
    expect(screen.getByText("Филиал в Молдове")).toBeInTheDocument();
    expect(screen.queryByText(/Израиль/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Telegram/)).not.toBeInTheDocument();
  });

  test("keeps the primary market contact explicit and source-backed", () => {
    expect(marketData.market).toBe("Moldova");
    expect(marketData.contact.country).toBe("Молдова");
    expect(marketData.contact.phones).toHaveLength(2);
    expect(
      marketData.contact.phones.every((phone) =>
        phone.href.startsWith("tel:+373")
      )
    ).toBe(true);
    expect(marketData.contact.sourceUrl).toMatch(/^https:\/\/drnona\.com\//);
    expect(marketData.contact.telegram).toBeNull();
  });

  test("links to the international document archive without review copy", async () => {
    renderApp("/certificates");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Сертификаты и документы",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Международный архив сертификатов",
      })
    ).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText("Russia")).not.toBeInTheDocument();
    expect(screen.queryByText(/провер/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Открыть международный архив/i })
    ).toBeInTheDocument();
  });

  test("publishes all current products with explicit nulls for unavailable fields", () => {
    expect(allProducts).toHaveLength(50);
    expect(products).toHaveLength(50);
    expect(
      allProducts.filter((product) => product.publicationStatus === "draft")
    ).toHaveLength(0);
    expect(productBySlug.has("parfum-faya")).toBe(true);

    for (const product of products) {
      expect(product.publicationStatus).toBe("published");
      expect(product.editorialStatus).toBe("ready");
      for (const field of [
        "shortDescription",
        "longDescription",
        "ingredients",
        "howToUse",
      ] as const) {
        expect(product[field] === null || product[field].trim().length > 0).toBe(true);
      }
    }
  });

  test("marks an explicitly null product field as not applicable", () => {
    const productWithIngredients = products.find(
      (product) => product.slug === "lord-deodorant"
    );
    expect(productWithIngredients).toBeDefined();
    const product = {
      ...productWithIngredients!,
      howToUse: null,
    } satisfies Product;

    expect(isProductContentFieldApplicable(product, "ingredients")).toBe(true);
    expect(isProductContentFieldApplicable(product, "howToUse")).toBe(false);
  });

  test("exposes explicit RU and RO locale links", async () => {
    renderApp("/products");
    await waitFor(() => {
      expect(document.documentElement.lang).toBe("ru");
      expect(document.documentElement.dataset.uiLocale).toBe("ru");
    });
    const localeGroup = screen.getByRole("group", { name: /язык/i });
    expect(within(localeGroup).getByRole("link", { name: "RU" })).toHaveAttribute(
      "aria-current",
      "true"
    );
    expect(within(localeGroup).getByRole("link", { name: "RO" })).toHaveAttribute(
      "href",
      "/ro/products"
    );
  });

  test("connects product breadcrumbs and exposes product information", async () => {
    renderApp("/product/lord-deodorant");

    const breadcrumb = await screen.findByRole("navigation", {
      name: "Хлебные крошки",
    });
    const separators = within(breadcrumb).getAllByText("/");
    expect(separators).toHaveLength(2);
    expect(
      separators.every((separator) => separator.getAttribute("aria-hidden") === "true")
    ).toBe(true);
    expect(
      within(breadcrumb).getByText("Deodorant ( LORD )")
    ).toHaveAttribute("aria-current", "page");

    const overview = screen.getByRole("heading", { level: 3, name: "О продукте" });
    const ingredients = screen.getByRole("heading", { level: 3, name: "Состав" });
    expect(overview.closest("article")).toHaveClass("product-copy-card");
    expect(ingredients.closest("article")).toHaveClass("product-copy-card");
    expect(overview.closest("article")).toBeVisible();
    expect(ingredients.closest("article")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Состав" })).not.toBeInTheDocument();
  });

  test("keeps the approved home content hierarchy", async () => {
    const { container } = renderApp("/");
    const heroHeading = await screen.findByRole("heading", { level: 1 });
    expect(heroHeading).toHaveTextContent("Halo");
    expect(heroHeading).toHaveTextContent("Complex™");
    const mainSections = [
      ...container.querySelectorAll("#main-content > section"),
    ];

    expect(
      screen.queryByRole("link", { name: "Открыть каталог" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Исследовать формулу" })
    ).not.toBeInTheDocument();
    expect(mainSections[0]).toHaveClass("home-hero");
    expect(mainSections[1]).toHaveClass("science-section");
    expect(mainSections[2]).toHaveClass("home-product-showcase");
  });
});
