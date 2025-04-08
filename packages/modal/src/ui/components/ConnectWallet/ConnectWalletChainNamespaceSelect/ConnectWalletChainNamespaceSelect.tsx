import { useTranslation } from "react-i18next";

import i18n from "../../../localeImport";
import { getIcons } from "../../../utils";
import Image from "../../Image";
import { ConnectWalletChainNamespaceSelectProps } from "./ConnectWalletChainNamespaceSelect.type";

const ConnectWalletChainNamespaceSelect = (props: ConnectWalletChainNamespaceSelectProps) => {
  const { isDark, wallet, handleExternalWalletClick } = props;
  const [t] = useTranslation(undefined, { i18n });

  const chainNamespaces = wallet.chainNamespaces!.map((chainNamespace) => {
    const imageId = chainNamespace === "eip155" ? "evm" : chainNamespace;
    const displayName = chainNamespace === "eip155" ? "EVM" : chainNamespace;
    return {
      chainNamespace,
      displayName,
      imageId: `chain-${imageId}`,
    };
  });

  return (
    <div>
      {/* Header */}
      <div className="w3a--flex w3a--items-center w3a--justify-center">
        {/* <button
          type="button"
          className="w3a--z-20 w3a--flex w3a--size-5 w3a--cursor-pointer w3a--items-center w3a--justify-center w3a--rounded-full"
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
        </button> */}
        <p className="w3a--text-base w3a--font-medium w3a--text-app-gray-900 dark:w3a--text-app-white">{t("modal.external.select-chain")}</p>
      </div>

      {/* Wallet image */}
      <div className="w3a--my-6 w3a--flex w3a--justify-center">
        <Image
          imageId={`login-${wallet.name}`}
          hoverImageId={`login-${wallet.name}`}
          fallbackImageId="wallet"
          height="100"
          width="100"
          isButton
          extension={wallet.imgExtension}
        />
      </div>

      {/* Description */}
      <p className="w3a--my-6 w3a--text-center w3a--text-sm w3a--text-app-gray-500">
        {t("modal.external.select-chain-description", { wallet: wallet.displayName })}
      </p>

      {/* Chain namespace buttons */}
      <ul className="w3a--flex w3a--flex-col w3a--gap-3">
        {chainNamespaces.map(({ chainNamespace, displayName, imageId }) => (
          <li key={chainNamespace}>
            <button
              type="button"
              className="w3a--btn w3a--size-xl w3a--w-full w3a--items-center !w3a--justify-between w3a--rounded-full"
              onClick={() => handleExternalWalletClick({ connector: wallet.name, chainNamespace })}
            >
              <div className="w3a--flex w3a--items-center">
                <Image imageId={imageId} hoverImageId={imageId} fallbackImageId="wallet" height="24" width="24" isButton extension="svg" />
                <p className="w3a--ml-2 w3a--text-left w3a--text-sm first-letter:w3a--capitalize">{displayName}</p>
              </div>
              <img id="external-wallet-arrow" src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")} alt="arrow" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConnectWalletChainNamespaceSelect;
