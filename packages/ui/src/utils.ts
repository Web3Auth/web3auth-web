import LoginLightAppleSvg from "../assets/images/login-apple-light.svg";
function importAll(r) {
  const images = {};
  r.keys().map((item) => {
    images[item.replace("./", "")] = r(item);
    return true;
  });
  return images;
}

const images = importAll(require.context("../assets/images", false, /\.(png|jpe?g|svg)$/));
const icons = importAll(require.context("../assets/icons", false, /\.(png|jpe?g|svg)$/));

export { icons, images };
export default {
  "login-apple-light": {
    image: LoginLightAppleSvg,
  },
};
