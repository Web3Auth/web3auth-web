interface IconProps {
  iconName: string;
  iconTitle?: string;
  width?: string;
  height?: string;
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
};

export default function Icon(props: IconProps) {
  const { iconName, iconTitle = "", height = "auto", width = "auto" } = props;
  return icons[iconName] ? (
    <img className={iconTitle ? "cursor-pointer" : ""} height={height} width={width} src={icons[iconName].image} alt={iconName} title={iconTitle} />
  ) : null;
}
