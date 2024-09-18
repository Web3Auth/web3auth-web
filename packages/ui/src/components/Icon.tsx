import ArrowDark from "../assets/arrow-left-dark.svg";
import ArrowLight from "../assets/arrow-left-light.svg";
import XDark from "../assets/x-dark.svg";
import XLight from "../assets/x-light.svg";

interface IconProps {
  iconName: string;
  iconTitle?: string;
  width?: string;
  height?: string;
  darkIconName?: string;
}

const icons: Record<string, { image: string }> = {
  "arrow-left": {
    image: "https://images.web3auth.io/circle-arrow-left.svg",
  },
  close: {
    image: "https://images.web3auth.io/close.svg",
  },
  "expand-light": {
    image: "https://images.web3auth.io/expand-light.svg",
  },
  expand: {
    image: "https://images.web3auth.io/expand.svg",
  },
  connected: {
    image: "https://images.web3auth.io/connected.svg",
  },
  "information-circle-light": {
    image: "https://images.web3auth.io/information-circle-light.svg",
  },
  "information-circle": {
    image: "https://images.web3auth.io/information-circle.svg",
  },
  "arrow-left-light": {
    image: ArrowLight,
  },
  "x-light": {
    image: XLight,
  },
  "arrow-left-dark": {
    image: ArrowDark,
  },
  "x-dark": {
    image: XDark,
  },
};

export default function Icon(props: IconProps) {
  const { iconName, iconTitle = "", height = "auto", width = "auto", darkIconName = "" } = props;
  const h = height === "auto" ? "h-auto" : `h-[${height}px]`;
  const w = width === "auto" ? "w-auto" : `w-[${width}px]`;
  return (
    <>
      {icons[iconName] && (
        <img
          className={`${iconTitle ? "cursor-pointer" : ""} dark:hidden block ${h} ${w}`}
          height={height}
          width={width}
          src={icons[iconName].image}
          alt={iconName}
          title={iconTitle}
        />
      )}
      {icons[darkIconName] && (
        <img
          className={`${iconTitle ? "cursor-pointer" : ""} hidden dark:block ${h} ${w}`}
          height={height}
          width={width}
          src={icons[darkIconName].image}
          alt={darkIconName}
          title={iconTitle}
        />
      )}
    </>
  );
}
