import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_APP_INFURA_PROJECT_KEY, VITE_APP_SOLANA_MAINNET_RPC, VITE_APP_SOLANA_TESTNET_RPC, VITE_APP_SOLANA_DEVNET_RPC } = loadEnv(
    mode,
    process.cwd()
  );

  return {
    mode,
    server: {
      port: 8080,
      host: true,
    },
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        "@": "/src",
        "@wagmi/vue": resolve("./node_modules/@wagmi/vue"),
      },
      dedupe: ["react", "react-dom", "viem", "ox", "abitype"],
    },
    optimizeDeps: {
      include: [
        "@web3auth/modal",
        "@web3auth/no-modal",
      ],
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const norm = id.replace(/\\/g, "/");
            if (
              norm.includes("/node_modules/viem/") ||
              norm.includes("/node_modules/ox/") ||
              norm.includes("/node_modules/abitype/") ||
              norm.includes("/node_modules/@noble/") ||
              norm.includes("/node_modules/@scure/") ||
              norm.includes("/node_modules/@wagmi/") ||
              norm.includes("/node_modules/wagmi/") ||
              norm.includes("/node_modules/@walletconnect/") ||
              norm.includes("/node_modules/@coinbase/") ||
              norm.includes("/node_modules/@metamask/") ||
              norm.includes("/node_modules/@solana/") ||
              norm.includes("/node_modules/@solana-program/") ||
              norm.includes("/node_modules/@web3auth/") ||
              norm.includes("/node_modules/@toruslabs/") ||
              norm.includes("/node_modules/permissionless/") ||
              norm.includes("/node_modules/ethers/")
            ) {
              return "web3";
            }
          },
        },
      },
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
