import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxy = (env.VITE_API_BASE_URL || env.VITE_DEV_API_PROXY_TARGET || "http://127.0.0.1:3000").replace(
    /\/$/,
    ""
  );
  const ccwebBuildId =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.RAILWAY_GIT_COMMIT ||
    process.env.GITHUB_SHA ||
    process.env.CCWEB_BUILD_ID ||
    env.CCWEB_BUILD_ID ||
    "";

  return {
    base: "/",
    define: {
      "import.meta.env.VITE_CCWEB_BUILD_ID": JSON.stringify(ccwebBuildId),
    },
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) return "vendor-react";
            if (id.includes("node_modules/react-router")) return "vendor-router";
            if (id.includes("node_modules/socket.io-client")) return "vendor-socket";
            if (id.includes("node_modules/recharts")) return "vendor-charts";
          },
        },
      },
    },
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

