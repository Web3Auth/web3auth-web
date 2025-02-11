import { memo } from "react";
import { useTranslation } from "react-i18next";

import { DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT } from "../interfaces";
import i18n from "../localeImport";
import Icon from "./Icon";

interface HeaderProps {
  appName: string;
  appLogo?: string;
  onClose: () => void;
}

function Header(props: HeaderProps) {
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
            <div className="w3a--relative w3a--flex w3a--flex-col w3a--items-center w3a--group w3a--cursor-pointer">
              <Icon iconName="information-circle-light" darkIconName="information-circle" />
              <div className="w3a--absolute w3a--top-4 w3a--z-20 w3a--flex-col w3a--items-center w3a--hidden w3a--mb-5 group-hover:w3a--flex">
                <div className="w3a--w-3 w3a--h-3 w3a--ml-[3px] -w3a--mb-2 w3a--rotate-45 w3a--bg-app-gray-50 dark:w3a--bg-app-gray-600" />
                <div
                  className={`w3a--relative w3a--p-4 w3a--w-[270px] w3a--translate-x-[-16px] w3a--text-xs w3a--leading-none w3a--text-app-white w3a--rounded-md w3a--bg-app-gray-50 dark:w3a--bg-app-gray-600 w3a--shadow-lg ${subtitle.length > 34 ? "-w3a--ml-[100px]" : ""}`}
                >
                  <div className="w3a--text-xs w3a--font-medium w3a--mb-1 w3a--text-app-gray-900 dark:w3a--text-app-white">
                    {t("modal.header-tooltip-title")}
                  </div>
                  <div className="w3a--text-xs w3a--text-app-gray-400">{t("modal.header-tooltip-desc")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button type="button" onClick={onClose} className="w3a-header__button w3ajs-close-btn ">
        <Icon iconName="x-light" darkIconName="x-dark" />
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
