import cn from "classnames";
import { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ThemedContext } from "../../../context/ThemeContext";
import i18n from "../../../localeImport";
import { formatIOSMobile, getIcons } from "../../../utils";
import Image from "../../Image";
import { ButtonWalletProps } from "./ButtonWallet.type";

function ButtonWallet(props: ButtonWalletProps) {
  const [t] = useTranslation(undefined, { i18n });
  const { deviceDetails, button, walletConnectUri, onClick, label, buttonRadius } = props;

  const isDark = useContext(ThemedContext);

  const isLink = useMemo(
    () => deviceDetails.platform !== "desktop" && button.href && button.hasWalletConnect && !button.isInstalled,
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
      className={cn(
        `w3a--group w3a--relative w3a--overflow-hidden w3a--flex w3a--w-full w3a--items-center w3a--justify-between w3a--bg-app-gray-50 w3a--p-3 hover:w3a--bg-app-gray-200 
        hover:w3a--text-app-gray-900 dark:w3a--bg-app-gray-800 dark:hover:w3a--bg-app-gray-600 active:w3a--scale-95 w3a--transition-all w3a--duration-150`,
        {
          "w3a--rounded-full": buttonRadius === "pill",
          "w3a--rounded-lg": buttonRadius === "rounded",
          "w3a--rounded-none": buttonRadius === "square",
        }
      )}
      onClick={handleBtnClick}
    >
      <div className="w3a--flex w3a--items-center w3a--gap-x-2">
        <figure className="w3a--size-5">
          <Image
            imageData={button.icon}
            imageId={`login-${button.name}`}
            hoverImageId={`login-${button.name}`}
            fallbackImageId="wallet"
            height="24"
            width="24"
            isButton
            extension={button.imgExtension || "webp"}
          />
        </figure>
        <p className="w3a--max-w-[180px] w3a--truncate w3a--text-base w3a--font-normal w3a--text-app-gray-700 dark:w3a--text-app-white">{label}</p>
      </div>
      {button.hasInjectedWallet && (
        <span
          className="w3a--absolute w3a--right-4 w3a--top-1/2 w3a--flex w3a--w-auto -w3a--translate-y-1/2 w3a--items-center w3a--rounded-md w3a--bg-app-primary-100 w3a--px-2 w3a--py-1 w3a--text-xs w3a--font-medium w3a--text-app-primary-800 w3a--transition-all w3a--duration-300 group-hover:w3a--translate-x-6 group-hover:w3a--opacity-0 
        dark:w3a--border dark:w3a--border-app-primary-400 dark:w3a--bg-transparent dark:w3a--text-app-primary-400"
        >
          {t("modal.external.installed")}
        </span>
      )}
      <img
        id="injected-wallet-arrow"
        className="w3a--absolute w3a--right-4 w3a--top-1/2 -w3a--translate-x-10 -w3a--translate-y-1/2 w3a--opacity-0 w3a--transition-all w3a--duration-300
          group-hover:w3a--translate-x-0 group-hover:w3a--opacity-100"
        src={getIcons(isDark ? "chevron-right-light" : "chevron-right-dark")}
        alt="arrow"
      />
    </button>
  );
}

export default ButtonWallet;
