import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ExternalButton, MODAL_STATUS } from "../../interfaces";
import i18n from "../../localeImport";
import Button from "../Button";
import Loader from "../Loader";
import WalletConnect from "../WalletConnect";
import ExternalWalletHeader from "./ExternalWalletHeader";
import ExternalWalletInstall from "./ExternalWalletInstall";

interface ExternalWalletConnectProps {
  connectButton: ExternalButton;
  walletConnectUri: string;
  goBack: () => void;
  closeModal: () => void;
}

export default function ExternalWalletConnect(props: ExternalWalletConnectProps) {
  const { connectButton, walletConnectUri, goBack, closeModal } = props;
  const [isWalletDownloadShown, setIsWalletDownloadShown] = useState(false);

  const [t] = useTranslation(undefined, { i18n });

  const showWalletDownload = () => {
    setIsWalletDownloadShown(true);
  };

  return (
    <div>
      {isWalletDownloadShown ? (
        <div>
          <ExternalWalletInstall connectButton={connectButton} goBack={() => setIsWalletDownloadShown(false)} closeModal={closeModal} />
        </div>
      ) : (
        <>
          {/* Header */}
          <ExternalWalletHeader title={connectButton.displayName} goBack={goBack} closeModal={closeModal} />

          {/* Wallet Connect */}

          {!walletConnectUri ? (
            <Loader modalStatus={MODAL_STATUS.CONNECTING} canEmit={false} />
          ) : (
            <WalletConnect
              walletConnectUri={walletConnectUri}
              logoImage={`https://images.web3auth.io/login-${connectButton.name}.svg`}
              primaryColor={connectButton.walletRegistryItem.primaryColor}
            />
          )}

          {/* Install links */}
          {connectButton.hasInstallLinks && (
            <div className="flex flex-row items-center justify-between gap-2 bg-app-gray-50 dark:bg-app-gray-700 text-app-gray-900 dark:text-app-white px-3 py-2 rounded-xl">
              <span className="text-sm truncate flex-grow-0">
                {t("modal.external.dont-have")} <span>{connectButton.displayName}</span>?
              </span>
              <Button type="button" variant="secondary" size="xs" className="flex-grow-1 flex-shrink-0" onClick={showWalletDownload}>
                {t("modal.external.get-wallet")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
