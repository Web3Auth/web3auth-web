import { WALLET_CONNECTORS } from "@web3auth/no-modal";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { WALLET_CONNECT_LOGO } from "../../constants";
import { useModalState } from "../../context/ModalStateContext";
import { useWidget } from "../../context/WidgetContext";
import { ACCOUNT_LINKING_INTENT, ACCOUNT_LINKING_STATUS, type ExternalButton } from "../../interfaces";
import i18n from "../../localeImport";
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
  const [t] = useTranslation(undefined, { i18n });

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
  const isWalletConnectConnector = accountLinkingButton.name === WALLET_CONNECTORS.WALLET_CONNECT_V2;

  const accountLinkingMessage = useMemo(() => {
    switch (modalState.accountLinking.status) {
      case ACCOUNT_LINKING_STATUS.INITIALIZING:
        return t("modal.account-linking.initializing-wallet", { wallet: accountLinkingDisplayName });
      case ACCOUNT_LINKING_STATUS.AWAITING_CONNECTION:
        return modalState.accountLinking.walletConnectUri
          ? isWalletConnectConnector
            ? t("modal.account-linking.scan-walletconnect")
            : t("modal.account-linking.scan-wallet", { wallet: accountLinkingDisplayName })
          : t("modal.account-linking.preparing-wallet-qr", { wallet: accountLinkingDisplayName });
      case ACCOUNT_LINKING_STATUS.WALLET_CONNECTED:
        return isSwitchAccountIntent
          ? t("modal.account-linking.wallet-connected-preparing-switch")
          : t("modal.account-linking.wallet-connected-preparing-linking");
      case ACCOUNT_LINKING_STATUS.LINKING:
        return isSwitchAccountIntent ? t("modal.account-linking.switching-wallet") : t("modal.account-linking.linking-wallet");
      case ACCOUNT_LINKING_STATUS.COMPLETED:
        return isSwitchAccountIntent ? t("modal.account-linking.wallet-switched") : t("modal.account-linking.wallet-linked");
      case ACCOUNT_LINKING_STATUS.ERRORED:
        return (
          modalState.accountLinking.errorMessage ||
          (isSwitchAccountIntent
            ? t("modal.account-linking.failed-switch-wallet", { wallet: accountLinkingDisplayName })
            : t("modal.account-linking.failed-connect-wallet", { wallet: accountLinkingDisplayName }))
        );
      default:
        return "";
    }
  }, [
    accountLinkingDisplayName,
    isSwitchAccountIntent,
    isWalletConnectConnector,
    modalState.accountLinking.errorMessage,
    modalState.accountLinking.status,
    modalState.accountLinking.walletConnectUri,
    t,
  ]);

  return (
    <div className="wta:flex wta:flex-1 wta:flex-col wta:gap-y-4">
      <div className="wta:flex wta:items-center wta:justify-center">
        <p className="wta:text-base wta:font-medium wta:text-app-gray-900 wta:dark:text-app-white">{accountLinkingDisplayName}</p>
      </div>
      {modalState.accountLinking.status === ACCOUNT_LINKING_STATUS.ERRORED ? (
        <div className="wta:rounded-2xl wta:border wta:border-app-gray-200 wta:bg-app-gray-50 wta:p-4 wta:dark:border-app-gray-700 wta:dark:bg-app-gray-800">
          <p className="wta:text-center wta:text-sm wta:text-app-gray-700 wta:dark:text-app-gray-200">{accountLinkingMessage}</p>
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
        <p className="wta:text-center wta:text-sm wta:text-app-gray-500 wta:dark:text-app-gray-300">{accountLinkingMessage}</p>
      )}
    </div>
  );
}

export default AccountLinking;
