import { log, WALLET_ADAPTERS } from "@web3auth/base";
import { memo, useEffect } from "react";
import { QRCode } from "react-qrcode-logo";

import { ExternalWalletEventType } from "../interfaces";

interface FarcasterLoginProps {
  connectUri: string;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
}

function FarcasterLogin({ connectUri, handleExternalWalletClick }: FarcasterLoginProps) {
  useEffect(() => {
    log.debug("connectUri", connectUri);
    handleExternalWalletClick({ adapter: WALLET_ADAPTERS.FARCASTER });
  }, [connectUri, handleExternalWalletClick]);

  return (
    <div>
      <QRCode size={200} eyeRadius={5} qrStyle="dots" removeQrCodeBehindLogo value={connectUri} />
    </div>
  );
}

export default memo(FarcasterLogin);
