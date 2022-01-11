/* eslint-disable no-param-reassign */

module.exports = {
  lintOnSave: false,
  devServer: {
    port: 3000, // CHANGE YOUR PORT HERE!
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
    const svgRule = config.module.rule('svg');

    svgRule.uses.clear();

    svgRule
      .use('vue-loader')
      .loader('vue-loader') // or `vue-loader-v16` if you are using a preview support of Vue 3 in Vue CLI
      .end()
      .use('vue-svg-loader')
      .loader('vue-svg-loader');
  },
  crossorigin: "anonymous",
  productionSourceMap: true,
};
