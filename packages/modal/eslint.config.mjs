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
];
