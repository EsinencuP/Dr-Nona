import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ApplicationErrorBoundary } from "../../src/app/ApplicationErrorBoundary";
import { getClientErrorRecords } from "../../src/app/monitoring";

function BrokenView(): never {
  throw new Error("Controlled render failure");
}

describe("application error boundary", () => {
  test("shows a recoverable screen and reports the render failure", () => {
    const captureException = vi.fn();
    window.__DR_NONA_MONITORING__ = { captureException };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <ApplicationErrorBoundary>
        <BrokenView />
      </ApplicationErrorBoundary>
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Страница временно недоступна",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Обновить страницу" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Вернуться на главную" })
    ).toHaveAttribute("href", "/");
    expect(getClientErrorRecords()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "render-error",
          source: "react",
          message: "Controlled render failure",
        }),
      ])
    );
    expect(captureException).toHaveBeenCalledOnce();

    delete window.__DR_NONA_MONITORING__;
    consoleError.mockRestore();
  });
});
