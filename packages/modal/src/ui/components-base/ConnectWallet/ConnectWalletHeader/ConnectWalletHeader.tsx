import { CONNECT_WALLET_PAGES } from "../../../constants";
import { ConnectWalletHeaderProps } from "./ConnectWalletHeader.type";

function ConnectWalletHeader(props: ConnectWalletHeaderProps) {
  const { onBackClick, currentPage, selectedButton } = props;

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    }
  };

  return (
    <div className="w3a--flex w3a--items-center w3a--justify-between">
      <button
        type="button"
        className="w3a--w-5 w3a--h-5 w3a--rounded-full w3a--cursor-pointer w3a--flex w3a--items-center w3a--justify-center w3a--z-20"
        onClick={handleBack}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="w3a--text-app-gray-900 dark:w3a--text-app-white">
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 0 1-1.414 0l-6-6a1 1 0 0 1 0-1.414l6-6a1 1 0 0 1 1.414 1.414L5.414 9H17a1 1 0 1 1 0 2H5.414l4.293 4.293a1 1 0 0 1 0 1.414"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <p className="w3a--text-base w3a--font-medium w3a--text-app-gray-900">
        {currentPage === CONNECT_WALLET_PAGES.SELECTED_WALLET ? selectedButton?.displayName : currentPage}
      </p>
      <div className="w3a--w-5 w3a--h-5 w3a--z-[-1]" />
    </div>
  );
}

export default ConnectWalletHeader;
