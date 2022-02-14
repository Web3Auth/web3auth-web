import svgr from "@svgr/rollup";
import jsx from "acorn-jsx";
import postcss from "rollup-plugin-postcss";
import url from "rollup-plugin-url";

// eslint-disable-next-line @typescript-eslint/no-var-requires
export default {
  acornInjectPlugins: [jsx()],

  plugins: [
    postcss({
      plugins: [],
    }),
    url(),
    svgr(),
  ],
};
