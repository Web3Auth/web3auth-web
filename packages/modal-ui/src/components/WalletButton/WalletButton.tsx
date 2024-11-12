import { ExternalButton } from "../../interfaces";
import { Image } from "../Image";

type os = "iOS" | "Android";
type platform = "mobile" | "desktop" | "tablet";
type browser = "chrome" | "firefox" | "edge" | "brave" | "safari";

export interface WalletButtonProps {
  label: string;
  onClick?: () => void
  button?: ExternalButton;
  deviceDetails?: { platform: platform; os: os; browser: browser };
  walletConnectUri: string | undefined;
};

function formatIOSMobile(params: { uri: string; link?: string }) {
  const encodedUri: string = encodeURIComponent(params.uri);
  if (params.link.startsWith("http")) return `${params.link}/wc?uri=${encodedUri}`;
  if (params.link) return `${params.link}wc?uri=${encodedUri}`;
  return "";
}

const WalletButton = (props: WalletButtonProps) => {
  const isLink = props.deviceDetails.platform !== "desktop" && props.button.href && props.button.hasWalletConnect && !props.button.hasInjectedWallet
  const href = props.button.href ? formatIOSMobile({ uri: props.walletConnectUri, link: props.button.href }) : props.walletConnectUri;


  const handleBtnClick = () => {
    if (href && isLink) {
      window.open(href, '_blank');
    } else if (props.onClick) {
      props.onClick();
    }
  };

  return (
    <button class="w3a--w-full w3a--flex w3a--items-center w3a--justify-between w3a--p-4 w3a--rounded-xl w3a--bg-app-gray-100 hover:w3a--shadow-md hover:w3a--translate-y-[0.5px] w3a--border w3a--border-app-gray-100 hover:w3a--border-app-gray-200" onClick={handleBtnClick} {...props}>
      <div class="w3a--flex w3a--items-center w3a--gap-x-2">
        <figure class="w3a--w-5 w3a--h-5 w3a--rounded-full w3a--bg-app-gray-300">
          <Image
            imageId={`login-${props.button.name}`}
            hoverImageId={`login-${props.button.name}`}
            fallbackImageId="wallet"
            height="24"
            width="24"
            isButton
            extension={props.button.imgExtension}
          />
        </figure>
        <p class="w3a--text-sm w3a--font-medium w3a--text-app-gray-900">{props.label}</p>
      </div>
      {props.button.hasInjectedWallet && (
        <span class="w3a--inline-flex w3a--items-center w3a--rounded-lg w3a--px-2 w3a--py-1 w3a--text-xs w3a--font-medium w3a--bg-app-primary-100 w3a--text-app-primary-800">
          Installed
        </span>
      )}
    </button>
  )
}

export default WalletButton