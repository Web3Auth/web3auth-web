require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: ["@toruslabs/eslint-config-typescript"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 11,
    project: "./tsconfig.json",
  },
  ignorePatterns: ["*.config.js", "*.d.ts", ".eslintrc.js"],
  env: {
    es2020: true,
    browser: true,
    node: true,
    mocha: true,
  },
};
