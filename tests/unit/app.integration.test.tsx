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
    await user.type(search, "Dynamic");

    await waitFor(() => {
      expect(window.location.search).toBe("?q=Dynamic");
    });
    expect(screen.getByText("1 продуктов")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Halo Dynamic Cream" })
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
        name: "Lord - Halo Deodorant Antiperspirant",
      })
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: "Удалить Lord - Halo Deodorant Antiperspirant",
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

  test("shows the selected product context without a fake form submit", async () => {
    renderApp("/contactus?products=lord-deodorant");

    expect(
      await screen.findByRole("heading", { level: 3, name: "В письмо войдут" })
    ).toBeInTheDocument();
    expect(screen.getByText("SKU 324001")).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
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

  test("does not expose foreign certificates as Moldova evidence", async () => {
    renderApp("/certificates");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Сертификаты для Молдовы",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "На сайте нет опубликованных сертификатов для Молдовы",
      })
    ).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText("Russia")).not.toBeInTheDocument();
    expect(screen.getByText("Кем выдан")).toBeInTheDocument();
    expect(screen.getByText("Страна действия")).toBeInTheDocument();
    expect(screen.getByText("Продукты")).toBeInTheDocument();
    expect(screen.getByText("Срок действия")).toBeInTheDocument();
  });

  test("publishes only complete, editorially ready products", () => {
    expect(allProducts).toHaveLength(10);
    expect(products).toHaveLength(7);
    expect(
      allProducts.filter((product) => product.publicationStatus === "draft")
    ).toHaveLength(3);
    expect(productBySlug.has("parfum-faya")).toBe(false);

    for (const product of products) {
      expect(product.publicationStatus).toBe("published");
      expect(product.editorialStatus).toBe("ready");
      expect(product.shortDescription?.trim()).toBeTruthy();
      expect(product.longDescription?.trim()).toBeTruthy();
      expect(product.ingredients?.trim()).toBeTruthy();
      expect(product.howToUse?.trim()).toBeTruthy();
    }
  });

  test("marks an explicitly null product field as not applicable", () => {
    const product = {
      ...products[0],
      howToUse: null,
    } satisfies Product;

    expect(isProductContentFieldApplicable(product, "ingredients")).toBe(true);
    expect(isProductContentFieldApplicable(product, "howToUse")).toBe(false);
  });

  test("keeps the release language aligned with Russian content", async () => {
    renderApp("/");
    await waitFor(() => {
      expect(document.documentElement.lang).toBe("ru");
      expect(document.documentElement.dataset.uiLocale).toBe("ru");
    });
    expect(screen.queryByRole("button", { name: /RU|RO/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: /язык/i })
    ).not.toBeInTheDocument();
  });

  test("connects product breadcrumbs and accordion semantics", async () => {
    const user = userEvent.setup();
    const { container } = renderApp("/product/lord-deodorant");

    const breadcrumb = await screen.findByRole("navigation", {
      name: "Хлебные крошки",
    });
    const separators = within(breadcrumb).getAllByText("/");
    expect(separators).toHaveLength(2);
    expect(
      separators.every((separator) => separator.getAttribute("aria-hidden") === "true")
    ).toBe(true);
    expect(
      within(breadcrumb).getByText("Lord - Halo Deodorant Antiperspirant")
    ).toHaveAttribute("aria-current", "page");

    const trigger = screen.getByRole("button", { name: "Состав" });
    const panelId = trigger.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const panel = container.querySelector<HTMLElement>(`#${panelId}`);
    expect(panel).not.toBeNull();
    expect(panel).toHaveAttribute("role", "region");
    expect(panel).toHaveAttribute("aria-labelledby", trigger.id);

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("hidden");
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
