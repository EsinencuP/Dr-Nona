import { describe, expect, test } from "vitest";
import { validateClientApplication } from "../../src/features/contact/client-application-validation";
import { MASTERCLASS_TOPICS } from "../../shared/constants/masterclass-topics";
import productsJson from "../../src/data/products-public.json";

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
  test("preserves a selected consultation slot for transactional reservation", () => {
    const consultationSlotId = "00000000-0000-4000-8000-000000000024";
    const result = validateClientApplication({
      ...common,
      type: "consultation",
      consultationSlotId,
      consultationMode: "online",
      consultationDate: "2030-01-15",
      consultationTime: "10:00",
    }, new Set<string>(), "ru", new Date("2030-01-01T10:00:00.000Z"));

    expect(result.success).toBe(true);
    if (result.success && result.data.type === "consultation") {
      expect(result.data.consultationSlotId).toBe(consultationSlotId);
    }
  });

  test("preserves quantity boundaries for all 50 published products", () => {
    const products = productsJson as Array<{ slug: string }>;
    expect(products).toHaveLength(50);
    const allowed = new Set(products.map((product) => product.slug));

    for (const product of products) {
      for (const quantity of [1, 99]) {
        const result = validateClientApplication(
          {
            ...common,
            type: "order",
            productSlugs: [product.slug],
            items: [{ slug: product.slug, quantity }],
          },
          allowed
        );
        expect(result.success, `${product.slug} × ${quantity}`).toBe(true);
        if (result.success && result.data.type === "order") {
          expect(result.data.items).toEqual([{ slug: product.slug, quantity }]);
        }
      }
    }
  });

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
        consultationDate: "2030-01-15",
        consultationTime: "10:00",
      },
      new Set<string>(),
    ],
    [
      "masterclass",
      {
        type: "masterclass",
        masterclassTopic: MASTERCLASS_TOPICS[0],
        eventDate: "2030-02-15",
        eventTime: "10:00",
      },
      new Set<string>(),
    ],
  ])("passes optional fields through for %s", (_label, variant, allowed) => {
    const result = validateClientApplication(
      { ...common, ...variant },
      allowed,
      "ru",
      new Date("2030-01-01T10:00:00.000Z")
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

  test("rejects out-of-range and unselected quantity records", () => {
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

    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors).toHaveProperty("items");
  });

  test("preserves valid structured attribution and rejects spoofed locale or product history", () => {
    const attribution = {
      version: 1 as const,
      consent: "application_submission" as const,
      firstTouch: {
        kind: "campaign" as const,
        source: "instagram",
        capturedAt: "2026-09-16T08:00:00.000Z",
      },
      lastTouch: {
        kind: "campaign" as const,
        source: "instagram",
        capturedAt: "2026-09-16T08:05:00.000Z",
      },
      entry: { path: "/contactus", locale: "ru-MD" as const },
      sessionHistory: ["lord-deodorant"],
    };
    const valid = validateClientApplication(
      {
        ...common,
        type: "order",
        productSlugs: ["lord-deodorant"],
        attribution,
      },
      new Set(["lord-deodorant"])
    );
    expect(valid.success).toBe(true);
    if (valid.success) expect(valid.data.attribution).toEqual(attribution);

    for (const spoofed of [
      { ...attribution, entry: { ...attribution.entry, locale: "ro-MD" as const } },
      { ...attribution, sessionHistory: ["unknown-product"] },
    ]) {
      const result = validateClientApplication(
        {
          ...common,
          type: "order",
          productSlugs: ["lord-deodorant"],
          attribution: spoofed,
        },
        new Set(["lord-deodorant"])
      );
      expect(result).toEqual({
        success: false,
        fieldErrors: { attribution: "Некорректные данные атрибуции" },
      });
    }
  });

  test.each([1, 99])("preserves exact order quantity %s", (quantity) => {
    const result = validateClientApplication(
      {
        ...common,
        type: "order",
        productSlugs: ["lord-deodorant"],
        items: [{ slug: "lord-deodorant", quantity }],
      },
      new Set(["lord-deodorant"])
    );

    expect(result.success).toBe(true);
    if (result.success && result.data.type === "order") {
      expect(result.data.items).toEqual([{ slug: "lord-deodorant", quantity }]);
    }
  });

  test.each([
    {
      productSlugs: ["lord-deodorant", "lord-deodorant"],
      items: [
        { slug: "lord-deodorant", quantity: 1 },
        { slug: "lord-deodorant", quantity: 1 },
      ],
    },
    {
      productSlugs: ["lord-deodorant", "hand-nail-cream"],
      items: [{ slug: "lord-deodorant", quantity: 1 }],
    },
    {
      productSlugs: ["lord-deodorant"],
      items: [{ slug: "lord-deodorant", quantity: 1.5 }],
    },
  ])("rejects conflicting order representations", (order) => {
    const result = validateClientApplication(
      { ...common, type: "order", ...order },
      new Set(["lord-deodorant", "hand-nail-cream"])
    );
    expect(result.success).toBe(false);
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
        eventDate: "2030-02-15",
        eventTime: "10:00",
      },
      new Set(),
      "ro",
      new Date("2030-01-01T10:00:00.000Z")
    );

    expect(result).toEqual({
      success: false,
      fieldErrors: {
        masterclassTopic: "Selectați o temă de masterclass din listă",
      },
    });
  });
});
