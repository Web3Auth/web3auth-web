import React from "react";

interface HeaderProps {
  appLogo: string;
}

export default function Header(props: HeaderProps) {
  const { appLogo } = props;
  return (
    <div className="w3a-modal__header">
      <div className="w3a-header">
        <img className="w3a-header__logo" src={appLogo} alt="" />
        <div>
          <h1 className="w3a-header__title">Sign in</h1>
          <p className="w3a-header__subtitle">Select one of the following to continue</p>
        </div>
      </div>
      {/* <button className="w3a-header__button w3ajs-close-btn">${closeIcon}</button> TODO: add button handlers here */}
    </div>
  );
}
