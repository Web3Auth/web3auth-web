import Bowser from "bowser";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { QRCode } from "react-qrcode-logo";

import Image from "../../../components/Image";
import { WALLET_CONNECT_LOGO } from "../../../constants";
import { useBodyState, useToast } from "../../../context/RootContext";
import { TOAST_TYPE } from "../../../interfaces";
import i18n from "../../../localeImport";
import { ConnectWalletQrCodeProps } from "./ConnectWalletQrCode.type";

function ConnectWalletQrCode(props: ConnectWalletQrCodeProps) {
  const [t] = useTranslation(undefined, { i18n });
  const { bodyState, setBodyState } = useBodyState();
  const { setToast } = useToast();
  const { qrCodeValue, isDark, selectedButton, logoImage, primaryColor, platform } = props;

  const showGetWalletComponent = useMemo(() => {
    const app = selectedButton?.walletRegistryItem?.app || {};
    const desktopKeys = ["browser", "chrome", "firefox", "edge"] as const;
    const mobileKeys = ["ios", "android"] as const;
    const targetKeys = platform === "desktop" ? desktopKeys : mobileKeys;
    return targetKeys.some((key) => Boolean(app[key]));
  }, [platform, selectedButton?.walletRegistryItem?.app]);

  const isDesktop = useMemo<boolean>(() => {
    if (typeof window === "undefined") return false;
    const browser = Bowser.getParser(window.navigator.userAgent);
    return browser.getPlatformType() === "desktop";
  }, []);

  const root = document.documentElement;
  const whiteColor = "#FFFFFF";
  const blackColor = "#000000";
  const modalColor = getComputedStyle(root)?.getPropertyValue("--app-gray-800")?.trim() || "#1f2a37";
  const qrColor = primaryColor && primaryColor.toLowerCase() === "#ffffff" ? "#000000" : primaryColor;

  return (
    <div className="wta:contents">
      {qrCodeValue ? (
        <div className="wta:flex wta:flex-col wta:items-center wta:justify-center wta:gap-y-4 wta:rounded-2xl wta:border wta:border-app-gray-200 wta:p-4 wta:dark:border-app-gray-700">
          <button
            type="button"
            className="wta:relative wta:flex wta:size-[300px] wta:appearance-none wta:items-center wta:justify-center wta:rounded-2xl"
            onClick={() => {
              navigator.clipboard.writeText(qrCodeValue);
              setToast({
                message: t("modal.external.qr-code-copied-to-clipboard"),
                type: TOAST_TYPE.SUCCESS,
              });
            }}
          >
            <QRCode
              size={isDesktop ? 300 : 260}
              eyeRadius={5}
              qrStyle="dots"
              removeQrCodeBehindLogo
              logoImage={logoImage || WALLET_CONNECT_LOGO}
              value={qrCodeValue}
              logoHeight={32}
              logoWidth={32}
              logoPadding={10}
              eyeColor={isDark ? whiteColor : qrColor}
              bgColor={isDark ? modalColor : whiteColor}
              fgColor={isDark ? whiteColor : blackColor}
            />
          </button>
          <p className="wta:text-center wta:text-sm wta:font-normal wta:text-app-gray-500 wta:dark:text-app-gray-300">
            {t("modal.external.walletconnect-copy")}
          </p>
        </div>
      ) : (
        <div className="wta:mx-auto wta:flex wta:size-[300px] wta:animate-pulse wta:items-center wta:justify-center wta:rounded-lg wta:bg-app-gray-200 wta:p-2 wta:dark:bg-app-gray-700">
          <Image
            imageId={`login-${selectedButton.name}`}
            hoverImageId={`login-${selectedButton.name}`}
            fallbackImageId="wallet"
            height="30"
            width="30"
            isButton
            extension={selectedButton.imgExtension}
          />
        </div>
      )}

      {showGetWalletComponent && (
        <div
          className="wta:flex wta:w-full wta:items-center wta:justify-between wta:rounded-2xl wta:bg-app-gray-50 
      wta:px-4 wta:py-2 wta:text-app-gray-900 wta:dark:bg-app-gray-800 wta:dark:text-app-white"
        >
          <p className="wta:text-sm wta:text-app-gray-900 wta:dark:text-app-white">
            {t("modal.external.dont-have")} <span>{selectedButton?.displayName}</span>?
          </p>
          <button
            type="button"
            className="wta:appearance-none wta:rounded-full wta:border wta:border-app-gray-200 wta:bg-transparent wta:px-5 wta:py-2 wta:text-base wta:font-normal wta:text-app-gray-700 wta:transition-all wta:duration-150 wta:hover:border-transparent wta:hover:shadow-light wta:active:scale-95 wta:dark:border-app-gray-700 wta:dark:text-app-gray-300 wta:dark:hover:border-transparent wta:dark:hover:shadow-dark"
            onClick={() => {
              setBodyState({
                ...bodyState,
                installLinks: {
                  show: true,
                  wallet: selectedButton,
                },
              });
            }}
          >
            {t("modal.external.get-wallet")}
          </button>
        </div>
      )}
    </div>
  );
}

export default ConnectWalletQrCode;
