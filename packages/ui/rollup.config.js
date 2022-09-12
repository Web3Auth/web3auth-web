import svgr from "@svgr/rollup";
import postcss from "rollup-plugin-postcss";
import url from "rollup-plugin-url";

const config = {
  plugins: [
    postcss({
      plugins: [],
    }),
    url(),
    svgr(),
  ],
};

export default config;
