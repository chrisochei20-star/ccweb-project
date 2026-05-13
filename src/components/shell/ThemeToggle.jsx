import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "ccweb-theme";

function readTheme() {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(KEY) === "light" ? "light" : "dark";
}

function applyTheme(mode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (mode === "light") {
    root.classList.add("ccweb-light");
  } else {
    root.classList.remove("ccweb-light");
  }
}

export function ThemeToggle() {
  const [mode, setMode] = useState(() => readTheme());

  useEffect(() => {
    applyTheme(mode);
    try {
      window.localStorage.setItem(KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  return (
    <button
      type="button"
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="ccweb-outline-btn flex h-9 w-9 items-center justify-center rounded-xl p-0"
      onClick={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
    >
      {mode === "dark" ? <Sun className="h-4 w-4 text-amber-200" /> : <Moon className="h-4 w-4 text-slate-700" />}
    </button>
  );
}
