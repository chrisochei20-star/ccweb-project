import React from "react";
import { createRoot } from "react-dom/client";
import { logCcwebApiRuntimeDebug } from "./config/env";
import App from "./App";
import { ToastViewport } from "./components/ui/ToastViewport";
import { initProductionAnalytics } from "./lib/clientAnalytics";
import { initCapacitorShell } from "./lib/capacitorPlatform";
import { initNativePushNotifications } from "./lib/nativePush";
import { registerServiceWorker } from "./lib/registerServiceWorker";
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

logCcwebApiRuntimeDebug();
initProductionAnalytics();
void initCapacitorShell().then(() => initNativePushNotifications());
registerServiceWorker();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <>
      <ToastViewport />
      <App />
    </>
  </React.StrictMode>,
);
