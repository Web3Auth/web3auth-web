function importAll(r) {
  const images = {};
  r.keys().map((item) => {
    images[item.replace("./", "")] = r(item);
    return true;
  });
  return images;
}

const images = importAll(require.context("./images", false, /\.(png|jpe?g|svg)$/));
const icons = importAll(require.context("./icons", false, /\.(png|jpe?g|svg)$/));

export { icons, images };
