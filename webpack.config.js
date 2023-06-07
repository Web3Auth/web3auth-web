/* eslint-disable @typescript-eslint/no-var-requires */

const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
function generateWebpackConfig({ alias, module = {}, ssrModule = null, pkgBaseConfig = {} }) {
  const baseConfig = {
    ...pkgBaseConfig,
    resolve: {
      plugins: [new TsconfigPathsPlugin()],
      alias: {
        "bn.js": require.resolve("bn.js"),
        lodash: require.resolve("lodash-es"),
        ...alias,
      },
    },
  };

  const config = { baseConfig };
  config.umdConfig = {
    module,
  };

  config.cjsConfig = {
    module: ssrModule || module,
  };

  return config;
}

module.exports = generateWebpackConfig;
