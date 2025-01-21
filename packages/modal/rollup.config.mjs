/* eslint-disable import/no-extraneous-dependencies */
import json from "@rollup/plugin-json";
import url from "@rollup/plugin-url";
import svgr from "@svgr/rollup";
import path from "path";
import postcss from "rollup-plugin-postcss";
// import resolve from "@rollup/plugin-node-resolve";
// import tsconfigPaths from "rollup-plugin-tsconfig-paths";

// const appModuleFileExtensions = ["js", "ts", "json", "mjs", "jsx", "tsx"];

export const externalDeps = ["vue"]

export const baseConfig = {
  input: [
    "./src/index.ts",
    "./src/react/index.ts",
    "./src/vue/index.ts",
  ],
  plugins: [
    postcss({
      config: {
        path: path.resolve("./postcss.config.js"),
      },
      extensions: [".css"],
      minimize: true,
    }),
    url(),
    svgr(),
    json(),
  ],
};

// export const reactConfigOriginalEsm = {
//   taskName: 'react.esm',
//   input: "./src/react/index.ts",
//   output: {
//     preserveModules: true, dir: "./dist/lib.esm", format: "es", sourcemap: process.env.NODE_ENV === "development"
//   },
//   plugins: [
//     tsconfigPaths(),
//     // Allows node_modules resolution
//     resolve({
//       extensions: appModuleFileExtensions.map((x) => `.${x}`),
//       modulesOnly: true,
//       preferBuiltins: false,
//     }),
//   ]
// };

// export const reactConfigOriginalCjs = {
//   taskName: 'react.cjs',
//   input: "./src/react/index.ts",
//   output: {
//     preserveModules: true, dir: "./dist/lib.cjs", format: "cjs", sourcemap: process.env.NODE_ENV === "development"
//   },
//   plugins: [
//     tsconfigPaths(),
//     // Allows node_modules resolution
//     resolve({
//       extensions: appModuleFileExtensions.map((x) => `.${x}`),
//       modulesOnly: true,
//       preferBuiltins: false,
//     }),
//   ]
// };


// export const vueOriginalEsm = {
//   taskName: 'vue.esm',
//   input: "./src/vue/index.ts",
//   output: {
//     preserveModules: true, dir: "./dist/lib.esm", format: "es", sourcemap: process.env.NODE_ENV === "development"
//   },
//   plugins: [
//     tsconfigPaths(),
//     // Allows node_modules resolution
//     resolve({
//       extensions: appModuleFileExtensions.map((x) => `.${x}`),
//       modulesOnly: true,
//       preferBuiltins: false,
//     }),
//   ]
// };

// export const vueOriginalCjs = {
//   taskName: 'vue.cjs',
//   input: "./src/vue/index.ts",
//   output: {
//     preserveModules: true, dir: "./dist/lib.cjs", format: "cjs", sourcemap: process.env.NODE_ENV === "development"
//   },
//   plugins: [
//     tsconfigPaths(),
//     // Allows node_modules resolution
//     resolve({
//       extensions: appModuleFileExtensions.map((x) => `.${x}`),
//       modulesOnly: true,
//       preferBuiltins: false,
//     }),
//   ]
// };
