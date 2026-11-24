import { reactLintPreset } from "@toruslabs/oxlint-config-react";
import { formatPreset } from "@toruslabs/torus-scripts/fmt";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ...formatPreset(),
    sortImports: false,
  },
  lint: reactLintPreset(),
  plugins: [react()],
  server: {
    // this ensures that the browser opens upon server start
    open: true,
    // this sets a default port to 3000
    port: 3000,
  },
  resolve: {
    alias: {
      wagmi: resolve("./node_modules/wagmi"),
    },
  },
});
