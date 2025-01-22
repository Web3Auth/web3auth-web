import fs from "fs";
import path from "path";

export const readJSONFile = (fullPathUrl) => {
  if (!fs.existsSync(fullPathUrl)) return {};
  return JSON.parse(fs.readFileSync(fullPathUrl instanceof URL ? fullPathUrl.pathname : new URL(fullPathUrl, import.meta.url).pathname));
};

const pkg = readJSONFile(path.resolve("./package.json"));

const allDeps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {}), "react", "vue"];

export const baseConfig = {
  input: [
    "./src/index.ts",
    "./src/react/index.ts",
    "./src/vue/index.ts",
  ],
  external: [...allDeps, ...allDeps.map((x) => new RegExp(`^${x}/`)), /@babel\/runtime/],
}
