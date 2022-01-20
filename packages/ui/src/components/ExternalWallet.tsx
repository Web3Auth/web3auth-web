import classNames from "classnames";
import { useState } from "react";

import AllImages from "../../assets";

const arrowLeftIcon = AllImages["arrow-left"].image;
const walletConnectIcon = AllImages.walletConnect.image;

export default function ExternalWallet(props) {
  const [areExternalWalletsVisible, setAreExternalWalletsVisible] = useState(false);
  const showExternalWallets = () => {
    $torusWallet.classList.toggle("w3a-group--hidden");
    $torusWalletEmail.classList.toggle("w3a-group--hidden");
  };

  const onExternalConnectClick = () => {
    setAreExternalWalletsVisible(true);
  };
  const externalToggleClass = classNames("w3a-external-toggle", "w3ajs-external-toggle", {
    "w3a-external-toggle--hidden": areExternalWalletsVisible,
  });

  const externalContainerClass = classNames("w3a-external-container", "w3ajs-external-container", {
    "w3a-external-container--hidden": areExternalWalletsVisible,
  });

  return (
    <div className="w3ajs-external-wallet w3a-group">
      <div className={externalToggleClass}>
        <h6 className="w3a-group__title">EXTERNAL WALLET</h6>
        <button className="w3a-button w3ajs-external-toggle__button" onClick={onExternalConnectClick}>
          Connect with Wallet
        </button>
      </div>
      <div className={externalContainerClass}>
        <button className="w3a-external-back w3ajs-external-back">
          ${arrowLeftIcon}
          <h6 className="w3a-group__title">Back</h6>
        </button>

        {/* <!-- Wallet Connect --> */}
        <div className="w3ajs-wallet-connect w3a-wallet-connect w3a-wallet-connect--hidden">
          <i className="w3a-wallet-connect__logo">${walletConnectIcon}</i>
          <div className="w3ajs-wallet-connect__container w3a-wallet-connect__container">
            <div>Scan QR code with a WalletConnect-compatible wallet</div>
            <img className="w3ajs-wallet-connect-qr w3a-wallet-connect-qr" src="" />
          </div>
        </div>
        {/* <!-- Other Wallet --> */}
        <div className="w3a-external-loader w3ajs-external-loader">
          <div className="w3ajs-modal-loader__spinner w3a-spinner w3a-spinner--small">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
        <ul className="w3a-adapter-list w3ajs-wallet-adapters"></ul>
      </div>
    </div>
  );
}
