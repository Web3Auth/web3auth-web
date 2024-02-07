import { BaseAdapterConfig, log, WALLET_ADAPTERS } from "@web3auth/base";
import copyToClipboard from "copy-to-clipboard";
import { t } from "i18next";
import { memo, useCallback, useEffect, useState } from "react";
import { QRCode } from "react-qrcode-logo";

import { capitalizeFirstLetter } from "../config";
import { ExternalWalletEventType, FARCASTER_LOGIN_LOGO, MODAL_STATUS } from "../interfaces";
import Icon from "./Icon";
import Loader from "./Loader";

interface FarcasterLoginProps {
  connectUri: string;
  config: Partial<BaseAdapterConfig>;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  hideExternalWallets: () => void;
}

function FarcasterLogin({ connectUri, handleExternalWalletClick, hideExternalWallets, config }: FarcasterLoginProps) {
  const [loading, setLoading] = useState<boolean>(true);

  const fetchConnectUri = useCallback(
    (refresh?: boolean) => {
      log.debug("fetchConnectUri");
      const isConfigReady = config ? Object.keys(config).length > 0 : false;
      log.debug("isConfigReady", isConfigReady);
      if (isConfigReady && (connectUri === "" || refresh)) {
        setLoading(true);
        log.debug("FarcasterLogin::connecting to farcaster!");
        handleExternalWalletClick({
          adapter: WALLET_ADAPTERS.FARCASTER,
          loginParams: {
            loginProvider: "jwt",
            login_hint: "",
            name: capitalizeFirstLetter(WALLET_ADAPTERS.FARCASTER),
          },
        });
      } else {
        setLoading(false);
      }
    },
    [config, connectUri, handleExternalWalletClick]
  );

  useEffect(() => {
    fetchConnectUri();
  }, [fetchConnectUri]);

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
            <div>
              <div className="w3ajs-modal-loader__message w3a-spinner-message w3a-spinner-message--error">Error! Something wong!</div>
              <button type="button" onClick={() => fetchConnectUri(true)}>
                Refresh
              </button>
            </div>
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
