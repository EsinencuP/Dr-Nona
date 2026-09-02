import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { ApplicationInput } from "../../shared/applications/application-schema";
import { ApplicationForm } from "../../src/features/contact/ApplicationForm";
import { loadProductData } from "../../src/data";
import { LocaleProvider } from "../../src/locales/LocaleProvider";
import { Router } from "../../src/router";

const { products } = await loadProductData();

async function fillCommon(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Имя"), "Ana");
  await user.type(screen.getByLabelText("Фамилия"), "Popescu");
  await user.type(screen.getByLabelText("Телефон"), "069 123 456");
  await user.type(screen.getByLabelText("Город"), "Chișinău");
  await user.click(screen.getByRole("checkbox"));
}

describe("ApplicationForm", () => {
  test("focuses the first invalid field after client validation", async () => {
    const user = userEvent.setup();
    render(<ApplicationForm products={[]} />);

    await user.click(screen.getByRole("button", { name: "Отправить заявку" }));

    const firstName = screen.getByRole("textbox", { name: /^Имя/ });
    await waitFor(() => expect(firstName).toHaveFocus());
    expect(firstName).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });

  test("defaults to consultation without products and focuses success status", async () => {
    const submit = vi.fn(async () => ({
      kind: "success" as const,
      requestId: "request-1",
      delivery: { telegram: "sent" as const },
    }));
    const user = userEvent.setup();
    render(<ApplicationForm products={[]} submit={submit} />);
    expect(
      screen.getByRole("button", { name: "Консультация" })
    ).toHaveAttribute("aria-pressed", "true");
    await fillCommon(user);
    await user.type(screen.getByLabelText("Предпочтительная дата"), "2099-01-01");
    await user.type(screen.getByLabelText("Предпочтительное время"), "10:00");
    await user.click(screen.getByRole("button", { name: "Отправить заявку" }));
    await waitFor(() =>
      expect(screen.getByText(/Заявка №request-1 отправлена/)).toBeVisible()
    );
    expect(screen.getByRole("heading", { name: "Статус заявки" })).toHaveFocus();
  });

  test("defaults to order with products and blocks duplicate submit", async () => {
    let resolveSubmit: ((value: {
      kind: "success";
      requestId: string;
      delivery: { telegram: "sent" };
    }) => void) | undefined;
    const submit = vi.fn(
      () =>
        new Promise<{
          kind: "success";
          requestId: string;
          delivery: { telegram: "sent" };
        }>((resolve) => {
          resolveSubmit = resolve;
        })
    );
    const user = userEvent.setup();
    render(
      <ApplicationForm
        products={[products[0]]}
        submit={submit}
      />
    );
    expect(screen.getByRole("button", { name: "Заказ" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await fillCommon(user);
    const button = screen.getByRole("button", { name: "Отправить заявку" });
    await user.click(button);
    expect(screen.getByRole("button", { name: "Отправляем заявку…" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Отправляем заявку…" }));
    expect(submit).toHaveBeenCalledTimes(1);
    resolveSubmit?.({
      kind: "success",
      requestId: "request-2",
      delivery: { telegram: "sent" },
    });
    await waitFor(() =>
      expect(screen.getByText(/Заявка №request-2 отправлена/)).toBeVisible()
    );
  });

  test("keeps entered values after a server error", async () => {
    const user = userEvent.setup();
    render(
      <ApplicationForm
        products={[]}
        submit={async () => ({ kind: "server-error" })}
      />
    );
    await fillCommon(user);
    await user.type(screen.getByLabelText("Предпочтительная дата"), "2099-01-01");
    await user.type(screen.getByLabelText("Предпочтительное время"), "10:00");
    await user.click(screen.getByRole("button", { name: "Отправить заявку" }));
    await waitFor(() =>
      expect(screen.getByText(/Заявка не отправлена/)).toBeVisible()
    );
    expect(screen.getByLabelText("Имя")).toHaveValue("Ana");
    expect(screen.getByLabelText("Телефон")).toHaveValue("069 123 456");
  });

  test("submits optional contact fields and stored attribution context", async () => {
    window.history.replaceState({}, "", "/contactus?source=selection");
    sessionStorage.setItem("utm_source", "instagram");
    sessionStorage.setItem("utm_medium", "story");
    sessionStorage.setItem("utm_campaign", "autumn-care");
    sessionStorage.setItem("utm_content", "product-card");
    sessionStorage.setItem(
      "session_product_history",
      JSON.stringify(["lord-deodorant"])
    );
    const submit = vi.fn(
      async (input: ApplicationInput, idempotencyKey: string) => {
        void input;
        void idempotencyKey;
        return {
          kind: "success" as const,
          requestId: "request-context",
          delivery: { telegram: "sent" as const },
        };
      }
    );
    const user = userEvent.setup();
    render(<ApplicationForm products={[]} submit={submit} />);

    await fillCommon(user);
    await user.type(screen.getByLabelText("Email (необязательно)"), "ana@example.com");
    await user.type(
      screen.getByLabelText("Комментарий к заявке (необязательно)"),
      "Позвоните заранее"
    );
    await user.type(
      screen.getByLabelText("Удобное время для звонка (необязательно)"),
      "После 18:00"
    );
    await user.type(screen.getByLabelText("Предпочтительная дата"), "2099-01-01");
    await user.type(screen.getByLabelText("Предпочтительное время"), "10:00");
    await user.click(screen.getByRole("button", { name: "Отправить заявку" }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0][0]).toMatchObject({
      email: "ana@example.com",
      comment: "Позвоните заранее",
      preferredCallTime: "После 18:00",
      utmSource: "instagram",
      utmMedium: "story",
      utmCampaign: "autumn-care",
      utmContent: "product-card",
      entryPoint: "/contactus?source=selection",
      sessionHistory: '["lord-deodorant"]',
    });
    window.history.replaceState({}, "", "/");
  });

  test("renders optional fields in Romanian", () => {
    window.history.replaceState({}, "", "/ro/contactus");
    render(
      <Router>
        <LocaleProvider>
          <ApplicationForm products={[]} />
        </LocaleProvider>
      </Router>
    );

    expect(screen.getByLabelText("Email (opțional)")).toBeVisible();
    expect(
      screen.getByLabelText("Comentariu la solicitare (opțional)")
    ).toBeVisible();
    expect(
      screen.getByLabelText("Interval potrivit pentru apel (opțional)")
    ).toBeVisible();
    window.history.replaceState({}, "", "/");
  });
});
