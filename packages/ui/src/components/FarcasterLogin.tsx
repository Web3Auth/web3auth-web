import { WALLET_ADAPTERS } from "@web3auth/base";
import copyToClipboard from "copy-to-clipboard";
import { t } from "i18next";
import { memo, useEffect, useState } from "react";
import { QRCode } from "react-qrcode-logo";

import { capitalizeFirstLetter } from "../config";
import { ExternalWalletEventType, FARCASTER_LOGIN_LOGO, MODAL_STATUS } from "../interfaces";
import Icon from "./Icon";
import Loader from "./Loader";

interface FarcasterLoginProps {
  connectUri: string;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  hideExternalWallets: () => void;
}

function FarcasterLogin({ connectUri, handleExternalWalletClick, hideExternalWallets }: FarcasterLoginProps) {
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    setLoading(true);
    handleExternalWalletClick({
      adapter: WALLET_ADAPTERS.FARCASTER,
      loginParams: {
        loginProvider: "jwt",
        login_hint: "",
        name: capitalizeFirstLetter(WALLET_ADAPTERS.FARCASTER),
      },
    });
    setLoading(false);
  }, [handleExternalWalletClick]);

  return (
    <div>
      {loading ? (
        <Loader modalStatus={MODAL_STATUS.CONNECTING} canEmit={false} />
      ) : (
        <>
          <button type="button" className="w3a-external-back w3ajs-external-back" onClick={() => hideExternalWallets()}>
            <Icon iconName="arrow-left" />
            <div className="w3a-group__title">{t("modal.external.back")}</div>
          </button>
          <div className="w3ajs-wallet-connect w3a-wallet-connect">
            <div className="w3ajs-wallet-connect__container w3a-wallet-connect__container">
              <div className="w3a-wallet-connect__container-desktop">
                <div>Scan QR with Warpcast</div>
                <div
                  className="w3ajs-wallet-connect-qr w3a-wallet-connect-qr"
                  tabIndex={0}
                  role="button"
                  onClick={() => copyToClipboard(connectUri)}
                  onKeyDown={() => copyToClipboard(connectUri)}
                >
                  <QRCode size={200} eyeRadius={5} qrStyle="dots" removeQrCodeBehindLogo logoImage={FARCASTER_LOGIN_LOGO} value={connectUri} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(FarcasterLogin);
