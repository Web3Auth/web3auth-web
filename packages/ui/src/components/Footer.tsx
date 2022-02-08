import React from "react";

interface FooterProps {
  version: string;
}
export default function Footer(props: FooterProps) {
  const { version } = props;
  return (
    <div className="w3a-modal__footer">
      <div className="w3a-footer">
        <div>
          <div className="w3a-footer__links">
            <a href="">Terms of use</a>
            <span>|</span>
            <a href="">Privacy policy</a>
          </div>
          <p>${version}</p>
        </div>
        <div className="w3a-footer__secured">{/* <div>Secured by</div>${web3authIcon} */}</div>
      </div>
    </div>
  );
}
