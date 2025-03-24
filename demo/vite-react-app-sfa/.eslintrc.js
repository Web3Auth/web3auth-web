require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  extends: ["@toruslabs/react"],
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: 2022,
    sourceType: "module",
    project: "./tsconfig.json",
  },
  ignorePatterns: ["*.cjs", "*.config.js", "vite.config.mts", "importLocales.js", "__generated__", ".eslintrc.js"],
  rules: {
    "@typescript-eslint/no-explicit-any": 1,
    "import/order": 0,
    "class-methods-use-this": 0,
    camelcase: 0,
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "typeLike",
        format: ["camelCase", "UPPER_CASE", "PascalCase"],
      },
    ],
    "no-console": 2,
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
