import toruslabsReact from "@toruslabs/eslint-config-react";

export default [
  ...toruslabsReact,
  {
    ignores: ["*.config.mjs", "*.config.mts"],
  },
];
