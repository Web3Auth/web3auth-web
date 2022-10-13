import svgr from "@svgr/rollup";
import json from "rollup-plugin-json";
import postcss from "rollup-plugin-postcss";
import url from "rollup-plugin-url";

const config = {
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
