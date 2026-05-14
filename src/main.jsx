import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ToastViewport } from "./components/ui/ToastViewport";
import "./index.css";
import "./styles.css";
import "./ccweb-shell.css";
import "./learning/learning.css";

try {
  if (typeof window !== "undefined" && window.localStorage.getItem("ccweb-theme") === "light") {
    document.documentElement.classList.add("ccweb-light");
  }
} catch {
  /* ignore */
}

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (typeof window !== "undefined" && sentryDsn) {
  void import("@sentry/react").then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
      tracePropagationTargets: [/^\//, /^https?:\/\/127\.0\.0\.1/, /^https?:\/\/localhost/],
      tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.08),
      replaysSessionSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAY_SAMPLE_RATE || 0.02),
      replaysOnErrorSampleRate: 1,
    });
    window.__ccwebSentryCapture = (err, ctx) => Sentry.captureException(err, ctx);
  });
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <>
      <ToastViewport />
      <App />
    </>
  </React.StrictMode>,
);
