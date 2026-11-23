import { reactLintPreset } from "@toruslabs/oxlint-config-react";
import { formatPreset } from "@toruslabs/torus-scripts/fmt";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ...formatPreset(),
    sortImports: false,
  },
  lint: reactLintPreset(),
});
