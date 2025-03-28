import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import i18n from "../../../localeImport";
import { formatIOSMobile } from "../../../utils";
import Image from "../../Image";
import { ButtonWalletProps } from "./ButtonWallet.type";

function ButtonWallet(props: ButtonWalletProps) {
  const [t] = useTranslation(undefined, { i18n });
  const { deviceDetails, button, walletConnectUri, onClick, label } = props;

  const isLink = useMemo(
    () => deviceDetails.platform !== "desktop" && button.href && button.hasWalletConnect && !button.hasInjectedWallet,
    [deviceDetails, button]
  );

  const href = useMemo(
    () => (button.href ? formatIOSMobile({ uri: walletConnectUri, link: button.href }) : walletConnectUri),
    [button, walletConnectUri]
  );

  const handleBtnClick = () => {
    if (href && isLink) {
      window.open(href, "_blank");
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button
      type="button"
      className="w3a--flex w3a--w-full w3a--items-center w3a--justify-between w3a--rounded-2xl w3a--bg-app-gray-50 w3a--p-3 
      hover:w3a--bg-app-gray-200 hover:w3a--text-app-gray-900 dark:w3a--bg-app-gray-800 dark:hover:w3a--bg-app-gray-600"
      onClick={handleBtnClick}
    >
      <div className="w3a--flex w3a--items-center w3a--gap-x-2">
        <figure className="w3a--size-5 w3a--rounded-full w3a--bg-app-gray-300">
          <Image
            imageId={`login-${button.name}`}
            hoverImageId={`login-${button.name}`}
            fallbackImageId="wallet"
            height="24"
            width="24"
            isButton
            extension={button.imgExtension}
          />
        </figure>
        <p className="w3a--text-base w3a--font-normal w3a--text-app-gray-700 dark:w3a--text-app-white">{label}</p>
      </div>
      {button.hasInjectedWallet && (
        <span
          className="w3a--inline-flex w3a--items-center w3a--rounded-md w3a--bg-app-primary-100 w3a--px-2 w3a--py-1 w3a--text-xs w3a--font-medium w3a--text-app-primary-800 
        dark:w3a--border dark:w3a--border-app-primary-400 dark:w3a--bg-transparent dark:w3a--text-app-primary-400"
        >
          {t("modal.external.installed")}
        </span>
      )}
    </button>
  );
}

export default ButtonWallet;
