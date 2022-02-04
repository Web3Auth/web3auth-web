/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const generateWebpackConfig = require("../../webpack.config");

const webpack = require("webpack");

// eslint-disable-next-line import/no-extraneous-dependencies
const torusConfig = require("@toruslabs/torus-scripts/config/torus.config");

const pkg = require("./package.json");

const currentPath = path.resolve(".");

const config = generateWebpackConfig({
  pkgBaseConfig: {
    output: {
      // libraryExport: "default",
    },
  },
  pkgUmdConfig: {
    output: {
      // libraryExport: "default",
      filename: `${torusConfig.name}.umd.min.js`,
      libraryTarget: "umd",
    },
    plugins: [
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
    ],
  },
  currentPath,
  pkg,
  alias: {},
  module: {
    rules: [
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
        use: [
          {
            loader: "svg-url-loader",
            options: {
              encoding: "none",
            },
          },
        ],
      },
    ],
  },
});

module.exports = config;
