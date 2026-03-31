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
    <div className="w3a--contents">
      {qrCodeValue ? (
        <div className="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4 w3a--rounded-2xl w3a--border w3a--border-app-gray-200 w3a--p-4 dark:w3a--border-app-gray-700">
          <button
            type="button"
            className="w3a--relative w3a--flex w3a--size-[300px] w3a--appearance-none w3a--items-center w3a--justify-center w3a--rounded-2xl"
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
          <p className="w3a--text-center w3a--text-sm w3a--font-normal w3a--text-app-gray-500 dark:w3a--text-app-gray-300">
            {t("modal.external.walletconnect-copy")}
          </p>
        </div>
      ) : (
        <div className="w3a--mx-auto w3a--flex w3a--size-[300px] w3a--animate-pulse w3a--items-center w3a--justify-center w3a--rounded-lg w3a--bg-app-gray-200 w3a--p-2 dark:w3a--bg-app-gray-700">
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
          className="w3a--flex w3a--w-full w3a--items-center w3a--justify-between w3a--rounded-2xl w3a--bg-app-gray-50 
      w3a--px-4 w3a--py-2 w3a--text-app-gray-900 dark:w3a--bg-app-gray-800 dark:w3a--text-app-white"
        >
          <p className="w3a--text-sm w3a--text-app-gray-900 dark:w3a--text-app-white">
            {t("modal.external.dont-have")} <span>{selectedButton?.displayName}</span>?
          </p>
          <button
            type="button"
            className="w3a--appearance-none w3a--rounded-full w3a--border w3a--border-app-gray-200 w3a--bg-transparent w3a--px-5 w3a--py-2 w3a--text-base w3a--font-normal w3a--text-app-gray-700 w3a--transition-all w3a--duration-150 hover:w3a--border-transparent hover:w3a--shadow-light active:w3a--scale-95 dark:w3a--border-app-gray-700 dark:w3a--text-app-gray-300 dark:hover:w3a--border-transparent dark:hover:w3a--shadow-dark"
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
