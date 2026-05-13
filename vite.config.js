import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxy = (env.VITE_DEV_API_PROXY_TARGET || "http://127.0.0.1:3000").replace(/\/$/, "");

  return {
    base: "/",
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": { target: apiProxy, changeOrigin: true },
        "/v1": { target: apiProxy, changeOrigin: true },
        "/auth": { target: apiProxy, changeOrigin: true },
        "/socket.io": { target: apiProxy, changeOrigin: true, ws: true },
      },
    },
  };
});
