import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { playwright } from "@vitest/browser-playwright";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "../..");
const repoRoot = resolve(pkgRoot, "../..");
const viteEnv = loadEnv("test", pkgRoot, "VITE_");

/** Pre-bundle shared runtime deps so the browser runner doesn't re-optimize them mid-run. */
const noModalOptimizeDepsInclude = [
  "react",
  "react-dom",
  "react-dom/client",
  "react/jsx-dev-runtime",
  "vue",
  "@web3auth/auth",
  "@toruslabs/http-helpers",
  "ethers",
  "jwt-decode",
  "viem",
  "viem/siwe",
  "viem/account-abstraction",
  "wagmi",
  "@wagmi/core",
  "@wagmi/vue",
  "@wagmi/vue/connectors",
  "@wagmi/vue/chains",
  "@walletconnect/sign-client",
  "@walletconnect/utils",
  "@metamask/connect-evm",
  "@metamask/connect-multichain",
  "@metamask/connect-solana",
  "@solana/client",
  "@solana/kit",
  "@solana/react-hooks",
  "@solana/wallet-standard-features",
  "@wallet-standard/app",
  "@wallet-standard/base",
  "@wallet-standard/features",
  "@x402/evm",
  "@x402/fetch",
  "@x402/svm",
];

export default defineConfig({
  root: pkgRoot,
  server: {
    fs: { allow: [repoRoot] },
  },
  optimizeDeps: {
    include: noModalOptimizeDepsInclude,
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
