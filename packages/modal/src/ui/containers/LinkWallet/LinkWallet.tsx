import { type BaseConnectorConfig, log } from "@web3auth/no-modal";
import { useCallback, useState } from "react";

import { useWidget } from "../../context/WidgetContext";
import { useWalletFiltering } from "../../hooks/useWalletFiltering";
import { ExternalButton } from "../../interfaces";
import ConnectWalletChainFilter from "../ConnectWallet/ConnectWalletChainFilter";
import ConnectWalletList from "../ConnectWallet/ConnectWalletList";
import ConnectWalletSearch from "../ConnectWallet/ConnectWalletSearch";
import LinkWalletConnecting from "./LinkWalletConnecting";
import LinkWalletSignVerify from "./LinkWalletSignVerify";
import LinkWalletSuccess from "./LinkWalletSuccess";

export interface LinkWalletProps {
  allRegistryButtons: ExternalButton[];
  customConnectorButtons: ExternalButton[];
  connectorVisibilityMap: Record<string, boolean>;
  externalWalletsConfig: Record<string, BaseConnectorConfig>;
}

type LinkWalletStep = "wallet_list" | "connecting" | "sign_verify" | "success";

function LinkWallet(props: LinkWalletProps) {
  const { allRegistryButtons, customConnectorButtons, connectorVisibilityMap } = props;

  const { isDark, uiConfig } = useWidget();
  const { walletRegistry } = uiConfig;

  const {
    externalButtons,
    totalExternalWalletsCount,
    initialWalletCount,
    walletSearch,
    handleWalletSearch,
    selectedChain,
    setSelectedChain,
    isShowAllWallets,
    handleMoreWallets,
  } = useWalletFiltering({
    allRegistryButtons,
    customConnectorButtons,
    connectorVisibilityMap,
    externalWalletsConfig: props.externalWalletsConfig,
    walletRegistry,
  });

  const [step, setStep] = useState<LinkWalletStep>("wallet_list");
  const [stepError, setStepError] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<ExternalButton | null>(null);

  const handleWalletClick = useCallback((button: ExternalButton) => {
    log.info("linkWallet: wallet selected", {
      name: button.name,
      displayName: button.displayName,
      isInstalled: button.isInstalled,
      hasInjectedWallet: button.hasInjectedWallet,
      chainNamespaces: button.chainNamespaces,
    });
    setSelectedWallet(button);
    setStepError(false);
    setStep("connecting");
  }, []);

  const walletName = selectedWallet?.displayName || selectedWallet?.name || "Wallet";
  const walletId = selectedWallet?.name || "";
  const imgExtension = selectedWallet?.imgExtension;

  if (step === "connecting") {
    return (
      <LinkWalletConnecting
        walletName={walletName}
        walletId={walletId}
        imgExtension={imgExtension}
        stepError={stepError}
        onRetry={() => setStepError(false)}
      />
    );
  }

  if (step === "sign_verify") {
    return (
      <LinkWalletSignVerify
        walletName={walletName}
        walletId={walletId}
        imgExtension={imgExtension}
        stepError={stepError}
        onRetry={() => setStepError(false)}
      />
    );
  }

  if (step === "success") {
    return <LinkWalletSuccess walletName={walletName} walletId={walletId} imgExtension={imgExtension} />;
  }

  return (
    <div className="w3a--relative w3a--flex w3a--flex-1 w3a--flex-col w3a--gap-y-4">
      <div className="w3a--flex w3a--items-center w3a--justify-center">
        <p className="w3a--text-base w3a--font-medium w3a--text-app-gray-900 dark:w3a--text-app-white">Link a wallet</p>
      </div>
      <div className="w3a--flex w3a--flex-col w3a--gap-y-2">
        <ConnectWalletChainFilter isDark={isDark} isLoading={false} selectedChain={selectedChain} setSelectedChain={setSelectedChain} />
        <ConnectWalletSearch
          totalExternalWalletCount={totalExternalWalletsCount}
          isLoading={false}
          walletSearch={walletSearch}
          handleWalletSearch={handleWalletSearch}
        />
        <ConnectWalletList
          externalButtons={externalButtons}
          isLoading={false}
          totalExternalWalletsCount={totalExternalWalletsCount}
          initialWalletCount={initialWalletCount}
          handleWalletClick={handleWalletClick}
          handleMoreWallets={handleMoreWallets}
          isDark={isDark}
          walletConnectUri=""
          isShowAllWallets={isShowAllWallets}
        />
      </div>
    </div>
  );
}

export default LinkWallet;
