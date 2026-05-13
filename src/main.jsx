import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
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

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
