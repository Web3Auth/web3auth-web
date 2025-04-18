const path = require("path");
const { EnvironmentPlugin } = require("webpack");
const generateWebpackConfig = require("../../webpack.config");

const pkg = require("./package.json");

const currentPath = path.resolve(".");

const ssrModule = {
  rules: [
    {
      test: /\.css$/,
      use: [
        "@toruslabs/isomorphic-style-loader",
        {
          loader: "css-loader",
        },
        {
          loader: "postcss-loader",
          options: {
            postcssOptions: {
              plugins: {
                tailwindcss: {},
                autoprefixer: {},
              },
            },
          },
        },
      ],
    },
    {
      test: /\.svg$/,
      exclude: /node_modules/,
      use: ["@svgr/webpack", "url-loader"],
    },
  ],
};

const config = generateWebpackConfig({
  currentPath,
  pkg,
  alias: {},
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          { loader: "style-loader", options: {} },
          { loader: "css-loader", options: {} },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: {
                  tailwindcss: {},
                  autoprefixer: {},
                },
              },
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        exclude: /node_modules/,
        use: ["@svgr/webpack", "url-loader"],
      },
    ],
  },
  plugins: [new EnvironmentPlugin({ WEB3AUTH_VERSION: pkg.version })],
  ssrModule,
});

module.exports = config;
