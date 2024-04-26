import { memo, useContext } from "react";
import { useTranslation } from "react-i18next";

import { ThemedContext } from "../context/ThemeContext";
import { DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT } from "../interfaces";
import i18n from "../localeImport";
import Icon from "./Icon";

interface HeaderProps {
  appName: string;
  appLogo?: string;
  onClose: () => void;
}

function Header(props: HeaderProps) {
  const { isDark } = useContext(ThemedContext);
  const { onClose, appLogo, appName } = props;

  const [t] = useTranslation(undefined, { i18n });

  const headerLogo = [DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT].includes(appLogo) ? "" : appLogo;

  const subtitle = t("modal.header-subtitle-name", { appName });

  return (
    <div className="w3a-modal__header">
      <div className="w3a-header">
        <div>
          {headerLogo && (
            <div className="w3a-header__logo">
              <img src={headerLogo} alt="" />
            </div>
          )}
          <div className="w3a-header__title">{t("modal.header-title")}</div>
          <div className="w3a-header__subtitle">
            {subtitle}
            <div className="relative flex flex-col items-center group cursor-pointer">
              <Icon iconName={`information-circle${isDark ? "-light" : ""}`} />
              <div className="absolute top-4 z-20 flex-col items-center hidden mb-5 group-hover:flex">
                <div className="w-3 h-3 ml-[3px] -mb-2 rotate-45 bg-app-gray-50 dark:bg-app-gray-600" />
                <div
                  className={`relative p-4 w-[270px] -translate-x-16 text-xs leading-none text-app-white rounded-md bg-app-gray-50 dark:bg-app-gray-600 shadow-lg ${subtitle.length > 34 ? "-ml-[100px]" : ""}`}
                >
                  <div className="text-xs font-medium mb-1 text-app-gray-900 dark:text-app-white">{t("modal.header-tooltip-title")}</div>
                  <div className="text-xs text-app-gray-400">{t("modal.header-tooltip-desc")}</div>
                </div>
              </div>
            </div>
          </div>
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
