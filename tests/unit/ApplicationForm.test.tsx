import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { ApplicationInput } from "../../shared/applications/application-schema";
import { ApplicationForm } from "../../src/features/contact/ApplicationForm";
import { loadProductData } from "../../src/data";
import { LocaleProvider } from "../../src/locales/LocaleProvider";
import { Router } from "../../src/router";
import { setPrivacyChoice } from "../../src/features/privacy/privacyChoice";

const { products } = await loadProductData();
async function fillCommon(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Имя"), "Ana");
  await user.type(screen.getByLabelText("Фамилия"), "Popescu");
  await user.type(screen.getByLabelText("Телефон"), "069 123 456");
  await user.selectOptions(
    screen.getByLabelText("Регион доставки (Молдова)"),
    "Кишинёв"
  );
  await user.click(screen.getByRole("checkbox"));
}

describe("ApplicationForm", () => {
  test("renders only order controls without booking tabs or fields", () => {
    render(<ApplicationForm products={[]} />);
    expect(screen.getByRole("button", { name: "Оформить заказ" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Консультация" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Мастер-класс" })).not.toBeInTheDocument();
    expect(document.querySelector('input[type="date"], input[type="time"], .application-mode')).toBeNull();
  });

  test("focuses the first invalid field after client validation", async () => {
    const user = userEvent.setup();
    render(<ApplicationForm products={[products[0]]} />);

    await user.click(screen.getByRole("button", { name: "Оформить заказ" }));

    const firstName = screen.getByRole("textbox", { name: /^Имя/ });
    await waitFor(() => expect(firstName).toHaveFocus());
    expect(firstName).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });

  test("thanks the applicant and retains the receipt after closing", async () => {
    const submit = vi.fn(async () => ({
      kind: "success" as const,
      requestId: "request-1",
      delivery: { telegram: "sent" as const },
    }));
    const user = userEvent.setup();
    render(<ApplicationForm products={[products[0]]} submit={submit} />);
    expect(screen.queryByRole("group", { name: "Тип заявки" })).not.toBeInTheDocument();
    await fillCommon(user);
    await user.click(screen.getByRole("button", { name: "Оформить заказ" }));
    await waitFor(() =>
      expect(screen.getAllByText(/Заказ отправлен. Менеджер свяжется/)[0]).toBeVisible()
    );
    expect(screen.getByRole("dialog", { name: "Благодарим за заказ!" })).toBeVisible();
    const close = screen.getByRole("button", { name: "Понятно" });
    expect(close).toHaveFocus();
    await user.click(close);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Статус заказа" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Заказ отправлен" })).toBeDisabled();
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
    expect(screen.queryByRole("group", { name: "Тип заявки" })).not.toBeInTheDocument();
    await fillCommon(user);
    const button = screen.getByRole("button", { name: "Оформить заказ" });
    await user.click(button);
    expect(screen.getByRole("button", { name: "Отправляем заказ…" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Отправляем заказ…" }));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    resolveSubmit?.({
      kind: "success",
      requestId: "request-2",
      delivery: { telegram: "sent" },
    });
    await waitFor(() =>
      expect(screen.getAllByText(/Заказ отправлен. Менеджер свяжется/)[0]).toBeVisible()
    );
    expect(screen.getByRole("dialog", { name: "Благодарим за заказ!" })).toHaveTextContent("Номер заказа: request-2");
    expect(screen.getByLabelText("Имя")).toHaveValue("");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(document.querySelectorAll(".application-products li")).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Понятно" }));
    await user.click(screen.getByRole("button", { name: "Заказ отправлен" }));
    expect(submit).toHaveBeenCalledTimes(1);
  });

  test("submits the quantity selected for an order product", async () => {
    const submit = vi.fn(
      async (input: ApplicationInput, idempotencyKey: string) => {
        void input;
        void idempotencyKey;
        return {
          kind: "success" as const,
          requestId: "request-quantity",
          delivery: { telegram: "sent" as const },
        };
      }
    );
    const product = products[0];
    const user = userEvent.setup();
    render(<ApplicationForm products={[product]} submit={submit} />);

    await fillCommon(user);
    const decrease = screen.getByRole("button", {
      name: `Уменьшить количество ${product.officialName}`,
    });
    const increase = screen.getByRole("button", {
      name: `Увеличить количество ${product.officialName}`,
    });
    expect(decrease).toBeDisabled();
    await user.click(increase);
    await user.click(increase);
    expect(
      screen.getByRole("group", {
        name: `Количество: ${product.officialName}`,
      })
    ).toHaveTextContent("3");

    await user.click(screen.getByRole("button", { name: "Оформить заказ" }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0][0]).toMatchObject({
      type: "order",
      items: [{ slug: product.slug, quantity: 3 }],
    });
  });

  test("sends names, SKUs and links with the selected order", async () => {
    const submit = vi.fn(async (input: ApplicationInput, key: string) => { void input; void key; return { kind: "server-error" as const }; });
    const user = userEvent.setup();
    render(<ApplicationForm products={[products[0]]} submit={submit} />);
    await fillCommon(user);
    await user.click(screen.getByRole("button", { name: "Оформить заказ" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ type: "order", items: [expect.objectContaining({ officialName: products[0].officialName, sku: products[0].sku, url: expect.stringContaining(`/product/${products[0].slug}`) })] }), expect.any(String));
  });

  test("keeps entered values after a server error", async () => {
    const user = userEvent.setup();
    render(
      <ApplicationForm
        products={[products[0]]}
        submit={async () => ({ kind: "server-error" })}

      />
    );
    await fillCommon(user);
    await user.click(screen.getByRole("button", { name: "Оформить заказ" }));
    await waitFor(() =>
      expect(screen.getByText(/Не удалось отправить заказ/)).toBeVisible()
    );
    expect(screen.getByLabelText("Имя")).toHaveValue("Ana");
    expect(screen.getByLabelText("Телефон")).toHaveValue("069 123 456");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("submits optional contact fields and stored attribution context", async () => {
    setPrivacyChoice("accepted");
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
    render(<ApplicationForm products={[products[0]]} submit={submit} />);

    await fillCommon(user);
    await user.type(screen.getByLabelText("Email (необязательно)"), "ana@example.com");
    await user.type(
      screen.getByLabelText("Комментарий к заказу (необязательно)"),
      "Позвоните заранее"
    );
    await user.type(
      screen.getByLabelText("Удобное время для звонка (необязательно)"),
      "После 18:00"
    );
    await user.click(screen.getByRole("button", { name: "Оформить заказ" }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0][0]).toMatchObject({
      email: "ana@example.com",
      comment: "Позвоните заранее",
      preferredCallTime: "После 18:00",
      utmSource: "instagram",
      utmMedium: "story",
      utmCampaign: "autumn-care",
      utmContent: "product-card",
      entryPoint: "/contactus",
      sessionHistory: '["lord-deodorant"]',
    });
    window.history.replaceState({}, "", "/");
  });

  test("renders optional fields in Romanian", () => {
    window.history.replaceState({}, "", "/ro/contactus");
    render(
      <Router>
        <LocaleProvider>
          <ApplicationForm products={[products[0]]} />
        </LocaleProvider>
      </Router>
    );

    expect(screen.getByLabelText("Email (opțional)")).toBeVisible();
    expect(
      screen.getByLabelText("Comentariu la comandă (opțional)")
    ).toBeVisible();
    expect(
      screen.getByLabelText("Interval potrivit pentru apel (opțional)")
    ).toBeVisible();
    window.history.replaceState({}, "", "/");
  });

  test("has only the Romanian order action without retired booking fields", () => {
    window.history.replaceState({}, "", "/ro/contactus");
    render(<Router><LocaleProvider><ApplicationForm products={[]} /></LocaleProvider></Router>);
    expect(screen.getByRole("button", { name: "Plasează comanda" })).toBeDisabled();
    expect(screen.queryByText("Masterclass")).not.toBeInTheDocument();
    expect(screen.queryByText("Consultație")).not.toBeInTheDocument();
  });
});
