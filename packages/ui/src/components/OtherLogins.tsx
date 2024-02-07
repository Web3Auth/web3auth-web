import { ExternalWalletEventType, ModalState } from "../interfaces";
import ExternalWallets from "./ExternalWallets";
import FarcasterLogin from "./FarcasterLogin";

function OtherLogins({
  modalState,
  areSocialLoginsVisible,
  preHandleExternalWalletClick,
  hideExternalWallets,
}: {
  modalState: ModalState;
  areSocialLoginsVisible: boolean;
  preHandleExternalWalletClick: (params: ExternalWalletEventType) => void;
  hideExternalWallets: () => void;
}) {
  const { showFarcasterLogin, status, walletConnectUri, farcasterLoginConfig, wcAdapters, externalWalletsConfig } = modalState;
  if (showFarcasterLogin) {
    return (
      <FarcasterLogin
        connectUri={modalState.farcasterConnectUri}
        handleExternalWalletClick={preHandleExternalWalletClick}
        hideExternalWallets={hideExternalWallets}
        config={farcasterLoginConfig}
        status={modalState.status}
        errorMessage={modalState.postLoadingMessage}
      />
    );
  }
  return (
    <ExternalWallets
      modalStatus={status}
      showBackButton={areSocialLoginsVisible}
      handleExternalWalletClick={preHandleExternalWalletClick}
      walletConnectUri={walletConnectUri}
      wcAdapters={wcAdapters}
      config={externalWalletsConfig}
      hideExternalWallets={hideExternalWallets}
    />
  );
}

export default OtherLogins;
