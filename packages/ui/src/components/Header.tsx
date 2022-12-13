import { memo } from "react";
import { useTranslation } from "react-i18next";

// import { ThemedContext } from "../context/ThemeContext";
import Icon from "./Icon";
// import Image from "./Image";

// const DEFAULT_LOGO_URL = "https://images.web3auth.io/web3auth-logo.svg";

interface HeaderProps {
  appName: string;
  appLogo?: string;
  onClose: () => void;
}

function Header(props: HeaderProps) {
  // const { isDark } = useContext(ThemedContext);
  const { onClose, appLogo, appName } = props;

  const [t] = useTranslation();

  return (
    <div className="w3a-modal__header">
      <div className="w3a-header">
        {/* todo: invert condition to show app logo */}
        {!appLogo ? <img className="w3a-header__logo" src={appLogo} alt="" /> : <div />}

        <div>
          <div className="w3a-header__title">{t("modal.header-title")}</div>
          <p className="w3a-header__subtitle">{t("modal.header-subtitle-name", { appName })}</p>
        </div>
      </div>
      <button type="button" onClick={onClose} className="w3a-header__button w3ajs-close-btn">
        <Icon iconName="close" />
      </button>
    </div>
  );
}

const memoizedHeader = memo(Header, (prevProps: HeaderProps, nextProps: HeaderProps) => {
  if (prevProps.appLogo !== nextProps.appLogo) {
    return true;
  }
  return false;
});

memoizedHeader.displayName = "Header";

export default memoizedHeader;
