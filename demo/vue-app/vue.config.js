/* eslint-disable no-param-reassign */
const path = require("path");
const { ProvidePlugin } = require("webpack");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
module.exports = {
  devServer: {
    port: 3000, // CHANGE YOUR PORT HERE!
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },

  configureWebpack: (config) => {
    config.devtool = "source-map";
    config.resolve.symlinks = false;
    config.resolve.fallback = {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      assert: require.resolve("assert"),
      os: require.resolve("os-browserify/browser"),
      https: require.resolve("https-browserify"),
      http: require.resolve("stream-http"),
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      "bn.js": path.resolve(__dirname, "node_modules/bn.js"),
      lodash: path.resolve(__dirname, "node_modules/lodash"),
    };
    config.plugins.push(new ProvidePlugin({ Buffer: ["buffer", "Buffer"] }));
    config.plugins.push(new ProvidePlugin({ process: ["process/browser"] }));
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: "disabled",
      })
    );
  },
  crossorigin: "anonymous",
  productionSourceMap: true,
};
