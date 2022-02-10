import React from "react";
import QRCode from "react-qr-code";

import { MODAL_STATUS } from "..";
import Image from "./Image";
import Loader from "./Loader";

const walletConnectIcon = <Image imageId="wallet-connect" width="114px" />;

interface WalletConnectProps {
  walletConnectUri: string;
}

function WalletConnect(props: WalletConnectProps) {
  const { walletConnectUri } = props;
  return (
    <div className="w3ajs-wallet-connect w3a-wallet-connect">
      <Loader modalStatus={walletConnectUri ? MODAL_STATUS.INITIALIZED : MODAL_STATUS.CONNECTING} />
      <i className="w3a-wallet-connect__logo">{walletConnectIcon}</i>
      <div className="w3ajs-wallet-connect__container w3a-wallet-connect__container">
        <div>Scan QR code with a WalletConnect-compatible wallet</div>
        <div className="w3ajs-wallet-connect-qr w3a-wallet-connect-qr">
          <QRCode value={walletConnectUri} />
        </div>
      </div>
    </div>
  );
}

export default React.memo(WalletConnect);
