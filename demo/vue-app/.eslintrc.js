require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: ["@toruslabs/vue"],
  parser: "vue-eslint-parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2022,
    project: "./tsconfig.json",
  },
  ignorePatterns: ["*.config.js", "*.d.ts", ".eslintrc.js", "*.config.ts"],
  env: {
    browser: true,
    node: true,
    mocha: true,
    serviceworker: true,
  },
  rules: {
    "import/no-unresolved": [
      "error",
      { ignore: ["@toruslabs/vue-components/*", "@web3auth/checkout/*", "@web3auth/portfolio/*", "@web3auth/walletconnect/*"] },
    ],
    "no-underscore-dangle": "off",
    "vue/multi-word-component-names": "off",
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
};
