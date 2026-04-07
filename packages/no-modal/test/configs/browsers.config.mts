import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { playwright } from "@vitest/browser-playwright";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "../..");
const repoRoot = resolve(pkgRoot, "../..");
const viteEnv = loadEnv("test", pkgRoot, "VITE_");

export default defineConfig({
  root: pkgRoot,
  server: {
    fs: { allow: [repoRoot] },
  },
  define: {
    "process.env.VITE_APP_INFURA_PROJECT_KEY": JSON.stringify(viteEnv.VITE_APP_INFURA_PROJECT_KEY ?? ""),
  },
  test: {
    reporters: ["default", "verbose"],
    include: ["test/**/*.{test,spec}.{ts,tsx,js,mjs,cjs}"],
    passWithNoTests: true,
    browser: {
      screenshotFailures: false,
      headless: true,
      provider: playwright(),
      enabled: true,
      instances: [
        { name: "Chrome", browser: "chromium" },
        { name: "Firefox", browser: "firefox" },
        { name: "Safari", browser: "webkit" },
      ],
    },
    coverage: {
      reporter: ["text-summary", "text"],
      provider: "istanbul",
      include: ["src/**/*.ts"],
      exclude: ["**/*.test.ts"],
    },
  },
});
