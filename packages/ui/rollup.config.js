import svgr from "@svgr/rollup";
import jsx from "acorn-jsx";
import postcss from "rollup-plugin-postcss";
import url from "rollup-plugin-url";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
export default {
  input: path.resolve(__dirname, "src/index.ts"),
  acornInjectPlugins: [jsx()],

  plugins: [
    postcss({
      plugins: [],
    }),
    url(),
    svgr(),
  ],
};
