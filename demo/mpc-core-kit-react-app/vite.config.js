import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      crypto: "crypto",
    },
  },
  define: {
    global: "globalThis",
  },
});