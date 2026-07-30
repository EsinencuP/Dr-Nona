import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ApplicationErrorBoundary } from "./app/ApplicationErrorBoundary";
import { Router } from "./router";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApplicationErrorBoundary>
      <Router>
        <App />
      </Router>
    </ApplicationErrorBoundary>
  </StrictMode>
);
