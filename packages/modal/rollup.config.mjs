/* eslint-disable import/no-extraneous-dependencies */
import json from "@rollup/plugin-json";
import url from "@rollup/plugin-url";
import svgr from "@svgr/rollup";
import path from "path";
import fs from "fs";
import postcss from "rollup-plugin-postcss";

export const readJSONFile = (fullPathUrl) => {
  if (!fs.existsSync(fullPathUrl)) return {};
  return JSON.parse(fs.readFileSync(fullPathUrl instanceof URL ? fullPathUrl.pathname : new URL(fullPathUrl, import.meta.url).pathname));
};

const pkg = readJSONFile(path.resolve("./package.json"));

const allDeps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {}), "vue"];

export const baseConfig = {
  input: [
    "./src/index.ts",
    "./src/react/index.ts",
    "./src/vue/index.ts",
  ],
  external: [...allDeps, ...allDeps.map((x) => new RegExp(`^${x}/`)), /@babel\/runtime/],
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