import { useTranslation } from "react-i18next";

import Image from "../../../components/Image";
import i18n from "../../../localeImport";
import { getIcons } from "../../../utils";
import { ConnectWalletChainNamespaceSelectProps } from "./ConnectWalletChainNamespaceSelect.type";

const ConnectWalletChainNamespaceSelect = (props: ConnectWalletChainNamespaceSelectProps) => {
  const { isDark, wallet, handleExternalWalletClick } = props;
  const [t] = useTranslation(undefined, { i18n });

  const chainNamespaces = wallet.chainNamespaces!.sort().map((chainNamespace) => {
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
      <div className="wta:flex wta:items-center wta:justify-center">
        <p className="wta:text-base wta:font-medium wta:text-app-gray-900 wta:dark:text-app-white">{t("modal.external.select-chain")}</p>
      </div>

      {/* Wallet image */}
      <div className="wta:my-6 wta:flex wta:justify-center">
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
      <p className="wta:my-6 wta:text-center wta:text-sm wta:text-app-gray-500 wta:dark:text-app-gray-400">
        {t("modal.external.select-chain-description", { wallet: wallet.displayName })}
      </p>

      {/* Chain namespace buttons */}
      <ul className="wta:flex wta:flex-col wta:gap-3">
        {chainNamespaces.map(({ chainNamespace, displayName, imageId }) => (
          <li key={chainNamespace}>
            <button
              type="button"
              className="w3a--btn wta:group wta:relative wta:h-11 wta:w-full wta:items-center wta:justify-between! wta:overflow-hidden wta:rounded-full"
              onClick={() => handleExternalWalletClick({ connector: wallet.name, chainNamespace })}
            >
              <div className="wta:flex wta:items-center">
                <Image imageId={imageId} hoverImageId={imageId} fallbackImageId="wallet" height="24" width="24" isButton extension="svg" />
                <p className="wta:ml-2 wta:text-left wta:text-sm wta:text-app-gray-900 wta:first-letter:capitalize wta:dark:text-app-gray-200">
                  {displayName}
                </p>
              </div>
              <img
                id="chain-namespace-arrow"
                className="wta:absolute wta:right-4 wta:top-1/2 wta:-translate-x-6 wta:-translate-y-1/2 wta:opacity-0 wta:transition-all wta:duration-300
          wta:group-hover:translate-x-0 wta:group-hover:opacity-100"
                src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")}
                alt="arrow"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConnectWalletChainNamespaceSelect;
