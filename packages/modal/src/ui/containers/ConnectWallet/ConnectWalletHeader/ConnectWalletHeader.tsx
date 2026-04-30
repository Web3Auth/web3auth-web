import { useTranslation } from "react-i18next";

import { CONNECT_WALLET_PAGES } from "../../../constants";
import i18n from "../../../localeImport";
import { ConnectWalletHeaderProps } from "./ConnectWalletHeader.type";

function ConnectWalletHeader(props: ConnectWalletHeaderProps) {
  const { hideBackButton, disableBackButton, onBackClick, currentPage, selectedButton } = props;
  const [t] = useTranslation(undefined, { i18n });

  const handleBack = () => {
    if (onBackClick && !disableBackButton) {
      onBackClick();
    }
  };

  return (
    <div className="wta:flex wta:items-center wta:justify-between">
      {!hideBackButton ? (
        <button
          type="button"
          className="wta:z-20 wta:flex wta:size-5 wta:cursor-pointer wta:items-center wta:justify-center wta:rounded-full"
          onClick={handleBack}
          disabled={disableBackButton}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
            className={`wta:text-app-gray-500 wta:dark:text-app-gray-200 ${disableBackButton ? "wta:cursor-not-allowed wta:opacity-50" : "wta:hover:text-app-gray-900 wta:dark:hover:text-app-white"}`}
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
      <p className="wta:text-base wta:font-medium wta:text-app-gray-900 wta:dark:text-app-white">
        {currentPage === CONNECT_WALLET_PAGES.SELECTED_WALLET
          ? selectedButton?.displayName
          : currentPage === CONNECT_WALLET_PAGES.CONNECT_WALLET
            ? t("modal.connectYourWallet")
            : currentPage}
      </p>
      <div className="wta:z-[-1] wta:size-5" />
    </div>
  );
}

export default ConnectWalletHeader;
