import toruslabsTypescript from "@toruslabs/eslint-config-typescript";

export default [
  ...toruslabsTypescript,
  {
    files: ["packages/no-modal/src/react/wagmi/**.ts", "packages/no-modal/src/vue/wagmi/**.ts"],
    rules: {
      "import/no-extraneous-dependencies": "off",
    },
  },
  {
    files: ["packages/no-modal/src/connectors/auth-connector/*.ts"],
    rules: {
      "import/no-unresolved": "off",
    },
  },
  {
    files: ["scripts/**/*.mjs", "locales/**/*.mjs"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["packages/**/test/**/*.ts", "packages/**/test/**/*.tsx", "packages/**/test/**/*.mts"],
    rules: {
      "import/no-extraneous-dependencies": "off",
    },
  },
];
