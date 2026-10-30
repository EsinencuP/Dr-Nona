import { describe, expect, test } from "vitest";
import { getPrivacyChoice, setPrivacyChoice, PRIVACY_CHOICE_KEY } from "../../src/features/privacy/privacyChoice";
import { buildApplicationAttribution, captureUtmParameters, readApprovedProductHistory, readSessionValue, recordProductView } from "../../src/features/contact/utm-capture";

describe("browser data consent", () => {
  test("defaults off and does not capture or expose stale optional data", () => {
    window.history.replaceState({}, "", "/?utm_source=private-campaign");
    sessionStorage.setItem("utm_source", "old-campaign");
    sessionStorage.setItem("session_product_history", '["lord-deodorant"]');
    expect(getPrivacyChoice()).toBe("pending");
    captureUtmParameters();
    recordProductView("lord-deodorant");
    expect(sessionStorage.getItem("utm_source")).toBeNull();
    expect(sessionStorage.getItem("session_product_history")).toBeNull();
    expect(readSessionValue("utm_source")).toBeUndefined();
    expect(readApprovedProductHistory(new Set(["lord-deodorant"]))).toEqual([]);
  });

  test("revocation disables attribution even with form consent and preserves functional preferences", () => {
    localStorage.setItem("drnona-locale", "ro");
    localStorage.setItem("drnona-selection", '["lord-deodorant"]');
    setPrivacyChoice("accepted");
    captureUtmParameters();
    recordProductView("lord-deodorant");
    expect(readApprovedProductHistory(new Set(["lord-deodorant"]))).toEqual(["lord-deodorant"]);
    setPrivacyChoice("rejected");
    expect(buildApplicationAttribution({ locale: "ru-MD", path: "/contactus", consentAccepted: true,
      allowedProductSlugs: new Set(["lord-deodorant"]) })).toBeUndefined();
    expect(sessionStorage.getItem("session_product_history")).toBeNull();
    expect(localStorage.getItem("drnona-locale")).toBe("ro");
    expect(localStorage.getItem("drnona-selection")).toBe('["lord-deodorant"]');
  });

  test("expired or malformed decisions never authorize optional data", () => {
    const expired = Date.now() - 181 * 24 * 60 * 60 * 1000;
    localStorage.setItem(PRIVACY_CHOICE_KEY, JSON.stringify({ version: 1, choice: "accepted", decidedAt: expired,
      expiresAt: expired + 180 * 24 * 60 * 60 * 1000 }));
    expect(getPrivacyChoice()).toBe("pending");
    localStorage.setItem(PRIVACY_CHOICE_KEY, JSON.stringify({ choice: "accepted" }));
    expect(getPrivacyChoice()).toBe("pending");
  });
});
