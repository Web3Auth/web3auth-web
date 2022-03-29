import { IWalletConnectExtensionAdapter } from "@web3auth/base";
import bowser, { PLATFORMS_MAP } from "bowser";
import { memo, useMemo } from "react";
import QRCode from "react-qr-code";

import Image from "./Image";

const walletConnectIcon = <Image imageId="wallet-connect" width="114px" />;

interface WalletConnectProps {
  walletConnectUri: string;
  wcAdapters: IWalletConnectExtensionAdapter[];
}

function WalletConnect(props: WalletConnectProps) {
  const { walletConnectUri, wcAdapters } = props;
  const platform = useMemo(() => {
    const browser = bowser.getParser(window.navigator.userAgent);
    return browser.getPlatformType();
  }, []);
  // TODO: show only wcAdapters of current chain
  return (
    <div className="w3ajs-wallet-connect w3a-wallet-connect">
      <i className="w3a-wallet-connect__logo">{walletConnectIcon}</i>
      <div className="w3ajs-wallet-connect__container w3a-wallet-connect__container">
        {platform === PLATFORMS_MAP.desktop ? (
          <>
            <div>Scan QR code with a WalletConnect-compatible wallet</div>
            <div className="w3ajs-wallet-connect-qr w3a-wallet-connect-qr">
              <QRCode size={200} value={walletConnectUri} />
            </div>
          </>
        ) : (
          <>
            {wcAdapters.map((adapter) => {
              // TODO: render logo and on click,
              // https://github.com/WalletConnect/walletconnect-monorepo/blob/54f3ca0b1cd1ac24e8992a5a812fdfad01769abb/packages/helpers/browser-utils/src/registry.ts#L24
              // format and show
            })}
          </>
        )}
      </div>
    </div>
  );
}

export default memo(WalletConnect);
