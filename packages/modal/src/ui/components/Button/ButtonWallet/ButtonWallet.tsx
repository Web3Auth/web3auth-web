import cn from "classnames";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import i18n from "../../../localeImport";
import { formatIOSMobile, getIcons } from "../../../utils";
import Image from "../../Image";
import { ButtonWalletProps } from "./ButtonWallet.type";

function ButtonWallet(props: ButtonWalletProps) {
  const [t] = useTranslation(undefined, { i18n });
  const { isDark, deviceDetails, button, walletConnectUri, onClick, label, buttonRadius } = props;

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
        `wta:group wta:relative wta:overflow-hidden wta:flex wta:w-full wta:items-center wta:justify-between wta:bg-app-gray-50 wta:p-3 wta:hover:bg-app-gray-200 
        wta:hover:text-app-gray-900 wta:dark:bg-app-gray-800 wta:dark:hover:bg-app-gray-600 wta:active:scale-95 wta:transition-all wta:duration-150`,
        {
          "wta:rounded-full": buttonRadius === "pill",
          "wta:rounded-lg": buttonRadius === "rounded",
          "wta:rounded-none": buttonRadius === "square",
        }
      )}
      onClick={handleBtnClick}
    >
      <div className="wta:flex wta:items-center wta:gap-x-2">
        <figure className="wta:size-5">
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
        <p className="wta:max-w-[180px] wta:truncate wta:text-base wta:font-normal wta:text-app-gray-700 wta:dark:text-app-white">{label}</p>
      </div>
      {button.hasInjectedWallet && (
        <span
          className="wta:absolute wta:right-4 wta:top-1/2 wta:flex wta:w-auto wta:-translate-y-1/2 wta:items-center wta:rounded-md wta:bg-app-primary-100 wta:px-2 wta:py-1 wta:text-xs wta:font-medium wta:text-app-primary-800 wta:transition-all wta:duration-300 wta:group-hover:translate-x-6 wta:group-hover:opacity-0 
        wta:dark:border wta:dark:border-app-primary-400 wta:dark:bg-transparent wta:dark:text-app-primary-400"
        >
          {t("modal.external.installed")}
        </span>
      )}
      <img
        id="injected-wallet-arrow"
        className="wta:absolute wta:right-4 wta:top-1/2 wta:-translate-x-10 wta:-translate-y-1/2 wta:opacity-0 wta:transition-all wta:duration-300
          wta:group-hover:translate-x-0 wta:group-hover:opacity-100"
        src={getIcons(isDark ? "chevron-right-light" : "chevron-right-dark")}
        alt="arrow"
      />
    </button>
  );
}

export default ButtonWallet;
