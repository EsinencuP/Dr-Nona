import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { safeLocalStorage } from "../src/app/storage";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  safeLocalStorage.resetMemory();
  document.documentElement.removeAttribute("data-ui-locale");
});

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, "scrollTo", {
  configurable: true,
  value: vi.fn(),
});

class IntersectionObserverMock implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];

  disconnect() {}
  observe(target: Element) {
    target.setAttribute("data-visible", "true");
  }
  takeRecords() {
    return [];
  }
  unobserve() {}
}

Object.defineProperty(window, "IntersectionObserver", {
  configurable: true,
  value: IntersectionObserverMock,
});
