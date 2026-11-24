import { resolve } from "node:path";

import { reactLintPreset, tailwindLintPreset } from "@toruslabs/oxlint-config-react";
import { vueLintPreset } from "@toruslabs/oxlint-config-vue";
import { formatPreset } from "@toruslabs/torus-scripts/fmt";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite-plus";

const react = reactLintPreset();
const vueLint = vueLintPreset();
const tailwind = tailwindLintPreset({
  entryPoint: "src/style.css",
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_APP_INFURA_PROJECT_KEY, VITE_APP_SOLANA_MAINNET_RPC, VITE_APP_SOLANA_TESTNET_RPC, VITE_APP_SOLANA_DEVNET_RPC } = loadEnv(
    mode,
    process.cwd()
  );

  return {
    fmt: {
      ...formatPreset(),
      sortImports: false,
      htmlWhitespaceSensitivity: "ignore",
    },
    lint: {
      ...vueLint,
      plugins: [...new Set([...(react.plugins ?? []), ...(vueLint.plugins ?? [])])],
      jsPlugins: [...(react.jsPlugins ?? []), ...(vueLint.jsPlugins ?? []), ...(tailwind.jsPlugins ?? [])],
      rules: { ...react.rules, ...vueLint.rules, ...tailwind.rules },
      settings: { ...react.settings, ...vueLint.settings, ...tailwind.settings },
    },
    mode,
    server: {
      port: 8080,
      host: true,
    },
    plugins: [vue(), tailwindcss()],
    optimizeDeps: {
      include: ["@base-org/account", "@coinbase/wallet-sdk"],
    },
    resolve: {
      alias: {
        "@": "/src",
        "@wagmi/vue": resolve("./node_modules/@wagmi/vue"),
      },
      dedupe: ["react", "react-dom", "viem", "ox", "abitype", "vue"],
    },
    build: {
      sourcemap: true,
    },
    define: {
      global: "globalThis",
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      "process.env.VITE_APP_INFURA_PROJECT_KEY": JSON.stringify(VITE_APP_INFURA_PROJECT_KEY),
      "process.env.VITE_APP_SOLANA_MAINNET_RPC": JSON.stringify(VITE_APP_SOLANA_MAINNET_RPC),
      "process.env.VITE_APP_SOLANA_TESTNET_RPC": JSON.stringify(VITE_APP_SOLANA_TESTNET_RPC),
      "process.env.VITE_APP_SOLANA_DEVNET_RPC": JSON.stringify(VITE_APP_SOLANA_DEVNET_RPC),
    },
  };
});
