import toruslabsReact from "@toruslabs/eslint-config-react";

export default [
  ...toruslabsReact,
  {
    ignores: ["./src/vue"],
  },
];
