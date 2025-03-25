import Bowser from "bowser";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { QRCode } from "react-qrcode-logo";

import { WALLET_CONNECT_LOGO } from "../../../interfaces";
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
  const qrColor = primaryColor.toLowerCase() === "#ffffff" ? "#000000" : primaryColor;

  return (
    <div className="w3a--contents">
      {walletConnectUri ? (
        <div className="w3a--flex w3a--flex-col w3a--gap-y-4 w3a--items-center w3a--justify-center w3a--border w3a--border-app-gray-200 dark:w3a--border-app-gray-700 w3a--rounded-2xl w3a--p-4">
          <div className="w3a--relative w3a--rounded-2xl w3a--h-[300px] w3a--w-[300px] w3a--flex w3a--items-center w3a--justify-center">
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
            <div className="w3a--absolute w3a--top-[43%] w3a--left-[43%] w3a--transform -translate-y-1/2 w3a--w-10 w3a--h-10 w3a--bg-app-white w3a--rounded-full w3a--flex w3a--items-center w3a--justify-center">
              <Image
                imageId={`login-${selectedButton.name}`}
                hoverImageId={`login-${selectedButton.name}`}
                fallbackImageId="wallet"
                height="20"
                width="20"
                isButton
                extension={selectedButton.imgExtension}
              />
            </div>
          </div>
          <p className="w3a--text-center w3a--text-sm w3a--text-app-gray-500 dark:w3a--text-app-gray-300 w3a--font-normal">
            {t("modal.external.walletconnect-copy")}
          </p>
        </div>
      ) : (
        <div className="w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700 w3a--animate-pulse w3a--rounded-lg w3a--h-[300px] w3a--w-[300px] w3a--mx-auto w3a--p-2 w3a--flex w3a--items-center w3a--justify-center">
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
        className="w3a--flex w3a--items-center w3a--justify-between w3a--w-full w3a--text-app-gray-900 w3a--bg-app-gray-50 
      dark:w3a--bg-app-gray-800 dark:w3a--text-app-white w3a--rounded-2xl w3a--px-4 w3a--py-2"
      >
        <p className="w3a--text-sm w3a--text-app-gray-900 dark:w3a--text-app-white">
          {t("modal.external.dont-have")} <span>{selectedButton?.displayName}</span>?
        </p>
        <button
          type="button"
          className="w3a--appearance-none w3a--border w3a--border-app-gray-400 w3a--text-sm w3a--font-medium w3a--text-app-gray-400 hover:w3a--bg-app-white dark:hover:w3a--bg-app-gray-700 dark:w3a--text-app-gray-300 dark:w3a--border-app-gray-300 w3a--rounded-full w3a--px-3 w3a--py-2 hover:w3a--shadow-2xl"
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
