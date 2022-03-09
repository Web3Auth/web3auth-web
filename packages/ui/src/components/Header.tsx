import { memo, useContext } from "react";

import { ThemedContext } from "../context/ThemeContext";
import Icon from "./Icon";
import Image from "./Image";

const DEFAULT_LOGO_URL = "https://images.web3auth.io/web3auth-logo.svg";

interface HeaderProps {
  appLogo?: string;
  onClose: () => void;
}

function Header(props: HeaderProps) {
  const { isDark } = useContext(ThemedContext);
  const { appLogo = DEFAULT_LOGO_URL, onClose } = props;

  const web3authIcon = <Image imageId={`web3auth${isDark ? "-light" : ""}`} />;

  return (
    <div className="w3a-modal__header">
      <div className="w3a-header">
        {appLogo ? <img className="w3a-header__logo" src={appLogo} alt="" /> : web3authIcon}

        <div>
          <h1 className="w3a-header__title">Sign in</h1>
          <p className="w3a-header__subtitle">Select one of the following to continue</p>
        </div>
      </div>
      <button type="button" onClick={onClose} className="w3a-header__button w3ajs-close-btn">
        <Icon iconName="close" />
      </button>
    </div>
  );
}

export default memo(Header, (prevProps: HeaderProps, nextProps: HeaderProps) => {
  if (prevProps.appLogo !== nextProps.appLogo) {
    return true;
  }
  return false;
});
