/* eslint-disable import/no-extraneous-dependencies */
import json from "@rollup/plugin-json";
import url from "@rollup/plugin-url";
import svgr from "@svgr/rollup";
import path from "path";
import postcss from "rollup-plugin-postcss";
// TODO: use ssr module for cjs build

export const baseConfig = {
  input: ["./src/index.ts", "./src/react/index.ts", "./src/vue/index.ts", "./src/react/wagmi/index.ts"],
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
