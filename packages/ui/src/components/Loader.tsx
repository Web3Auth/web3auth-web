import React from "react";

interface LoaderProps {
  isLoading: boolean;
}
export default function Loader(props: LoaderProps) {
  const { isLoading } = props;
  return isLoading ? (
    <div className="w3ajs-modal-loader w3a-modal__loader">
      <div className="w3a-modal__loader-content">
        <div className="w3a-modal__loader-info">
          <div className="w3ajs-modal-loader__spinner w3a-spinner">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <div className="w3ajs-modal-loader__label w3a-spinner-label"></div>
          <div className="w3ajs-modal-loader__message w3a-spinner-message" style={{ display: "none" }}></div>
        </div>
        <div className="w3a-spinner-power">{/* <div>Secured by</div>${web3authIcon} */}</div>
      </div>
      {/* <button className="w3a-header__button w3ajs-loader-close-btn">${closeIcon}</button> */}
    </div>
  ) : (
    <></>
  );
}
