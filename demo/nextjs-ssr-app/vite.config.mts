import { reactLintPreset } from "@toruslabs/oxlint-config-react";
import { formatPreset } from "@toruslabs/torus-scripts/fmt";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ...formatPreset(),
    sortImports: false,
    ignorePatterns: ["**/.next/**", "**/node_modules/**", "**/package-lock.json"],
  },
  lint: {
    ...reactLintPreset(),
    ignorePatterns: ["**/.next/**", "**/node_modules/**", "**/package-lock.json"],
  },
});
