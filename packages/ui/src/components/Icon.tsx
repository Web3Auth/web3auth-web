import CircleArrowLeft from "../../assets/icons/circle-arrow-left.svg";
import ArrowLeftNew from "../../assets/icons/arrow-left.svg";
import Close from "../../assets/icons/close.svg";
import Expand from "../../assets/icons/expand.svg";
import ExpandLight from "../../assets/icons/expand-light.svg";

interface IconProps {
  iconName: string;
  width?: string;
  height?: string;
  cls?: string;
}

const icons: Record<string, { image: string }> = {
  "arrow-left": {
    image: CircleArrowLeft,
  },
  "arrow-left-new": {
    image: ArrowLeftNew,
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
  const { iconName, height = "auto", width = "auto", cls } = props;
  return icons[iconName] ? <img className={cls} height={height} width={width} src={icons[iconName].image} alt={iconName} /> : null;
}
