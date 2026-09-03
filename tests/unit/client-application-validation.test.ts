import { describe, expect, test } from "vitest";
import { validateClientApplication } from "../../src/features/contact/client-application-validation";
import { MASTERCLASS_TOPICS } from "../../shared/constants/masterclass-topics";

const common = {
  firstName: " Ana ",
  lastName: " Popescu ",
  phone: "069 123 456",
  city: " Кишинёв ",
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
    [
      "masterclass",
      {
        type: "masterclass",
        masterclassTopic: MASTERCLASS_TOPICS[0],
        eventDate: "2099-01-01",
        eventTime: "10:00",
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

  test("normalizes order quantities and ignores unselected item records", () => {
    const result = validateClientApplication(
      {
        ...common,
        type: "order",
        productSlugs: ["lord-deodorant"],
        items: [
          { slug: "lord-deodorant", quantity: 120 },
          { slug: "unselected-product", quantity: 4 },
        ],
      },
      new Set(["lord-deodorant"])
    );

    expect(result.success).toBe(true);
    if (result.success && result.data.type === "order") {
      expect(result.data.items).toEqual([
        { slug: "lord-deodorant", quantity: 99 },
      ]);
    }
  });

  test("rejects an arbitrary region before submission", () => {
    const result = validateClientApplication(
      {
        ...common,
        city: "Chișinău",
        type: "order",
        productSlugs: ["lord-deodorant"],
      },
      new Set(["lord-deodorant"]),
      "ro"
    );

    expect(result).toEqual({
      success: false,
      fieldErrors: { city: "Selectați o regiune din listă" },
    });
  });

  test("rejects a masterclass topic outside the curated list", () => {
    const result = validateClientApplication(
      {
        ...common,
        type: "masterclass",
        masterclassTopic: "Произвольная тема",
        eventDate: "2099-01-01",
        eventTime: "10:00",
      },
      new Set(),
      "ro"
    );

    expect(result).toEqual({
      success: false,
      fieldErrors: {
        masterclassTopic: "Selectați o temă de masterclass din listă",
      },
    });
  });
});
