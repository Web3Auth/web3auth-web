import Bowser from "bowser";
import copyToClipboard from "copy-to-clipboard";
import { memo, useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCode } from "react-qrcode-logo";

import { ThemedContext } from "../context/ThemeContext";
import { WALLET_CONNECT_LOGO } from "../interfaces";
import i18n from "../localeImport";

interface WalletConnectProps {
  walletConnectUri: string;
  logoImage?: string;
  primaryColor?: string;
}

function WalletConnect(props: WalletConnectProps) {
  const { walletConnectUri, logoImage, primaryColor } = props;
  const { isDark } = useContext(ThemedContext);

  const isDesktop = useMemo<boolean>(() => {
    const browser = Bowser.getParser(window.navigator.userAgent);
    return browser.getPlatformType() === "desktop";
  }, []);

  const [t] = useTranslation(undefined, { i18n });

  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(walletConnectUri);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  const root = document.documentElement;
  const whiteColor = "#FFFFFF";
  const blackColor = "#000000";
  const modalColor = getComputedStyle(root)?.getPropertyValue("--app-gray-800")?.trim() || "#1f2a37";
  const qrColor = primaryColor.toLowerCase() === "#ffffff" ? "#000000" : primaryColor;

  return (
    <div className="w3ajs-wallet-connect w3a-wallet-connect">
      <div className="w3ajs-wallet-connect__container w3a-wallet-connect__container">
        <div className="w3a-wallet-connect__container-desktop">
          {/* <div className="text-app-gray-500 dark:text-app-gray-400 text-xs">{t("modal.external.walletconnect-subtitle")}</div> */}
          <div
            className="w3ajs-wallet-connect-qr w3a-wallet-connect-qr w3a--rounded-md w3a--mb-2"
            tabIndex={0}
            role="button"
            onClick={handleCopy}
            onKeyDown={() => copyToClipboard(walletConnectUri)}
          >
            {isCopied && (
              <div className="tooltip">
                Copied
                <div className="w3a--absolute w3a--border-8 w3a--border-b-0 w3a--border-r-transparent w3a--border-t-app-gray-900 w3a--border-l-transparent w3a--top-[100%] w3a--left-[calc(50%_-_8px)]" />
              </div>
            )}
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
          <div className="text-xs">{t("modal.external.walletconnect-copy")}</div>
        </div>
      </div>
    </div>
  );
}

export default memo(WalletConnect);
