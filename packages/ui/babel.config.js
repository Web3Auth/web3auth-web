module.exports = {
  presets: ["@babel/env", "@babel/typescript"],
  plugins: [
    "@babel/plugin-syntax-bigint",
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-proposal-class-properties",
    "@babel/transform-runtime",
  ],
  sourceType: "unambiguous",
};
