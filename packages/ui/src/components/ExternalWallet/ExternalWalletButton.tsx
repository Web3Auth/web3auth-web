import { useTranslation } from "react-i18next";

import { ExternalButton } from "../../interfaces";
import i18n from "../../localeImport";
import Button from "../Button";
import Image from "../Image";

interface ExternalWalletButtonProps {
  button: ExternalButton;
  handleWalletClick: (button: ExternalButton) => void;
}

export default function ExternalWalletButton(props: ExternalWalletButtonProps) {
  const { button, handleWalletClick } = props;
  const [t] = useTranslation(undefined, { i18n });

  return (
    <Button
      variant="tertiary"
      type="button"
      onClick={() => handleWalletClick(button)}
      className="w3a--w-full w3a--rounded-xl w3a--size-xl !w3a--justify-between w3a--items-center wallet-btn"
      title={button.name}
    >
      <div className="w3a--flex w3a--items-center">
        <Image
          imageId={`login-${button.name}`}
          hoverImageId={`login-${button.name}`}
          fallbackImageId="wallet"
          height="24"
          width="24"
          isButton
          extension={button.imgExtension}
        />
        <p className="w3a--ml-2 w3a--text-left w3a--text-sm">{button.displayName}</p>
      </div>
      {button.hasInjectedWallet && (
        <span className="w3a--inline-flex w3a--items-center w3a--rounded-lg w3a--px-2 w3a--py-1 w3a--text-xs w3a--font-medium w3a--bg-app-primary-100 w3a--text-app-primary-800">
          {t("modal.external.installed")}
        </span>
      )}
    </Button>
  );
}
