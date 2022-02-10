import React from "react";

import CircleArrowLeft from "../../assets/icons/circle-arrow-left.svg";
import Close from "../../assets/icons/close.svg";
import Expand from "../../assets/icons/expand.svg";
import ExpandLight from "../../assets/icons/expand-light.svg";

interface IconProps {
  iconName: string;
}

const icons = {
  "arrow-left": {
    image: CircleArrowLeft,
  },
  close: {
    image: Close,
  },
  "expand-light": {
    image: ExpandLight,
  },
  expand: {
    image: Expand,
  },
};

export default function Icon(props: IconProps) {
  const { iconName } = props;
  return icons[iconName] ? <img src={icons[iconName].image} /> : <></>;
}
