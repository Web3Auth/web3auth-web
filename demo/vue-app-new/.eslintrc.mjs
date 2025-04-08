import toruslabsVue from "@toruslabs/eslint-config-vue";

export default [
  ...toruslabsVue,
  {
    ignores: ["*.config.mjs", "*.config.mts"],
  },
];
