import React, { useContext } from "react";

import { ThemedContext } from "../context/ThemeContext";
import Image from "./Image";

interface FooterProps {
  version: string;
}

function Footer(props: FooterProps) {
  const { version } = props;
  const { isDark } = useContext(ThemedContext);

  const web3authIcon = <Image imageId={`web3auth${isDark ? "-light" : ""}`} />;

  return (
    <div className="w3a-modal__footer">
      <div className="w3a-footer">
        <div>
          <div className="w3a-footer__links">
            <a href="">Terms of use</a>
            <span>|</span>
            <a href="">Privacy policy</a>
          </div>
          <p>{version}</p>
        </div>
        <div className="w3a-footer__secured">
          <div>Secured by</div>
          {web3authIcon}
        </div>
      </div>
    </div>
  );
}

export default React.memo(Footer);
