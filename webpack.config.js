/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
function generateWebpackConfig({ pkg, currentPath, alias, module = {}, ssrModule = null, pkgBaseConfig = {} }) {
  const depsList = Object.keys(pkg.dependencies);
  const baseConfig = {
    ...pkgBaseConfig,
    resolve: {
      plugins: [new TsconfigPathsPlugin()],
      alias: {
        ...(depsList.includes("bn.js") && { "bn.js": path.resolve(currentPath, "node_modules/bn.js") }),
        lodash: path.resolve(__dirname, "node_modules/lodash-es"),
        ...alias,
      },
      fallback: {
        "bn.js": require.resolve("bn.js"),
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
