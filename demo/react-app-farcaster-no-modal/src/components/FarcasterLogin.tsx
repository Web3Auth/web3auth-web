import { memo } from "react";
import { QRCode } from "react-qrcode-logo";

import "./farcasterlogin.css";

interface FarcasterLoginProps {
  connectUri: string;
  goback: () => void;
}

function FarcasterLogin({ connectUri, goback }: FarcasterLoginProps) {

  return (
    <div className="container">
      <div className="back">
        <button type="button" onClick={goback}>Go back</button>
      </div>
      <div>
        Scan QR on warpcast
      </div>
      <QRCode size={200} eyeRadius={5} qrStyle="dots" removeQrCodeBehindLogo value={connectUri} />
    </div>
  );
}

export default memo(FarcasterLogin);
