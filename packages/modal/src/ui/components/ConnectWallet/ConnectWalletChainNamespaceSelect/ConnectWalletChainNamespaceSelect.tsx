import { useTranslation } from "react-i18next";

import i18n from "../../../localeImport";
import Image from "../../Image";
import { ConnectWalletChainNamespaceSelectProps } from "./ConnectWalletChainNamespaceSelect.type";

const ConnectWalletChainNamespaceSelect = (props: ConnectWalletChainNamespaceSelectProps) => {
  const { handleExternalWalletClick, selectedButton } = props;
  const [t] = useTranslation(undefined, { i18n });

  const chainNamespaces = selectedButton.chainNamespaces!.map((chainNamespace) => {
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
      {/* Wallet image */}
      <div className="w3a--my-6 w3a--flex w3a--justify-center">
        <Image
          imageId={`login-${selectedButton.name}`}
          hoverImageId={`login-${selectedButton.name}`}
          fallbackImageId="wallet"
          height="100"
          width="100"
          isButton
          extension={selectedButton.imgExtension}
        />
      </div>

      {/* Description */}
      <p className="w3a--my-6 w3a--text-center w3a--text-sm w3a--text-app-gray-500">
        {t("modal.external.select-chain-description", { wallet: selectedButton.displayName })}
      </p>

      {/* Chain namespace buttons */}
      <ul className="w3a--flex w3a--flex-col w3a--gap-3">
        {chainNamespaces.map(({ chainNamespace, displayName, imageId }) => (
          <li key={chainNamespace}>
            <button
              type="button"
              className="w3a--btn w3a--size-xl w3a--w-full w3a--items-center !w3a--justify-between w3a--rounded-full"
              onClick={() => handleExternalWalletClick({ connector: selectedButton.name, chainNamespace })}
            >
              <div className="w3a--flex w3a--items-center">
                <Image imageId={imageId} hoverImageId={imageId} fallbackImageId="wallet" height="24" width="24" isButton extension="svg" />
                <p className="w3a--ml-2 w3a--text-left w3a--text-sm first-letter:w3a--capitalize">{displayName}</p>
              </div>
              <span className="w3a--inline-flex w3a--items-center w3a--rounded-lg w3a--bg-app-primary-100 w3a--px-2 w3a--py-1 w3a--text-xs w3a--font-medium w3a--text-app-primary-800">
                {t("modal.external.installed")}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConnectWalletChainNamespaceSelect;
