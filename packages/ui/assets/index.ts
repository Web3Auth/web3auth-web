import CircleArrowLeft from "./icons/circle-arrow-left.svg";
import Close from "./icons/close.svg";
import Expand from "./icons/expand.svg";
import ExpandLight from "./icons/expand-light.svg";

const getImageSrc = (image: string): string => {
  return !image.startsWith("<svg") ? `<img src="${image}" alt="">` : image;
};
export default {
  "arrow-left": {
    image: getImageSrc(CircleArrowLeft),
  },
  close: {
    image: getImageSrc(Close),
  },
  "expand-light": {
    image: getImageSrc(ExpandLight),
  },
  expand: {
    image: getImageSrc(Expand),
  },
};
