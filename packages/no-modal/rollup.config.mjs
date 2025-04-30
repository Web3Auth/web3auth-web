import path from "path";
import { readJSONFile } from "@toruslabs/torus-scripts/helpers/utils.js";

const pkg = readJSONFile(path.resolve("./package.json"));

const allDeps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {}), "wagmi", "@wagmi/vue", "@wagmi/core"];

export const baseConfig = {
  input: [
    "./src/index.ts",
    "./src/react/index.ts",
    "./src/vue/index.ts",
    "./src/react/wagmi/index.ts",
    "./src/react/solana/index.ts",
    "./src/vue/solana/index.ts",
    "./src/vue/wagmi/index.ts",
    "./src/connectors/coinbase-connector/index.ts",
    "./src/providers/xrpl-provider/index.ts",
    "./src/providers/ethereum-mpc-provider/index.ts",
  ],
  external: [...allDeps, ...allDeps.map((x) => new RegExp(`^${x}/`)), /@babel\/runtime/],
};
