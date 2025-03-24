import { ExternalButton, ExternalWalletEventType } from "../../interfaces";
import ExternalWalletChainNamespace from "./ExternalWalletChainNamespace";
import ExternalWalletConnect from "./ExternalWalletConnect";
import ExternalWalletInstall from "./ExternalWalletInstall";

interface ExternalWalletDetailProps {
  connectButton: ExternalButton;
  walletConnectUri: string;
  goBack: () => void;
  closeModal: () => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
}

export default function ExternalWalletDetail(props: ExternalWalletDetailProps) {
  const { connectButton, walletConnectUri, goBack, closeModal, handleExternalWalletClick } = props;

  // Select chain namespace for injected wallets
  if (connectButton.hasInjectedWallet) {
    return (
      <ExternalWalletChainNamespace
        handleExternalWalletClick={handleExternalWalletClick}
        button={connectButton}
        goBack={goBack}
        closeModal={closeModal}
      />
    );
  }

  return (
    <div>
      {connectButton.hasWalletConnect ? (
        // Wallet Connect
        <ExternalWalletConnect connectButton={connectButton} walletConnectUri={walletConnectUri} goBack={goBack} closeModal={closeModal} />
      ) : (
        // Download wallets
        <ExternalWalletInstall connectButton={connectButton} goBack={goBack} closeModal={closeModal} />
      )}
    </div>
  );
}
