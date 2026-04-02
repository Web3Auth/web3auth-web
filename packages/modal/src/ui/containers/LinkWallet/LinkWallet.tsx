import { type BaseConnectorConfig, type ChainNamespaceType, log, WALLET_CONNECTORS } from "@web3auth/no-modal";
import { FormEvent, useCallback, useMemo, useState } from "react";

import { useWidget } from "../../context/WidgetContext";
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

  const [step, setStep] = useState<LinkWalletStep>("wallet_list");
  const [stepError, setStepError] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<ExternalButton | null>(null);
  const [walletSearch, setWalletSearch] = useState("");
  const [selectedChain, setSelectedChain] = useState("all");
  const [isShowAllWallets, setIsShowAllWallets] = useState(false);

  const config = useMemo(() => props.externalWalletsConfig ?? {}, [props.externalWalletsConfig]);

  const walletDiscoverySupported = useMemo(
    () => walletRegistry && (Object.keys(walletRegistry.default || {}).length > 0 || Object.keys(walletRegistry.others || {}).length > 0),
    [walletRegistry]
  );

  const allUniqueButtons = useMemo(() => {
    const seen = new Set<string>();
    return customConnectorButtons.concat(allRegistryButtons).filter((b: ExternalButton) => {
      if (seen.has(b.name)) return false;
      seen.add(b.name);
      return true;
    });
  }, [allRegistryButtons, customConnectorButtons]);

  const defaultButtonKeys = useMemo(() => new Set(Object.keys(walletRegistry.default)), [walletRegistry]);

  const defaultButtons = useMemo(() => {
    const buttons = [
      ...allRegistryButtons.filter((b: ExternalButton) => b.hasInjectedWallet && defaultButtonKeys.has(b.name)),
      ...customConnectorButtons,
      ...allRegistryButtons.filter((b: ExternalButton) => !b.hasInjectedWallet && defaultButtonKeys.has(b.name)),
    ].sort((a: ExternalButton, b: ExternalButton) => {
      if (a.name === WALLET_CONNECTORS.METAMASK && b.name !== WALLET_CONNECTORS.METAMASK) return -1;
      if (b.name === WALLET_CONNECTORS.METAMASK && a.name !== WALLET_CONNECTORS.METAMASK) return 1;
      return 0;
    });

    const seen = new Set<string>();
    return buttons
      .filter((b: ExternalButton) => {
        if (seen.has(b.name)) return false;
        seen.add(b.name);
        return true;
      })
      .filter((b: ExternalButton) => selectedChain === "all" || b.chainNamespaces?.includes(selectedChain as ChainNamespaceType));
  }, [allRegistryButtons, customConnectorButtons, defaultButtonKeys, selectedChain]);

  const installedWalletButtons = useMemo(() => {
    return Object.keys(config).reduce((acc: ExternalButton[], connector: string) => {
      if (connector !== WALLET_CONNECTORS.WALLET_CONNECT_V2 && connectorVisibilityMap[connector]) {
        acc.push({
          name: connector,
          displayName: config[connector].label || connector,
          hasInjectedWallet: config[connector].isInjected || false,
          hasWalletConnect: false,
          hasInstallLinks: false,
        });
      }
      return acc;
    }, []);
  }, [config, connectorVisibilityMap]);

  const filteredButtons = useMemo(() => {
    if (walletDiscoverySupported) {
      return [
        ...allUniqueButtons.filter((b: ExternalButton) => b.hasInjectedWallet),
        ...allUniqueButtons.filter((b: ExternalButton) => !b.hasInjectedWallet),
      ]
        .sort((a: ExternalButton) => (a.name === WALLET_CONNECTORS.METAMASK ? -1 : 1))
        .filter((b: ExternalButton) => selectedChain === "all" || b.chainNamespaces?.includes(selectedChain as ChainNamespaceType))
        .filter((b: ExternalButton) => b.name.toLowerCase().includes(walletSearch.toLowerCase()));
    }
    return installedWalletButtons;
  }, [walletDiscoverySupported, installedWalletButtons, walletSearch, allUniqueButtons, selectedChain]);

  const externalButtons = useMemo(() => {
    if (walletDiscoverySupported && !walletSearch && !isShowAllWallets) return defaultButtons;
    return filteredButtons;
  }, [walletDiscoverySupported, walletSearch, filteredButtons, defaultButtons, isShowAllWallets]);

  const totalExternalWalletsCount = filteredButtons.length;

  const initialWalletCount = useMemo(() => {
    if (isShowAllWallets) return totalExternalWalletsCount;
    return walletDiscoverySupported ? defaultButtons.length : installedWalletButtons.length;
  }, [walletDiscoverySupported, defaultButtons, installedWalletButtons, isShowAllWallets, totalExternalWalletsCount]);

  const handleWalletSearch = useCallback((e: FormEvent<HTMLInputElement>) => {
    setWalletSearch((e.target as HTMLInputElement).value);
  }, []);

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

  const handleMoreWallets = useCallback(() => {
    setIsShowAllWallets(true);
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
        onSimulateSuccess={() => {
          setStepError(false);
          setStep("sign_verify");
        }}
        onSimulateError={() => setStepError(true)}
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
        onSimulateSuccess={() => {
          setStepError(false);
          setStep("success");
        }}
        onSimulateError={() => setStepError(true)}
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
