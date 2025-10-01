import { useTranslation } from "react-i18next";

import { CONNECT_WALLET_PAGES } from "../../../constants";
import i18n from "../../../localeImport";
import { ConnectWalletHeaderProps } from "./ConnectWalletHeader.type";

function ConnectWalletHeader(props: ConnectWalletHeaderProps) {
  const { disableBackButton, onBackClick, currentPage, selectedButton } = props;
  const [t] = useTranslation(undefined, { i18n });

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    }
  };

  return (
    <div className="w3a--flex w3a--items-center w3a--justify-between">
      {!disableBackButton ? (
        <button
          type="button"
          className="w3a--z-20 w3a--flex w3a--size-5 w3a--cursor-pointer w3a--items-center w3a--justify-center w3a--rounded-full"
          onClick={handleBack}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
            className="w3a--text-app-gray-500 hover:w3a--text-app-gray-900 dark:w3a--text-app-gray-200 dark:hover:w3a--text-app-white"
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 0 1-1.414 0l-6-6a1 1 0 0 1 0-1.414l6-6a1 1 0 0 1 1.414 1.414L5.414 9H17a1 1 0 1 1 0 2H5.414l4.293 4.293a1 1 0 0 1 0 1.414"
              clipRule="evenodd"
            />
          </svg>
        </button>
      ) : (
        <div />
      )}
      <p className="w3a--text-base w3a--font-medium w3a--text-app-gray-900 dark:w3a--text-app-white">
        {currentPage === CONNECT_WALLET_PAGES.SELECTED_WALLET
          ? selectedButton?.displayName
          : currentPage === CONNECT_WALLET_PAGES.CONNECT_WALLET
            ? t("modal.connectYourWallet")
            : currentPage}
      </p>
      <div className="w3a--z-[-1] w3a--size-5" />
    </div>
  );
}

export default ConnectWalletHeader;
