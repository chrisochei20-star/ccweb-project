import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const pageTitles = {
  "/dashboard": { title: "Dashboard", subtitle: "Overview of your activity" },
  "/streaming": { title: "AI Streaming", subtitle: "Live session management" },
  "/courses": { title: "Courses", subtitle: "Browse and manage your courses" },
  "/revenue": { title: "Revenue Dashboard", subtitle: "Earnings and payouts" },
  "/tokens": { title: "CCWEB Tokens", subtitle: "Token management and staking" },
  "/community": { title: "Community", subtitle: "Connect with learners" },
  "/settings": { title: "Settings", subtitle: "Account and platform preferences" },
};

export default function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const page = pageTitles[location.pathname] || { title: "CCWEB", subtitle: "" };

  return (
    <div className={`${darkMode ? "dark" : ""} flex h-screen overflow-hidden bg-surface-950`}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />

      <div
        className="flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? "4rem" : "15rem" }}
      >
        <TopBar
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((v) => !v)}
          title={page.title}
          subtitle={page.subtitle}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
