import postcss from "rollup-plugin-postcss";
import svg from "rollup-plugin-svg";

export default {
  plugins: [
    postcss({
      plugins: [],
    }),
    svg(),
  ],
};
