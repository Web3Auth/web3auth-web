import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: "verbose",
    include: ["test/**/*.{test,spec}.{ts,tsx,js,mjs,cjs}"],
    passWithNoTests: true,
    coverage: {
      reporter: ["text"],
      provider: "istanbul",
      include: ["src/**/*.ts"],
    },
    environment: "node",
  },
});
