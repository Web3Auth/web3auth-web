import CircleArrowLeft from "../../assets/icons/circle-arrow-left.svg";
import Close from "../../assets/icons/close.svg";
import Connected from "../../assets/icons/connected.svg";
import Expand from "../../assets/icons/expand.svg";
import ExpandLight from "../../assets/icons/expand-light.svg";
import InfoCircle from "../../assets/icons/information-circle.svg";
import InfoCircleLight from "../../assets/icons/information-circle-light.svg";

interface IconProps {
  iconName: string;
  iconTitle?: string;
  width?: string;
  height?: string;
}

const icons: Record<string, { image: string }> = {
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
  connected: {
    image: Connected,
  },
  "information-circle-light": {
    image: InfoCircleLight,
  },
  "information-circle": {
    image: InfoCircle,
  },
};

export default function Icon(props: IconProps) {
  const { iconName, iconTitle = "", height = "auto", width = "auto" } = props;
  return icons[iconName] ? (
    <img className={iconTitle ? "cursor-pointer" : ""} height={height} width={width} src={icons[iconName].image} alt={iconName} title={iconTitle} />
  ) : null;
}
