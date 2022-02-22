import { BaseAdapterConfig, WALLET_ADAPTERS } from "@web3auth/base";
import { useCallback, useState } from "react";

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
}
export default function ExternalWallet(props: ExternalWalletsProps) {
  const { hideExternalWallets, handleExternalWalletClick, config = {}, walletConnectUri, showBackButton, modalStatus } = props;
  const [isLoading, setLoading] = useState(true);

  const renderWalletConnect = useCallback(() => {
    if (config[WALLET_ADAPTERS.WALLET_CONNECT_V1] && config[WALLET_ADAPTERS.WALLET_CONNECT_V1].showOnModal !== false) {
      if (!walletConnectUri) {
        handleExternalWalletClick({ adapter: WALLET_ADAPTERS.WALLET_CONNECT_V1 });
        return null;
      }
      if (isLoading) setLoading(false);
      return <WalletConnect walletConnectUri={walletConnectUri} />;
    }
    return null;
  }, [isLoading, config, handleExternalWalletClick, walletConnectUri]);

  return (
    <div className="w3ajs-external-wallet w3a-group">
      <div className="w3a-external-container w3ajs-external-container">
        {showBackButton && (
          <button type="button" className="w3a-external-back w3ajs-external-back" onClick={hideExternalWallets}>
            <Icon iconName="arrow-left" />
            <h6 className="w3a-group__title">Back</h6>
          </button>
        )}
        {isLoading && <Loader modalStatus={MODAL_STATUS.CONNECTING} />}
        {renderWalletConnect()}
        {/* <!-- Other Wallet --> */}
        {modalStatus === MODAL_STATUS.INITIALIZED && (
          <ul className="w3a-adapter-list w3ajs-wallet-adapters">
            {Object.keys(config).map((adapter, index, allKeys) => {
              if (adapter === WALLET_ADAPTERS.WALLET_CONNECT_V1 || adapter === WALLET_ADAPTERS.WALLET_CONNECT_V2) {
                return null;
              }
              if (allKeys.length - 1 === index && isLoading) setLoading(false);
              const providerIcon = <Image imageId={`login-${adapter}`} />;

              return (
                <li className="w3a-adapter-item" key={adapter}>
                  <button type="button" onClick={() => handleExternalWalletClick({ adapter })} className="w3a-button w3a-button--icon">
                    {providerIcon}
                  </button>
                  <p className="w3a-adapter-item__label">{config[adapter]?.label || adapter}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
