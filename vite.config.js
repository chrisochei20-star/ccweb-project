import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = (env.VITE_DEV_API_PROXY_TARGET || "").trim().replace(/\/$/, "");

  return {
    plugins: [react()],
    server: {
      proxy: proxyTarget
        ? {
            "/api": {
              target: proxyTarget,
              changeOrigin: true,
            },
          }
        : {},
    },
  };
});
