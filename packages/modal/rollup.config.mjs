/* eslint-disable import/no-extraneous-dependencies */
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import url from "@rollup/plugin-url";
import svgr from "@svgr/rollup";
import { readJSONFile } from "@toruslabs/torus-scripts/helpers/utils.js";
import path from "path";
import postcss from "rollup-plugin-postcss";
import preserveDirectives from 'rollup-preserve-directives'

const pkg = await readJSONFile(path.resolve("./package.json"));
const allDeps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {}), "wagmi", "@wagmi/vue", "@wagmi/core"];

// TODO: use ssr module for cjs build

export const baseConfig = {
  input: [
    "./src/index.ts",
    "./src/react/index.ts",
    "./src/vue/index.ts",
    "./src/react/wagmi/index.ts",
    "./src/react/solana/index.ts",
    "./src/vue/solana/index.ts",
    "./src/vue/wagmi/index.ts",

    // re-exports from no-modal sdk.
    "./src/connectors/coinbase-connector/index.ts",
    "./src/providers/xrpl-provider/index.ts",
    "./src/providers/ethereum-mpc-provider/index.ts",
  ],
  plugins: [
    replace({
      "process.env.WEB3AUTH_VERSION": `"${pkg.version}"`,
      preventAssignment: true,
    }),
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
    preserveDirectives(),
  ],
  external: [...allDeps, ...allDeps.map((x) => new RegExp(`^${x}/`)), /@babel\/runtime/],
};
