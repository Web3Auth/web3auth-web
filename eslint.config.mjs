import toruslabsTypescript from "@toruslabs/eslint-config-typescript";

export default [
  ...toruslabsTypescript,
  {
    files: ["packages/no-modal/src/react/wagmi/**.ts", "packages/no-modal/src/vue/wagmi/**.ts"],
    rules: {
      "import/no-extraneous-dependencies": "off",
    },
  },
];
