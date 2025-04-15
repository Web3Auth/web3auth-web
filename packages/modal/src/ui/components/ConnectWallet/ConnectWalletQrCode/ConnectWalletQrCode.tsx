import Bowser from "bowser";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { QRCode } from "react-qrcode-logo";

import { WALLET_CONNECT_LOGO } from "../../../constants";
import i18n from "../../../localeImport";
import Image from "../../Image";
import { ConnectWalletQrCodeProps } from "./ConnectWalletQrCode.type";

function ConnectWalletQrCode(props: ConnectWalletQrCodeProps) {
  const [t] = useTranslation(undefined, { i18n });
  const { walletConnectUri, isDark, selectedButton, setBodyState, bodyState, logoImage, primaryColor } = props;

  const isDesktop = useMemo<boolean>(() => {
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
      {walletConnectUri ? (
        <div className="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4 w3a--rounded-2xl w3a--border w3a--border-app-gray-200 w3a--p-4 dark:w3a--border-app-gray-700">
          <div className="w3a--relative w3a--flex w3a--size-[300px] w3a--items-center w3a--justify-center w3a--rounded-2xl">
            <QRCode
              size={isDesktop ? 300 : 260}
              eyeRadius={5}
              qrStyle="dots"
              removeQrCodeBehindLogo
              logoImage={logoImage || WALLET_CONNECT_LOGO}
              value={walletConnectUri}
              logoHeight={32}
              logoWidth={32}
              logoPadding={10}
              eyeColor={isDark ? whiteColor : qrColor}
              bgColor={isDark ? modalColor : whiteColor}
              fgColor={isDark ? whiteColor : blackColor}
            />
          </div>
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
              showWalletDetails: true,
              walletDetails: selectedButton,
            });
          }}
        >
          {t("modal.external.get-wallet")}
        </button>
      </div>
    </div>
  );
}

export default ConnectWalletQrCode;
