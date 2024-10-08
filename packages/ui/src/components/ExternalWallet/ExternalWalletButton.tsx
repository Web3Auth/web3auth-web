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
      className="w-full rounded-xl size-xl flex !justify-between items-center wallet-btn"
      title={button.name}
    >
      <div className="flex items-center">
        <Image
          imageId={`login-${button.name}`}
          hoverImageId={`login-${button.name}`}
          fallbackImageId="wallet"
          height="24"
          width="24"
          isButton
          extension={button.imgExtension}
        />
        <p className="ml-2 text-left text-sm">{button.displayName}</p>
      </div>
      {button.hasInjectedWallet && (
        <span className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium bg-app-primary-100 text-app-primary-800">
          {t("modal.external.installed")}
        </span>
      )}
    </Button>
  );
}
