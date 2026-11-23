import { reactLintPreset, tailwindLintPreset } from "@toruslabs/oxlint-config-react";
import { vueLintPreset } from "@toruslabs/oxlint-config-vue";
import { formatPreset } from "@toruslabs/torus-scripts/fmt";
import { defineConfig } from "vite-plus";

const react = reactLintPreset();
const vue = vueLintPreset();
const tailwind = tailwindLintPreset({
  entryPoint: "packages/modal/src/ui/css/index.css",
});

const ignorePatterns = [
  "**/node_modules/**",
  "**/dist/**",
  "**/coverage/**",
  "**/build/**",
  "**/.git/**",
  "**/package-lock.json",
  "packages/*/types/**",
  ".github/CODEOWNERS",
];

export default defineConfig({
  fmt: {
    ...formatPreset(),
    sortImports: false,
    ignorePatterns,
  },
  lint: {
    ...react,
    plugins: [...new Set([...(react.plugins ?? []), ...(vue.plugins ?? [])])],
    jsPlugins: [...(react.jsPlugins ?? []), ...(vue.jsPlugins ?? []), ...(tailwind.jsPlugins ?? [])],
    rules: { ...react.rules, ...vue.rules, ...tailwind.rules },
    settings: { ...react.settings, ...vue.settings, ...tailwind.settings },
    ignorePatterns,
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
