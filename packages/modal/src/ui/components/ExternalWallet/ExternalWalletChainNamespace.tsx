import { useTranslation } from "react-i18next";

import { ExternalButton, ExternalWalletEventType } from "../../interfaces";
import i18n from "../../localeImport";
import Button from "../Button";
import Image from "../Image";
import ExternalWalletHeader from "./ExternalWalletHeader";

interface ExternalWalletChainNamespaceProps {
  button: ExternalButton;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  goBack: () => void;
  closeModal: () => void;
}

export default function ExternalWalletChainNamespace(props: ExternalWalletChainNamespaceProps) {
  const { button, goBack, closeModal, handleExternalWalletClick } = props;

  const [t] = useTranslation(undefined, { i18n });

  // chainNames should be available when selecting a chain namespace
  const chainNamespaces = button.chainNamespaces!.map((chainNamespace) => {
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
      {/* TODO: add translations for this component */}
      <ExternalWalletHeader title={`${t("modal.external.select-chain")}`} goBack={goBack} closeModal={closeModal} />

      {/* Wallet image */}
      <div className="w3a--flex w3a--justify-center w3a--my-6">
        <Image
          imageId={`login-${button.name}`}
          hoverImageId={`login-${button.name}`}
          fallbackImageId="wallet"
          height="100"
          width="100"
          isButton
          extension={button.imgExtension}
        />
      </div>

      {/* Description */}
      {/* TODO: This {button.displayName} wallet supports multiple chains. Select which chain you&apos;d like to connect to */}
      <p className="w3a--text-center w3a--text-sm w3a--text-app-gray-500 w3a--my-6">
        {t("modal.external.select-chain-description", { wallet: button.displayName })}
      </p>

      {/* Chain namespace buttons */}
      <ul className="w3a--flex w3a--flex-col w3a--gap-3">
        {chainNamespaces.map(({ chainNamespace, displayName, imageId }) => (
          <li key={chainNamespace}>
            <Button
              variant="tertiary"
              type="button"
              onClick={() => handleExternalWalletClick({ connector: button.name, chainNamespace })}
              className="w3a--w-full w3a--size-xl !w3a--justify-between w3a--items-center wallet-btn"
              title={displayName}
            >
              <div className="w3a--flex w3a--items-center">
                <Image imageId={imageId} hoverImageId={imageId} fallbackImageId="wallet" height="24" width="24" isButton extension="svg" />
                <p className="w3a--ml-2 w3a--text-left w3a--text-sm first-letter:w3a--capitalize">{displayName}</p>
              </div>
              <span className="w3a--inline-flex w3a--items-center w3a--rounded-lg w3a--px-2 w3a--py-1 w3a--text-xs w3a--font-medium w3a--bg-app-primary-100 w3a--text-app-primary-800">
                {t("modal.external.installed")}
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
