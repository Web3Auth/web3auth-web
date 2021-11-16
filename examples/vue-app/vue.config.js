/* eslint-disable no-param-reassign */

module.exports = {
  lintOnSave: false,
  devServer: {
    port: 8080, // CHANGE YOUR PORT HERE!
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  css: {
    extract: false,
  },

  configureWebpack: (config) => {
    if (process.env.NODE_ENV !== "production") {
      config.devtool = "source-map";
    }
  },
  chainWebpack: (config) => {
    if (process.env.NODE_ENV !== "production") {
      config.module.rule("sourcemap").test(/\.js$/).enforce("pre").use("source-map-loader").loader("source-map-loader").end();
    }
  },
  crossorigin: "anonymous",
  productionSourceMap: true,
};
