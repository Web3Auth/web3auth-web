require("@rushstack/eslint-patch/modern-module-resolution");

// TODO: check if this is correct to use aliases.
module.exports = {
  root: true,
  extends: ["../../.eslintrc.js"],
  settings: {
    "import/resolver": {
      typescript: {},
    },
  },
};

