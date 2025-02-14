import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_APP_INFURA_PROJECT_KEY, VITE_APP_SOLANA_MAINNET_RPC, VITE_APP_SOLANA_TESTNET_RPC, VITE_APP_SOLANA_DEVNET_RPC } = loadEnv(
    mode,
    process.cwd()
  );
  console.log(VITE_APP_INFURA_PROJECT_KEY, VITE_APP_SOLANA_MAINNET_RPC, VITE_APP_SOLANA_TESTNET_RPC, VITE_APP_SOLANA_DEVNET_RPC);

  return {
    mode,
    server: {
      port: 8080,
    },
    plugins: [vue()],
    resolve: {
      alias: {
        "@": "/src",
        stream: "stream-browserify",
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
    optimizeDeps: {
      include: ["stream-browserify"],
    },
  };
});
