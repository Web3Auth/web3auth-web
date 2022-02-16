import svgr from "@svgr/rollup";
import postcss from "rollup-plugin-postcss";
import url from "rollup-plugin-url";

export default {
  plugins: [
    postcss({
      plugins: [],
    }),
    url(),
    svgr(),
  ],
};
