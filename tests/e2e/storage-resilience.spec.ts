import { expect, test } from "@playwright/test";

test("restricted storage does not break startup or session selection", async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.addInitScript(() => {
    const fail = () => {
      throw new DOMException("Storage is blocked", "SecurityError");
    };
    Storage.prototype.getItem = fail;
    Storage.prototype.setItem = fail;
    (window as Window & { __storageErrorCount?: number })
      .__storageErrorCount = 0;
    window.addEventListener("drnona:error", (event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.kind === "storage-error") {
        const state = window as Window & { __storageErrorCount?: number };
        state.__storageErrorCount = (state.__storageErrorCount ?? 0) + 1;
      }
    });
  });

  await page.goto("/products");
  await expect(
    page.getByRole("heading", { level: 1, name: "Каталог Dr. Nona" })
  ).toBeVisible();

  const firstCard = page.locator(".product-card").first();
  const productName = await firstCard.getByRole("heading", { level: 3 })
    .innerText();
  await firstCard.getByRole("button", { name: "В подборку" }).click();
  await expect(
    page.getByRole("link", { name: "Подборка: 1" })
  ).toBeVisible();

  await page.getByRole("link", { name: "Подборка: 1" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: productName })
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { __storageErrorCount?: number })
            .__storageErrorCount ?? 0
      )
    )
    .toBeGreaterThan(0);
  expect(pageErrors).toEqual([]);
});

