import { beforeEach, describe, expect, test } from "vitest";
import {
  buildApplicationAttribution,
  captureUtmParameters,
  recordProductView,
  readSessionValue,
} from "../../src/features/contact/utm-capture";

describe("UTM capture", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  test("stores present UTM values and preserves absent ones", () => {
    sessionStorage.setItem("utm_medium", "existing-medium");
    window.history.replaceState(
      {},
      "",
      "/contactus?utm_source=instagram&utm_campaign=autumn%20care&utm_content="
    );

    captureUtmParameters();

    expect(readSessionValue("utm_source")).toBe("instagram");
    expect(readSessionValue("utm_medium")).toBe("existing-medium");
    expect(readSessionValue("utm_campaign")).toBe("autumn care");
    expect(readSessionValue("utm_content")).toBeUndefined();
    window.history.replaceState({}, "", "/");
  });

  test("keeps first touch, updates last touch and separates normalized from raw values", () => {
    window.history.replaceState({}, "", "/?utm_source=Instagram%20Ads&utm_campaign=AUTUMN");
    captureUtmParameters(new Date("2026-09-16T08:00:00.000Z"));
    window.history.replaceState({}, "", "/product/lord-deodorant?utm_source=Google&utm_medium=CPC");
    captureUtmParameters(new Date("2026-09-16T08:05:00.000Z"));
    recordProductView("lord-deodorant");
    recordProductView("unknown-product");

    const attribution = buildApplicationAttribution({
      locale: "ru-MD",
      path: "/contactus",
      allowedProductSlugs: new Set(["lord-deodorant"]),
      consentAccepted: true,
    });

    expect(attribution).toMatchObject({
      firstTouch: { source: "instagram ads", campaign: "autumn", raw: { source: "Instagram Ads" } },
      lastTouch: { source: "google", medium: "cpc", raw: { source: "Google", medium: "CPC" } },
      entry: { path: "/contactus", locale: "ru-MD" },
      sessionHistory: ["lord-deodorant"],
    });
  });

  test("does not build persisted attribution without consent or for a mixed-locale route", () => {
    captureUtmParameters(new Date("2026-09-16T08:00:00.000Z"));
    const base = { path: "/ro/contactus", allowedProductSlugs: new Set<string>() };
    expect(buildApplicationAttribution({ ...base, locale: "ro-MD", consentAccepted: false })).toBeUndefined();
    expect(buildApplicationAttribution({ ...base, locale: "ru-MD", consentAccepted: true })).toBeUndefined();
  });

  test("discards malformed session history and resets first touch with a new browser session", () => {
    window.history.replaceState({}, "", "/?utm_source=first");
    captureUtmParameters(new Date("2026-09-16T08:00:00.000Z"));
    sessionStorage.setItem("session_product_history", "not-json");
    expect(
      buildApplicationAttribution({
        locale: "ru-MD",
        path: "/contactus",
        allowedProductSlugs: new Set(["lord-deodorant"]),
        consentAccepted: true,
      })?.sessionHistory,
    ).toEqual([]);

    sessionStorage.clear();
    window.history.replaceState({}, "", "/?utm_source=second");
    captureUtmParameters(new Date("2026-09-16T09:00:00.000Z"));
    expect(
      buildApplicationAttribution({
        locale: "ru-MD",
        path: "/contactus",
        allowedProductSlugs: new Set<string>(),
        consentAccepted: true,
      })?.firstTouch.source,
    ).toBe("second");
  });
});
