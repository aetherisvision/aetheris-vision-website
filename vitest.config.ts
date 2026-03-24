import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "tests/**/*.test.{ts,tsx}",
      "tests/**/*.spec.{ts,tsx}",
    ],
    exclude: [
      "tests/e2e/**",
      "node_modules/**",
    ],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts"],
    },
  },
});
