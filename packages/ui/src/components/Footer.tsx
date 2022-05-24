import { memo } from "react";

import Image from "./Image";

function Footer() {
  const web3authIcon = <Image imageId="web3auth-dark" height="14px" width="auto" />;

  return (
    <div className="w3a-modal__footer">
      <div className="w3a-footer">
        <div className="w3a-footer__secured">
          <div>Self-custodial login by</div>
          {web3authIcon}
        </div>
      </div>
    </div>
  );
}

export default memo(Footer);
