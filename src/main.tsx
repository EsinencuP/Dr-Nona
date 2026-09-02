import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ApplicationErrorBoundary } from "./app/ApplicationErrorBoundary";
import { captureUtmParameters } from "./features/contact/utm-capture";
import { Router } from "./router";
import "./styles.css";

captureUtmParameters();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApplicationErrorBoundary>
      <Router>
        <App />
      </Router>
    </ApplicationErrorBoundary>
  </StrictMode>
);
