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
              logoImage={`https://images.web3auth.io/login-${connectButton.name}.${connectButton.imgExtension}`}
              primaryColor={connectButton.walletRegistryItem.primaryColor}
            />
          )}

          {/* Install links */}
          {connectButton.hasInstallLinks && (
            <div className="w3a--flex w3a--flex-row w3a--items-center w3a--justify-between w3a--gap-2 w3a--bg-app-gray-50 dark:w3a--bg-app-gray-700 w3a--text-app-gray-900 dark:w3a--text-app-white w3a--px-3 w3a--py-2 w3a--rounded-xl">
              <span className="w3a--text-sm w3a--truncate w3a--flex-grow-0">
                {t("modal.external.dont-have")} <span>{connectButton.displayName}</span>?
              </span>
              <Button type="button" variant="secondary" size="xs" className="w3a--flex-grow-1 w3a--flex-shrink-0" onClick={showWalletDownload}>
                {t("modal.external.get-wallet")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
