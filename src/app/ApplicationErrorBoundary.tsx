import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { reportClientError } from "./monitoring";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ApplicationErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidMount() {
    window.addEventListener("popstate", this.resetAfterNavigation);
    window.addEventListener("drnona:navigate", this.resetAfterNavigation);
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError(error, {
      kind: "render-error",
      source: "react",
      componentStack: info.componentStack ?? undefined,
    });
  }

  componentWillUnmount() {
    window.removeEventListener("popstate", this.resetAfterNavigation);
    window.removeEventListener("drnona:navigate", this.resetAfterNavigation);
  }

  resetAfterNavigation = () => {
    if (this.state.hasError) this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="application-error" role="alert">
        <p className="eyebrow">Ошибка интерфейса</p>
        <h1>Страница временно недоступна</h1>
        <p>
          Ошибка зафиксирована. Обновите страницу или вернитесь на главную.
        </p>
        <div className="application-error__actions">
          <button
            className="button button--primary"
            type="button"
            onClick={() => window.location.reload()}
          >
            Обновить страницу
          </button>
          <a className="button button--secondary" href="/">
            Вернуться на главную
          </a>
        </div>
      </main>
    );
  }
}
