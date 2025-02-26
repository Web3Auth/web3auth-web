import { ExternalButton } from "../../interfaces";
import ExternalWalletConnect from "./ExternalWalletConnect";
import ExternalWalletInstall from "./ExternalWalletInstall";

interface ExternalWalletDetailProps {
  connectButton: ExternalButton;
  walletConnectUri: string;
  goBack: () => void;
  closeModal: () => void;
}

export default function ExternalWalletDetail(props: ExternalWalletDetailProps) {
  const { connectButton, walletConnectUri, goBack, closeModal } = props;

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
