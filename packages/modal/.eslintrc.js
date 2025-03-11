require("@rushstack/eslint-patch/modern-module-resolution");

// TODO: check if this is correct to use aliases.
module.exports = {
  root: true,
  extends: ["../../.eslintrc.js"],
  ignorePatterns: ["*.config.ts"],
  settings: {
    "import/resolver": {
      typescript: {
        project: "./tsconfig.json",
      },
    },
  },
};
