import { describe, expect, test } from "vitest";
import { validateClientApplication } from "../../src/features/contact/client-application-validation";

const common = {
  firstName: " Ana ",
  lastName: " Popescu ",
  phone: "069 123 456",
  city: " Chișinău ",
  consentAccepted: true,
  website: "",
  email: " ana@example.com ",
  comment: " call first ",
  preferredCallTime: " after 18:00 ",
  utmSource: "instagram",
  utmMedium: "story",
  utmCampaign: "autumn-care",
  utmContent: "product-card",
  entryPoint: "/contactus",
  sessionHistory: '["lord-deodorant"]',
};

describe("client application validation", () => {
  test.each([
    [
      "order",
      { type: "order", productSlugs: ["lord-deodorant"] },
      new Set(["lord-deodorant"]),
    ],
    [
      "consultation",
      {
        type: "consultation",
        consultationMode: "online",
        consultationDate: "2099-01-01",
        consultationTime: "10:00",
      },
      new Set<string>(),
    ],
  ])("passes optional fields through for %s", (_label, variant, allowed) => {
    const result = validateClientApplication(
      { ...common, ...variant },
      allowed
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        email: "ana@example.com",
        comment: "call first",
        preferredCallTime: "after 18:00",
        utmSource: "instagram",
        utmMedium: "story",
        utmCampaign: "autumn-care",
        utmContent: "product-card",
        entryPoint: "/contactus",
        sessionHistory: '["lord-deodorant"]',
      });
    }
  });
});
