const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

function generateWebpackConfig({ alias, module = {}, pkgBaseConfig = {}, plugins = [] }) {
  const baseConfig = {
    ...pkgBaseConfig,
    resolve: {
      plugins: [new TsconfigPathsPlugin()],
      alias: {
        "bn.js": require.resolve("bn.js"),
        tweetnacl: require.resolve("@toruslabs/tweetnacl-js"),
        ...alias,
      },
    },
  };

  const config = { baseConfig };
  config.umdConfig = {
    module,
    plugins,
  };

  return config;
}

module.exports = generateWebpackConfig;
