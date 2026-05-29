import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** Tests import `src/config/env.js`; keep `import.meta.env.PROD` false so URL guard tests exercise dev semantics. */
const testBuildId = process.env.CCWEB_BUILD_ID || process.env.GITHUB_SHA || "vitest-local";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "import.meta.env.PROD": false,
    "import.meta.env.DEV": true,
    "import.meta.env.VITE_CCWEB_BUILD_ID": JSON.stringify(testBuildId),
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
  },
});
