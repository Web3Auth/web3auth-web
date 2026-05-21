import toruslabsVue from "@toruslabs/eslint-config-vue";

export default [
  ...toruslabsVue,
  rules: {
    "vue/html-indent": 0,
    "tailwindcss/no-custom-classname": 0,
    "vue/singleline-html-element-content-newline": 0,
    "import/no-unresolved": [
      "error",
      { ignore: ["@toruslabs/vue-components/*", "@web3auth/checkout/*", "@web3auth/portfolio/*", "@web3auth/walletconnect/*", "@web3auth/swap/*"] },
    ],
    "@stylistic/quotes": 0,
    "vue/prop-name-casing": 0,
    "security/detect-non-literal-fs-filename": 0,
    "no-underscore-dangle": 0,
    "vue/multi-word-component-names": 0,
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "typeLike",
        format: ["camelCase", "UPPER_CASE", "PascalCase"],
      },
    ],
    quotes: 0,
    "vue/require-valid-default-prop": 0,
    "@typescript-eslint/quotes": 0,
    "no-console": 0,
    "@typescript-eslint/comma-dangle": 0,
    "prettier/prettier": [
      2,
      {
        singleQuote: false,
        printWidth: 150,
        semi: true,
        trailingComma: "es5",
      },
    ],
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never",
      },
    ],
  },
  {
    ignores: ["*.config.mjs", "*.config.mts"],
  },
  {
    files: ["*.json"],
    rules: {
      "@typescript-eslint/no-unused-expressions": 0,
    },
  },
];
