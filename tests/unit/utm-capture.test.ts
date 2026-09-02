import { describe, expect, test } from "vitest";
import {
  captureUtmParameters,
  readSessionValue,
} from "../../src/features/contact/utm-capture";

describe("UTM capture", () => {
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
});
