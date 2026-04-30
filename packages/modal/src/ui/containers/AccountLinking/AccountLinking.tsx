import { WALLET_CONNECTORS } from "@web3auth/no-modal";
import { useMemo } from "react";

import { WALLET_CONNECT_LOGO } from "../../constants";
import { useModalState } from "../../context/ModalStateContext";
import { useWidget } from "../../context/WidgetContext";
import { ACCOUNT_LINKING_INTENT, ACCOUNT_LINKING_STATUS, type ExternalButton } from "../../interfaces";
import ConnectWalletQrCode from "../ConnectWallet/ConnectWalletQrCode";

interface AccountLinkingProps {
  allExternalWallets: ExternalButton[];
}

const DEFAULT_ACCOUNT_LINKING_BUTTON: ExternalButton = {
  name: WALLET_CONNECTORS.WALLET_CONNECT_V2,
  displayName: "WalletConnect",
  hasInjectedWallet: false,
  hasWalletConnect: true,
  hasInstallLinks: false,
  imgExtension: "svg",
};

function AccountLinking(props: AccountLinkingProps) {
  const { allExternalWallets } = props;

  const { modalState } = useModalState();
  const { deviceDetails, isDark } = useWidget();

  const accountLinkingButton = useMemo<ExternalButton>(() => {
    const requestedConnectorName = modalState.accountLinking.connectorName;
    if (!requestedConnectorName) return DEFAULT_ACCOUNT_LINKING_BUTTON;
    return allExternalWallets.find((button) => button.name === requestedConnectorName) || DEFAULT_ACCOUNT_LINKING_BUTTON;
  }, [allExternalWallets, modalState.accountLinking.connectorName]);

  const accountLinkingDisplayName = useMemo(() => {
    return accountLinkingButton.displayName || "WalletConnect";
  }, [accountLinkingButton.displayName]);

  const accountLinkingQrLogoImage = useMemo(() => {
    if (accountLinkingButton.name === WALLET_CONNECTORS.WALLET_CONNECT_V2 || !accountLinkingButton.imgExtension) {
      return WALLET_CONNECT_LOGO;
    }
    return `https://images.web3auth.io/login-${accountLinkingButton.name}.${accountLinkingButton.imgExtension}`;
  }, [accountLinkingButton.imgExtension, accountLinkingButton.name]);

  const isSwitchAccountIntent = modalState.accountLinking.intent === ACCOUNT_LINKING_INTENT.SWITCH;

  const accountLinkingMessage = useMemo(() => {
    switch (modalState.accountLinking.status) {
      case ACCOUNT_LINKING_STATUS.INITIALIZING:
        return accountLinkingButton.name === WALLET_CONNECTORS.WALLET_CONNECT_V2
          ? "Initializing WalletConnect..."
          : `Initializing ${accountLinkingDisplayName}...`;
      case ACCOUNT_LINKING_STATUS.AWAITING_CONNECTION:
        return modalState.accountLinking.walletConnectUri
          ? accountLinkingButton.name === WALLET_CONNECTORS.WALLET_CONNECT_V2
            ? "Scan the QR code with a WalletConnect-compatible wallet."
            : `Scan the QR code with ${accountLinkingDisplayName}.`
          : accountLinkingButton.name === WALLET_CONNECTORS.WALLET_CONNECT_V2
            ? "Preparing WalletConnect QR code..."
            : `Preparing ${accountLinkingDisplayName} QR code...`;
      case ACCOUNT_LINKING_STATUS.WALLET_CONNECTED:
        return isSwitchAccountIntent ? "Wallet connected. Preparing account switch..." : "Wallet connected. Preparing account linking...";
      case ACCOUNT_LINKING_STATUS.LINKING:
        return isSwitchAccountIntent ? "Switching wallet..." : "Linking wallet...";
      case ACCOUNT_LINKING_STATUS.COMPLETED:
        return isSwitchAccountIntent ? "Wallet switched." : "Wallet linked.";
      case ACCOUNT_LINKING_STATUS.ERRORED:
        return (
          modalState.accountLinking.errorMessage ||
          (isSwitchAccountIntent
            ? `Failed to switch wallet with ${accountLinkingDisplayName}.`
            : `Failed to connect with ${accountLinkingDisplayName}.`)
        );
      default:
        return "";
    }
  }, [
    accountLinkingButton.name,
    accountLinkingDisplayName,
    isSwitchAccountIntent,
    modalState.accountLinking.errorMessage,
    modalState.accountLinking.status,
    modalState.accountLinking.walletConnectUri,
  ]);

  return (
    <div className="w3a--flex w3a--flex-1 w3a--flex-col w3a--gap-y-4">
      <div className="w3a--flex w3a--items-center w3a--justify-center">
        <p className="w3a--text-base w3a--font-medium w3a--text-app-gray-900 dark:w3a--text-app-white">{accountLinkingDisplayName}</p>
      </div>
      {modalState.accountLinking.status === ACCOUNT_LINKING_STATUS.ERRORED ? (
        <div className="w3a--rounded-2xl w3a--border w3a--border-app-gray-200 w3a--bg-app-gray-50 w3a--p-4 dark:w3a--border-app-gray-700 dark:w3a--bg-app-gray-800">
          <p className="w3a--text-center w3a--text-sm w3a--text-app-gray-700 dark:w3a--text-app-gray-200">{accountLinkingMessage}</p>
        </div>
      ) : (
        <ConnectWalletQrCode
          qrCodeValue={modalState.accountLinking.walletConnectUri}
          isDark={isDark}
          selectedButton={accountLinkingButton}
          logoImage={accountLinkingQrLogoImage}
          primaryColor={accountLinkingButton.walletRegistryItem?.primaryColor}
          platform={deviceDetails.platform}
        />
      )}
      {accountLinkingMessage && modalState.accountLinking.status !== ACCOUNT_LINKING_STATUS.ERRORED && (
        <p className="w3a--text-center w3a--text-sm w3a--text-app-gray-500 dark:w3a--text-app-gray-300">{accountLinkingMessage}</p>
      )}
    </div>
  );
}

export default AccountLinking;
