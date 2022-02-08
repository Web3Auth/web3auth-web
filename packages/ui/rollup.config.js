import jsx from "acorn-jsx";
import postcss from "rollup-plugin-postcss";
import svg from "rollup-plugin-svg";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
export default {
  input: path.resolve(__dirname, "src/index.tsx"),
  acornInjectPlugins: [jsx()],

  plugins: [
    postcss({
      plugins: [],
    }),
    svg({
      // base64: true,
    }),
  ],
};
