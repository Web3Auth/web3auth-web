import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { playwright } from "@vitest/browser-playwright";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "../..");
const repoRoot = resolve(pkgRoot, "../..");
const viteEnv = loadEnv("test", pkgRoot, "VITE_");

/** Pre-bundle heavy deps so the browser runner does not mid-run reload (flaky / broken imports). */
const modalOptimizeDepsInclude = [
  "react",
  "react-dom",
  "react-dom/client",
  "react/jsx-dev-runtime",
  "@babel/runtime/helpers/defineProperty",
  "@babel/runtime/helpers/objectSpread2",
  "@babel/runtime/helpers/objectWithoutProperties",
  "@hcaptcha/react-hcaptcha",
  "bowser",
  "classnames",
  "clsx",
  "color",
  "i18next",
  "react-i18next",
  "react-qrcode-logo",
  "tailwind-merge",
];

export default defineConfig({
  root: pkgRoot,
  server: {
    fs: { allow: [repoRoot] },
  },
  optimizeDeps: {
    include: modalOptimizeDepsInclude,
  },
  define: {
    "process.env.VITE_APP_INFURA_PROJECT_KEY": JSON.stringify(viteEnv.VITE_APP_INFURA_PROJECT_KEY ?? ""),
  },
  test: {
    reporters: ["default", "verbose"],
    setupFiles: ["./test/setup/browser-polyfills.ts"],
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
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["**/*.test.ts", "**/*.test.tsx"],
    },
  },
});
