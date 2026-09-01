import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import App from "../../src/App";
import {
  createSafeStorageAdapter,
  safeLocalStorage,
  selectionSchema,
} from "../../src/app/storage";
import { Router } from "../../src/router";

function unavailableStorage(overrides: Partial<Storage> = {}) {
  return {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
    key: () => null,
    length: 0,
    ...overrides,
  } as Storage;
}

describe("safe storage adapter", () => {
  test("returns the schema fallback and reports a thrown read", () => {
    const reportError = vi.fn();
    const adapter = createSafeStorageAdapter({
      resolveStorage: () =>
        unavailableStorage({
          getItem: () => {
            throw new DOMException("Blocked", "SecurityError");
          },
        }),
      reportError,
    });

    expect(adapter.get("selection", selectionSchema, [])).toEqual([]);
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "SecurityError" }),
      { operation: "get", key: "selection" }
    );
  });

  test("keeps the latest selection in memory after a thrown write", () => {
    const reportError = vi.fn();
    const adapter = createSafeStorageAdapter({
      resolveStorage: () =>
        unavailableStorage({
          setItem: () => {
            throw new DOMException("Quota exceeded", "QuotaExceededError");
          },
        }),
      reportError,
    });

    expect(
      adapter.set("selection", ["halo-dynamic"], selectionSchema)
    ).toBe(false);
    expect(adapter.get("selection", selectionSchema, [])).toEqual([
      "halo-dynamic",
    ]);
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "QuotaExceededError" }),
      { operation: "set", key: "selection" }
    );
  });

  test("rejects malformed persisted values instead of leaking them to state", () => {
    const reportError = vi.fn();
    const adapter = createSafeStorageAdapter({
      resolveStorage: () =>
        unavailableStorage({
          getItem: () => JSON.stringify(["valid", 42]),
        }),
      reportError,
    });

    expect(adapter.get("selection", selectionSchema, [])).toEqual([]);
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Stored value failed schema validation",
      }),
      { operation: "get", key: "selection" }
    );
  });

  test("deduplicates valid selection slugs during schema parsing", () => {
    const adapter = createSafeStorageAdapter({
      resolveStorage: () =>
        unavailableStorage({
          getItem: () => JSON.stringify(["halo-dynamic", "halo-dynamic"]),
        }),
    });

    expect(adapter.get("selection", selectionSchema, [])).toEqual([
      "halo-dynamic",
    ]);
  });
});

describe("application in restricted storage mode", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders and keeps selection for the current session", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    safeLocalStorage.resetMemory();

    const storageErrors: CustomEvent[] = [];
    const onStorageError = ((event: CustomEvent) => {
      if (event.detail?.kind === "storage-error") storageErrors.push(event);
    }) as EventListener;
    window.addEventListener("drnona:error", onStorageError);

    window.history.replaceState({}, "", "/products");
    const firstRender = render(
      <Router>
        <App />
      </Router>
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Каталог Dr. Nona" })
    ).toBeInTheDocument();

    const user = userEvent.setup();
    const addButtons = await screen.findAllByRole("button", {
      name: "В подборку",
    });
    const card = addButtons[0].closest("article");
    expect(card).not.toBeNull();
    const productName = within(card as HTMLElement)
      .getByRole("heading", { level: 2 })
      .textContent;
    expect(productName).toBeTruthy();
    await user.click(addButtons[0]);
    firstRender.unmount();

    window.history.replaceState({}, "", "/selection");
    render(
      <Router>
        <App />
      </Router>
    );

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: productName as string,
      })
    ).toBeInTheDocument();
    expect(storageErrors.length).toBeGreaterThan(0);

    window.removeEventListener("drnona:error", onStorageError);
  });
});
