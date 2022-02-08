import { BaseAdapterConfig, WALLET_ADAPTERS, WalletConnectV1Data } from "@web3auth/base";
import React from "react";

import AllImages from "../../assets";
import Loader from "./Loader";

// const arrowLeftIcon = AllImages["arrow-left"].image;
// const walletConnectIcon = AllImages.walletConnect.image;

interface ExternalWalletsProps {
  hideExternalWallets: () => void;
  showWalletConnect: boolean;
  config: Record<string, BaseAdapterConfig>;
}
export default function ExternalWallet(props: ExternalWalletsProps) {
  const { hideExternalWallets, showWalletConnect, config = {} } = props;

  // const externalToggleClass = classNames("w3a-external-toggle", "w3ajs-external-toggle", {
  //   "w3a-external-toggle--hidden": areExternalWalletsVisible,
  // });

  return (
    <div className="w3ajs-external-wallet w3a-group">
      <div className="w3a-external-container w3ajs-external-container">
        <button className="w3a-external-back w3ajs-external-back" onClick={() => hideExternalWallets()}>
          {/* ${arrowLeftIcon} */}
          <h6 className="w3a-group__title">Back</h6>
        </button>

        {/* <!-- Wallet Connect --> */}
        {showWalletConnect && (
          <div className="w3ajs-wallet-connect w3a-wallet-connect">
            {/* <i className="w3a-wallet-connect__logo">${walletConnectIcon}</i> */}
            <div className="w3ajs-wallet-connect__container w3a-wallet-connect__container">
              <div>Scan QR code with a WalletConnect-compatible wallet</div>
              <img className="w3ajs-wallet-connect-qr w3a-wallet-connect-qr" src="" />
            </div>
          </div>
        )}
        <Loader isLoading={false} />

        {/* <!-- Other Wallet --> */}
        <ul className="w3a-adapter-list w3ajs-wallet-adapters">
          {Object.keys(config).map((adapter) => {
            if (adapter === WALLET_ADAPTERS.WALLET_CONNECT_V1 || adapter === WALLET_ADAPTERS.WALLET_CONNECT_V2) {
              // const data = adaptersData[adapter] as WalletConnectV1Data;
              // log.info("uri for wallet connect qr code", data?.uri);
              // this.updateWalletConnect(data?.uri);
              // fire connect event and so that it will be start listening for incoming connections / qr code scans.
              // this.emit(LOGIN_MODAL_EVENTS.LOGIN, { adapter });
              return <></>;
            }
            const providerIcon = AllImages[`login-${adapter}`].image;

            // adapterButton.addEventListener("click", () => {
            //   this.emit(LOGIN_MODAL_EVENTS.LOGIN, { adapter });
            // });

            return (
              <li className="w3a-adapter-item">
                <button className="w3a-button w3a-button--icon">{adapter.substring(0, 2)}</button>
                <p className="w3a-adapter-item__label">{config[adapter]?.label || adapter}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
