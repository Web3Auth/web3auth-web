import Bowser from "bowser";
import copyToClipboard from "copy-to-clipboard";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCode } from "react-qrcode-logo";

import { WALLET_CONNECT_LOGO } from "../interfaces";
import i18n from "../localeImport";

interface WalletConnectProps {
  walletConnectUri: string;
  logoImage?: string;
}

function WalletConnect(props: WalletConnectProps) {
  const { walletConnectUri, logoImage } = props;

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

  return (
    <div className="w3ajs-wallet-connect w3a-wallet-connect">
      <div className="w3ajs-wallet-connect__container w3a-wallet-connect__container">
        <div className="w3a-wallet-connect__container-desktop">
          {/* <div className="text-app-gray-500 dark:text-app-gray-400 text-xs">Scan the QR code with a wallet that supports WalletConnect.</div> */}
          <div
            className="w3ajs-wallet-connect-qr w3a-wallet-connect-qr rounded-md mb-2"
            tabIndex={0}
            role="button"
            onClick={handleCopy}
            onKeyDown={() => copyToClipboard(walletConnectUri)}
          >
            {isCopied && (
              <div className="tooltip">
                Copied
                <div className="absolute border-8 border-b-0 border-r-transparent border-t-app-gray-900 border-l-transparent top-[100%] left-[calc(50%_-_8px)]" />
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
              // eyeColor="#f42bd2"
            />
          </div>
          <div className="text-xs">{t("modal.external.walletconnect-copy")}</div>
        </div>
      </div>
    </div>
  );
}

export default memo(WalletConnect);
