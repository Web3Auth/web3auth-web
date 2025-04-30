import toruslabsTypescript from "@toruslabs/eslint-config-typescript";

export default [
  ...toruslabsTypescript,
  {
    files: ["packages/no-modal/src/react/wagmi/provider.ts", "packages/no-modal/src/vue/wagmi/provider.ts"],
    rules: {
      "import/no-extraneous-dependencies": "off",
    },
  },
];
