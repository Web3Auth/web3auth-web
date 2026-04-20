import { type BaseConnectorConfig, type ChainNamespaceType, WALLET_CONNECTORS, type WalletRegistry } from "@web3auth/no-modal";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { ExternalButton } from "../interfaces";

export interface UseWalletFilteringParams {
  allRegistryButtons: ExternalButton[];
  customConnectorButtons: ExternalButton[];
  connectorVisibilityMap: Record<string, boolean>;
  externalWalletsConfig: Record<string, BaseConnectorConfig>;
  walletRegistry: WalletRegistry;
}

export interface UseWalletFilteringResult {
  walletDiscoverySupported: boolean;
  allUniqueButtons: ExternalButton[];
  externalButtons: ExternalButton[];
  totalExternalWalletsCount: number;
  initialWalletCount: number;
  walletSearch: string;
  handleWalletSearch: (e: FormEvent<HTMLInputElement>) => void;
  selectedChain: string;
  setSelectedChain: (chain: string) => void;
  isShowAllWallets: boolean;
  handleMoreWallets: () => void;
}

export function useWalletFiltering(params: UseWalletFilteringParams): UseWalletFilteringResult {
  const { allRegistryButtons, customConnectorButtons, connectorVisibilityMap, externalWalletsConfig, walletRegistry } = params;

  const [walletSearch, setWalletSearch] = useState("");
  const [selectedChain, setSelectedChain] = useState("all");
  const [isShowAllWallets, setIsShowAllWallets] = useState(false);

  const config = useMemo(() => externalWalletsConfig ?? {}, [externalWalletsConfig]);

  const walletDiscoverySupported = useMemo(
    () => walletRegistry && (Object.keys(walletRegistry.default || {}).length > 0 || Object.keys(walletRegistry.others || {}).length > 0),
    [walletRegistry]
  );

  const allUniqueButtons = useMemo(() => {
    const seen = new Set<string>();
    return customConnectorButtons.concat(allRegistryButtons).filter((button) => {
      if (seen.has(button.name)) return false;
      seen.add(button.name);
      return true;
    });
  }, [allRegistryButtons, customConnectorButtons]);

  const defaultButtonKeys = useMemo(() => new Set(Object.keys(walletRegistry.default)), [walletRegistry]);

  const defaultButtons = useMemo(() => {
    const buttons = [
      ...allRegistryButtons.filter((button) => button.hasInjectedWallet && defaultButtonKeys.has(button.name)),
      ...customConnectorButtons,
      ...allRegistryButtons.filter((button) => !button.hasInjectedWallet && defaultButtonKeys.has(button.name)),
    ].sort((a, b) => {
      if (a.name === WALLET_CONNECTORS.METAMASK && b.name === WALLET_CONNECTORS.METAMASK) {
        if (a.isInstalled) return -1;
        if (b.isInstalled) return 1;
        if (a.hasInjectedWallet) return -1;
        if (b.hasInjectedWallet) return 1;
        return 0;
      }
      if (a.name === WALLET_CONNECTORS.METAMASK) return -1;
      if (b.name === WALLET_CONNECTORS.METAMASK) return 1;
      return 0;
    });

    const seen = new Set<string>();
    return buttons
      .filter((button) => {
        if (seen.has(button.name)) return false;
        seen.add(button.name);
        return true;
      })
      .filter((button) => selectedChain === "all" || button.chainNamespaces?.includes(selectedChain as ChainNamespaceType));
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
      return [...allUniqueButtons.filter((button) => button.hasInjectedWallet), ...allUniqueButtons.filter((button) => !button.hasInjectedWallet)]
        .sort((a) => (a.name === WALLET_CONNECTORS.METAMASK ? -1 : 1))
        .filter((button) => selectedChain === "all" || button.chainNamespaces?.includes(selectedChain as ChainNamespaceType))
        .filter((button) => button.name.toLowerCase().includes(walletSearch.toLowerCase()));
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

  useEffect(() => {
    if (walletDiscoverySupported && totalExternalWalletsCount <= 15) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional
      setIsShowAllWallets(true);
    } else {
      setIsShowAllWallets(false);
    }
  }, [walletDiscoverySupported, selectedChain, totalExternalWalletsCount]);

  const handleWalletSearch = useCallback((e: FormEvent<HTMLInputElement>) => {
    setWalletSearch((e.target as HTMLInputElement).value);
  }, []);

  const handleMoreWallets = useCallback(() => {
    setIsShowAllWallets(true);
  }, []);

  return {
    walletDiscoverySupported,
    allUniqueButtons,
    externalButtons,
    totalExternalWalletsCount,
    initialWalletCount,
    walletSearch,
    handleWalletSearch,
    selectedChain,
    setSelectedChain,
    isShowAllWallets,
    handleMoreWallets,
  };
}
