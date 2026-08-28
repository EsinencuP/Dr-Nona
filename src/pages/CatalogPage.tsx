import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { List } from "@phosphor-icons/react/List";
import { MagnifyingGlass } from "@phosphor-icons/react/MagnifyingGlass";
import { X } from "@phosphor-icons/react/X";
import { useMemo, useState } from "react";
import { ProductCard } from "../components/ui";
import { useProductData } from "../data";
import { filterCatalogProducts } from "../features/catalog/filterProducts";
import { useLocale } from "../locales/LocaleProvider";
import { normalizeCatalogSort } from "../product-sort";
import { useSearchParams } from "../router";

function productCountLabel(count: number) {
  const lastTwo = count % 100;
  const last = count % 10;
  const word =
    lastTwo >= 11 && lastTwo <= 14
      ? "товаров"
      : last === 1
        ? "товар"
        : last >= 2 && last <= 4
          ? "товара"
          : "товаров";
  return `${count} ${word}`;
}

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const { products, categories } = useProductData();
  const { t } = useLocale();
  const query = params.get("q") ?? "";
  const category = params.get("category") ?? "all";
  const sort = normalizeCatalogSort(params.get("sort"));
  const [filtersOpen, setFiltersOpen] = useState(false);

  const result = useMemo(
    () => filterCatalogProducts({ products, query, category, sort }),
    [category, products, query, sort]
  );
  const categoryCounts = useMemo(
    () =>
      new Map(
        categories.map((item) => [
          item,
          products.filter((product) => product.category === item).length,
        ])
      ),
    [categories, products]
  );

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <section className="catalog-page container">
      <div className="page-intro page-intro--catalog">
        <div>
          <p className="eyebrow">Каталог · {products.length} товаров</p>
          <h1>Каталог <em>Dr. Nona</em></h1>
        </div>
        <p>Полный ассортимент Dr. Nona Moldova с описаниями, составом и способом применения.</p>
      </div>

      <button
        className="mobile-filters-toggle"
        type="button"
        aria-expanded={filtersOpen}
        aria-controls="catalog-search-and-sort"
        onClick={() => setFiltersOpen((value) => !value)}
      >
        <List aria-hidden="true" />
        <span>{filtersOpen ? "Скрыть поиск и сортировку" : "Поиск и сортировка"}</span>
        <CaretDown aria-hidden="true" />
      </button>

      <div
        id="catalog-search-and-sort"
        className={`catalog-toolbar ${filtersOpen ? "is-open" : ""}`}
      >
        <label className="search-field">
          <MagnifyingGlass aria-hidden="true" />
          <span className="sr-only">{t.search}</span>
          <input
            value={query}
            onChange={(event) => update("q", event.target.value)}
            placeholder={t.search}
            type="search"
            name="catalog-search"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              onClick={() => update("q", "")}
              aria-label="Очистить поиск"
            >
              <X aria-hidden="true" />
            </button>
          )}
        </label>
        <label className="select-field">
          <span className="sr-only">{t.allCategories}</span>
          <select
            name="category"
            value={category}
            onChange={(event) => update("category", event.target.value)}
          >
            <option value="all">{t.allCategories}</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <CaretDown aria-hidden="true" />
        </label>
        <label className="select-field">
          <span className="sr-only">Сортировка</span>
          <select
            name="sort"
            value={sort}
            onChange={(event) => update("sort", event.target.value)}
          >
            <option value="popular">{t.sortPopular}</option>
            <option value="updated">{t.sortUpdated}</option>
            <option value="az">{t.sortAZ}</option>
            <option value="za">{t.sortZA}</option>
          </select>
          <CaretDown aria-hidden="true" />
        </label>
      </div>

      <div className="catalog-categories" aria-label="Фильтр по категории">
        <button
          className={category === "all" ? "is-active" : ""}
          type="button"
          aria-pressed={category === "all"}
          onClick={() => update("category", "all")}
        >
          <span>Все товары</span><small>{products.length}</small>
        </button>
        {categories.map((item) => (
          <button
            className={category === item ? "is-active" : ""}
            type="button"
            aria-pressed={category === item}
            key={item}
            onClick={() => update("category", item)}
          >
            <span>{item}</span><small>{categoryCounts.get(item)}</small>
          </button>
        ))}
      </div>

      <div className="catalog-status" aria-live="polite">
        <span>{productCountLabel(result.length)}</span>
        {(query || category !== "all" || sort !== "popular") && (
          <button type="button" onClick={() => setParams({})}>{t.reset}</button>
        )}
      </div>

      {result.length ? (
        <div className="catalog-grid">
          {result.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <MagnifyingGlass aria-hidden="true" />
          <h2>{t.empty}</h2>
          <button
            className="button button--primary"
            type="button"
            onClick={() => setParams({})}
          >
            {t.reset}
          </button>
        </div>
      )}
    </section>
  );
}
