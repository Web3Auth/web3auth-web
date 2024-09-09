import Bowser from "bowser";
import copyToClipboard from "copy-to-clipboard";
import { memo, useMemo } from "react";
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

  // TODO: show only wcAdapters of current chain
  return (
    <div className="w3ajs-wallet-connect w3a-wallet-connect">
      <div className="w3ajs-wallet-connect__container w3a-wallet-connect__container">
        <div className="w3a-wallet-connect__container-desktop">
          <div>{t("modal.external.walletconnect-subtitle")}</div>
          <div
            className="w3ajs-wallet-connect-qr w3a-wallet-connect-qr"
            tabIndex={0}
            role="button"
            onClick={() => copyToClipboard(walletConnectUri)}
            onKeyDown={() => copyToClipboard(walletConnectUri)}
          >
            <QRCode
              size={isDesktop ? 300 : 260}
              eyeRadius={5}
              qrStyle="dots"
              removeQrCodeBehindLogo
              logoImage={logoImage || WALLET_CONNECT_LOGO}
              value={walletConnectUri}
            />
          </div>
          <div>{t("modal.external.walletconnect-copy")}</div>
        </div>
      </div>
    </div>
  );
}

export default memo(WalletConnect);
