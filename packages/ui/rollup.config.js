import svgr from "@svgr/rollup";
import path from "path";
import json from "rollup-plugin-json";
import postcss from "rollup-plugin-postcss";
import url from "rollup-plugin-url";

const config = {
  output: [{ dir: path.resolve("./dist/"), format: "es", sourcemap: true }],
  plugins: [
    postcss({
      plugins: [],
    }),
    url(),
    svgr(),
    json(),
  ],
};

export default config;
