import { expect, test } from "vitest";
import { createConsultationSlotsProxy } from "../../api/consultation-slots";
test("public consultation slots are retired without an upstream request", async () => {
  const response = await createConsultationSlotsProxy()(new Request("https://catalog.example/api/consultation-slots"));
  expect(response.status).toBe(410);
  expect(await response.json()).toEqual({ ok: false, code: "BOOKING_RETIRED" });
});
test("retired booking endpoint never accepts mutations", async () => {
  expect((await createConsultationSlotsProxy()(new Request("https://catalog.example/api/consultation-slots", { method: "POST" }))).status).toBe(405);
});
