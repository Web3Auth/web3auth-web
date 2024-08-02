require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: ["@toruslabs/vue"],
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: 2022,
    sourceType: "module",
    project: "./tsconfig.json",
  },
  ignorePatterns: ["*.cjs", "*.config.js", "vite.config.ts", "importLocales.js", "__generated__", ".eslintrc.js", "crisp.js"],
  rules: {
    "no-console": 0,
    "vuejs-accessibility/form-control-has-label": 0,
    "@typescript-eslint/no-explicit-any": 1,
    "import/order": 0,
    "class-methods-use-this": 0,
    camelcase: 0,
    "vue/multi-word-component-names": 0,
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "typeLike",
        format: ["camelCase", "UPPER_CASE", "PascalCase"],
      },
    ],
    "mocha/no-global-tests": ["off"],
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
    "no-underscore-dangle": 0,
    "no-restricted-exports": 0,
    "no-param-reassign": [2, { props: false }],
    "vue/v-on-event-hyphenation": 0,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: "./tsconfig.json",
      },
    },
  },
};
