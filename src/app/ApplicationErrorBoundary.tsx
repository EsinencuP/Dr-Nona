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

    const romanian = window.location.pathname.startsWith("/ro") || document.documentElement.lang === "ro";
    const copy = romanian ? {
      eyebrow: "Eroare de interfață", title: "Pagina este temporar indisponibilă",
      text: "Eroarea a fost înregistrată. Reîncărcați pagina sau reveniți la pagina principală.",
      reload: "Reîncarcă pagina", home: "Pagina principală",
    } : {
      eyebrow: "Ошибка интерфейса", title: "Страница временно недоступна",
      text: "Ошибка зафиксирована. Обновите страницу или вернитесь на главную.",
      reload: "Обновить страницу", home: "Вернуться на главную",
    };

    return (
      <main className="application-error" role="alert">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.text}</p>
        <div className="application-error__actions">
          <button
            className="button button--primary"
            type="button"
            onClick={() => window.location.reload()}
          >
            {copy.reload}
          </button>
          <a className="button button--secondary" href={romanian ? "/ro" : "/"}>
            {copy.home}
          </a>
        </div>
      </main>
    );
  }
}
