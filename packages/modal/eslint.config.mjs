import toruslabsReact from "@toruslabs/eslint-config-react";

export default [
  ...toruslabsReact,
  {
    ignores: ["./rollup.config.mjs"],
  },
  {
    files: ["./src/react/wagmi/**.ts", "./src/vue/wagmi/**.ts"],
    rules: {
      "import/no-extraneous-dependencies": "off",
    },
  },
  {
    files: ["./src/vue/**/*.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    files: ["./test/configs/browsers.config.mts"],
    rules: {
      // @vitest/browser-playwright is hoisted at repo root; suppress only that import via file-local disable in the file.
      "import/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: ["**/*.test.ts", "**/*.test.tsx", "**/test/configs/**", "**/**/eslint.config.mjs"],
        },
      ],
    },
  },
];
