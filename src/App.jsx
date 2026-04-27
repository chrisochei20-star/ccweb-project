import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Streaming from "./pages/Streaming";
import Courses from "./pages/Courses";
import Revenue from "./pages/Revenue";
import Tokens from "./pages/Tokens";
import Community from "./pages/Community";
import Settings from "./pages/Settings";
import "./index.css";

function SettingsWrapper() {
  const [darkMode, setDarkMode] = useState(true);
  return <Settings darkMode={darkMode} onToggleDark={() => setDarkMode((v) => !v)} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="streaming" element={<Streaming />} />
          <Route path="courses" element={<Courses />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="tokens" element={<Tokens />} />
          <Route path="community" element={<Community />} />
          <Route path="settings" element={<SettingsWrapper />} />
          <Route path="notifications" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
