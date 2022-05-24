import { BaseAdapterConfig, IWalletConnectExtensionAdapter, log, WALLET_ADAPTERS } from "@web3auth/base";
import { useEffect, useState } from "react";

import { MODAL_STATUS, ModalStatusType } from "../interfaces";
import Icon from "./Icon";
import Image from "./Image";
import Loader from "./Loader";
import WalletConnect from "./WalletConnect";

interface ExternalWalletsProps {
  hideExternalWallets: () => void;
  handleExternalWalletClick: (params: { adapter: string }) => void;
  config: Record<string, BaseAdapterConfig>;
  walletConnectUri: string | undefined;
  showBackButton: boolean;
  modalStatus: ModalStatusType;
  wcAdapters: IWalletConnectExtensionAdapter[];
}
export default function ExternalWallet(props: ExternalWalletsProps) {
  const { hideExternalWallets, handleExternalWalletClick, config = {}, walletConnectUri, showBackButton, modalStatus, wcAdapters } = props;
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    log.debug("loaded external wallets", config, walletConnectUri);
    const wcAvailable = (config[WALLET_ADAPTERS.WALLET_CONNECT_V1]?.showOnModal || false) !== false;
    if (wcAvailable && !walletConnectUri) {
      handleExternalWalletClick({ adapter: WALLET_ADAPTERS.WALLET_CONNECT_V1 });
    } else if (Object.keys(config).length > 0) {
      setIsLoaded(true);
    }
  }, [config, handleExternalWalletClick, walletConnectUri]);

  return (
    <div className="w3ajs-external-wallet w3a-group">
      <div className="w3a-external-container w3ajs-external-container">
        {showBackButton && (
          <button type="button" className="w3a-external-back w3ajs-external-back" onClick={hideExternalWallets}>
            <Icon iconName="arrow-left-new" cls="back-button-arrow" />
            <div className="w3a-footer__secured">Back</div>
          </button>
        )}
        {!isLoaded && <Loader modalStatus={MODAL_STATUS.CONNECTING} canEmit={false} />}
        {/* <!-- Other Wallet --> */}
        {Object.keys(config).map((adapter) => {
          if (adapter === WALLET_ADAPTERS.WALLET_CONNECT_V1 || adapter === WALLET_ADAPTERS.WALLET_CONNECT_V2) {
            return <WalletConnect key={adapter} walletConnectUri={walletConnectUri} wcAdapters={wcAdapters} />;
          }
          return null;
        })}
        {modalStatus === MODAL_STATUS.INITIALIZED && (
          <div className="w3a-external__container">
            <div className="w3a-wallet__subtitle">Other popular wallets</div>
            <ul className="w3a-adapter-list w3ajs-wallet-adapters ">
              {Object.keys(config).map((adapter) => {
                if (adapter === WALLET_ADAPTERS.WALLET_CONNECT_V1 || adapter === WALLET_ADAPTERS.WALLET_CONNECT_V2) {
                  return null;
                }
                const providerIcon = <Image imageId={`login-${adapter}`} />;

                return (
                  <li className="w3a-adapter-item" key={adapter}>
                    <button type="button" onClick={() => handleExternalWalletClick({ adapter })} className="w3a-button w3a-button--wallet">
                      {providerIcon}
                    </button>
                    <p className="w3a-adapter-item__label">{config[adapter]?.label || adapter}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
