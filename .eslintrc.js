require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: ["@toruslabs/vue"],
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    sourceType: "module",
    ecmaVersion: 2022,
    project: "./tsconfig.json",
  },
  ignorePatterns: ["*.config.js", "*.d.ts", ".eslintrc.js"],
  env: {
    es2020: true,
    browser: true,
    node: true,
    mocha: true,
  },
  rules: {
    camelcase: 0,
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
  }
};
