import Bowser from "bowser";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { QRCode } from "react-qrcode-logo";

import { WALLET_CONNECT_LOGO } from "../../../constants";
import i18n from "../../../localeImport";
import Image from "../../Image";
import { ConnectWalletQrCodeProps, SelectWalletChainNamespaceProps } from "./ConnectWalletQrCode.type";

const SelectWalletChainNamespace = (props: SelectWalletChainNamespaceProps) => {
  const { handleExternalWalletClick, selectedButton } = props;
  const [t] = useTranslation(undefined, { i18n });

  const chainNamespaces = selectedButton.chainNamespaces!.map((chainNamespace) => {
    const imageId = chainNamespace === "eip155" ? "evm" : chainNamespace;
    const displayName = chainNamespace === "eip155" ? "EVM" : chainNamespace;
    return {
      chainNamespace,
      displayName,
      imageId: `chain-${imageId}`,
    };
  });

  return (
    <div>
      {/* Wallet image */}
      <div className="w3a--my-6 w3a--flex w3a--justify-center">
        <Image
          imageId={`login-${selectedButton.name}`}
          hoverImageId={`login-${selectedButton.name}`}
          fallbackImageId="wallet"
          height="100"
          width="100"
          isButton
          extension={selectedButton.imgExtension}
        />
      </div>

      {/* Description */}
      <p className="w3a--my-6 w3a--text-center w3a--text-sm w3a--text-app-gray-500">
        {t("modal.external.select-chain-description", { wallet: selectedButton.displayName })}
      </p>

      {/* Chain namespace buttons */}
      <ul className="w3a--flex w3a--flex-col w3a--gap-3">
        {chainNamespaces.map(({ chainNamespace, displayName, imageId }) => (
          <li key={chainNamespace}>
            <button
              type="button"
              className="w3a--btn w3a--size-xl w3a--w-full w3a--items-center !w3a--justify-between w3a--rounded-full"
              onClick={() => handleExternalWalletClick({ connector: selectedButton.name, chainNamespace })}
            >
              <div className="w3a--flex w3a--items-center">
                <Image imageId={imageId} hoverImageId={imageId} fallbackImageId="wallet" height="24" width="24" isButton extension="svg" />
                <p className="w3a--ml-2 w3a--text-left w3a--text-sm first-letter:w3a--capitalize">{displayName}</p>
              </div>
              <span className="w3a--inline-flex w3a--items-center w3a--rounded-lg w3a--bg-app-primary-100 w3a--px-2 w3a--py-1 w3a--text-xs w3a--font-medium w3a--text-app-primary-800">
                {t("modal.external.installed")}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

function ConnectWalletQrCode(props: ConnectWalletQrCodeProps) {
  const [t] = useTranslation(undefined, { i18n });
  const { walletConnectUri, isDark, selectedButton, setBodyState, bodyState, logoImage, primaryColor, handleExternalWalletClick } = props;

  const isDesktop = useMemo<boolean>(() => {
    const browser = Bowser.getParser(window.navigator.userAgent);
    return browser.getPlatformType() === "desktop";
  }, []);

  const root = document.documentElement;
  const whiteColor = "#FFFFFF";
  const blackColor = "#000000";
  const modalColor = getComputedStyle(root)?.getPropertyValue("--app-gray-800")?.trim() || "#1f2a37";
  const qrColor = primaryColor && primaryColor.toLowerCase() === "#ffffff" ? "#000000" : primaryColor;

  if (selectedButton.hasInjectedWallet) {
    return <SelectWalletChainNamespace handleExternalWalletClick={handleExternalWalletClick} selectedButton={selectedButton} />;
  }

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
          className="w3a--appearance-none w3a--rounded-full w3a--border w3a--border-app-gray-400 w3a--px-3 w3a--py-2 w3a--text-sm w3a--font-medium w3a--text-app-gray-400 hover:w3a--bg-app-white hover:w3a--shadow-2xl dark:w3a--border-app-gray-300 dark:w3a--text-app-gray-300 dark:hover:w3a--bg-app-gray-700"
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
