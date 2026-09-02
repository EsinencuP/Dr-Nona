import { describe, expect, test } from "vitest";
import {
  normalizePhone,
  validateApplicationInput,
} from "../../shared/applications/application-schema";

const allowed = new Set(["lord-deodorant"]);
const base = {
  locale: "ru-MD",
  firstName: " Ana-Maria ",
  lastName: "O'Connor",
  phone: "+373 (69) 123-456",
  city: "Chișinău",
  consentAccepted: true,
  website: "",
};

describe("application schema", () => {
  test.each(["ru-MD", "ro-MD"] as const)(
    "accepts the supported application locale %s",
    (locale) => {
      const result = validateApplicationInput(
        { ...base, locale, type: "order", productSlugs: ["lord-deodorant"] },
        { allowedProductSlugs: allowed }
      );
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.locale).toBe(locale);
    }
  );

  test("rejects a missing or unsupported locale", () => {
    for (const locale of [undefined, "en-US"]) {
      const result = validateApplicationInput(
        { ...base, locale, type: "order", productSlugs: ["lord-deodorant"] },
        { allowedProductSlugs: allowed }
      );
      expect(result.success).toBe(false);
    }
  });
  test("accepts and trims a valid order, while deduplicating products", () => {
    const result = validateApplicationInput(
      {
        ...base,
        type: "order",
        productSlugs: ["lord-deodorant", "lord-deodorant"],
      },
      { allowedProductSlugs: allowed }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe("Ana-Maria");
      expect(result.data.type === "order" && result.data.productSlugs).toEqual([
        "lord-deodorant",
      ]);
    }
  });

  test("accepts and normalizes optional contact and analytics fields", () => {
    const result = validateApplicationInput(
      {
        ...base,
        type: "order",
        productSlugs: ["lord-deodorant"],
        email: " ana@example.com ",
        comment: "  Please call before delivery  ",
        preferredCallTime: "  after 18:00  ",
        utmSource: " instagram ",
        utmMedium: " story ",
        utmCampaign: " autumn ",
        utmContent: " product-card ",
        entryPoint: " /contactus?utm_source=instagram ",
        sessionHistory: ' ["lord-deodorant"] ',
      },
      { allowedProductSlugs: allowed }
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        email: "ana@example.com",
        comment: "Please call before delivery",
        preferredCallTime: "after 18:00",
        utmSource: "instagram",
        entryPoint: "/contactus?utm_source=instagram",
        sessionHistory: '["lord-deodorant"]',
      });
    }
  });

  test.each([
    ["email", { email: "not-an-email" }],
    ["comment", { comment: "x".repeat(501) }],
    ["preferredCallTime", { preferredCallTime: "x".repeat(101) }],
    ["utmSource", { utmSource: "x".repeat(201) }],
    ["entryPoint", { entryPoint: "x".repeat(501) }],
    ["sessionHistory", { sessionHistory: "x".repeat(2001) }],
  ])("rejects invalid optional field %s", (field, override) => {
    const result = validateApplicationInput(
      {
        ...base,
        type: "order",
        productSlugs: ["lord-deodorant"],
        ...override,
      },
      { allowedProductSlugs: allowed }
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors).toHaveProperty(field);
  });

  test("accepts a future consultation in Europe/Chisinau", () => {
    const result = validateApplicationInput(
      {
        ...base,
        type: "consultation",
        consultationMode: "offline",
        consultationDate: "2030-06-20",
        consultationTime: "14:30",
      },
      { allowedProductSlugs: allowed, now: new Date("2030-06-19T08:00:00Z") }
    );
    expect(result.success).toBe(true);
  });

  test.each([
    ["firstName", { firstName: "" }],
    ["lastName", { lastName: "" }],
    ["phone", { phone: "abc" }],
    ["city", { city: "" }],
    ["consentAccepted", { consentAccepted: false }],
    ["website", { website: "bot.example" }],
    ["type", { type: "unknown" }],
  ])("rejects invalid %s", (field, override) => {
    const result = validateApplicationInput(
      {
        ...base,
        type: "order",
        productSlugs: ["lord-deodorant"],
        ...override,
      },
      { allowedProductSlugs: allowed }
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors).toHaveProperty(field);
  });

  test("rejects empty and oversized order lists", () => {
    for (const productSlugs of [
      [],
      Array.from({ length: 21 }, (_, index) => `product-${index}`),
    ]) {
      const result = validateApplicationInput(
        { ...base, type: "order", productSlugs },
        { allowedProductSlugs: allowed }
      );
      expect(result.success).toBe(false);
    }
  });

  test.each(["parfum-faya", "unknown-product"])(
    "rejects unavailable product %s",
    (slug) => {
      const result = validateApplicationInput(
        { ...base, type: "order", productSlugs: [slug] },
        { allowedProductSlugs: allowed }
      );
      expect(result).toEqual({
        success: false,
        fieldErrors: { productSlugs: "Один или несколько товаров недоступны" },
      });
    }
  );

  test.each([
    ["consultationDate", { consultationDate: "2029-02-31" }],
    ["consultationTime", { consultationTime: "25:70" }],
    ["consultationMode", { consultationMode: "telephone" }],
  ])("rejects invalid consultation %s", (field, override) => {
    const result = validateApplicationInput(
      {
        ...base,
        type: "consultation",
        consultationMode: "online",
        consultationDate: "2030-06-20",
        consultationTime: "14:30",
        ...override,
      },
      { allowedProductSlugs: allowed, now: new Date("2030-06-19T08:00:00Z") }
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors).toHaveProperty(field);
  });

  test("rejects past Chisinau local date and time", () => {
    const result = validateApplicationInput(
      {
        ...base,
        type: "consultation",
        consultationMode: "online",
        consultationDate: "2030-06-19",
        consultationTime: "10:00",
      },
      { allowedProductSlugs: allowed, now: new Date("2030-06-19T08:30:00Z") }
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toHaveProperty("consultationDate");
    }
  });

  test("normalizes phone without inventing a country code", () => {
    expect(normalizePhone("+373 (69) 123-456")).toEqual({
      phone: "+373 (69) 123-456",
      phoneNormalized: "+37369123456",
    });
    expect(normalizePhone("069 123 456").phoneNormalized).toBe("069123456");
  });
});
