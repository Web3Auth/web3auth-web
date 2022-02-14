/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const generateWebpackConfig = require("../../webpack.config");

const pkg = require("./package.json");

const currentPath = path.resolve(".");

const config = generateWebpackConfig({
  pkgBaseConfig: {
    mode: "development", // only for testing
    output: {
      libraryExport: "default",
    },
  },
  currentPath,
  pkg,
  alias: {},
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader" },
      {
        test: /\.css$/i,
        use: { loader: "style-loader", options: {} },
      },
      {
        test: /\.css$/i,
        use: { loader: "css-loader", options: {} },
      },
      {
        test: /\.svg$/,
        exclude: /node_modules/,
        use: ["@svgr/webpack", "url-loader"],
      },
    ],
  },
});

module.exports = config;
