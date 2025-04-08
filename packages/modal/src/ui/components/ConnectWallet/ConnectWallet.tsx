import { type ChainNamespaceType, WALLET_CONNECTORS } from "@web3auth/no-modal";
import { FormEvent, useContext, useMemo, useState } from "react";

import { CONNECT_WALLET_PAGES } from "../../constants";
import { RootContext } from "../../context/RootContext";
import { ExternalButton } from "../../interfaces";
import { ConnectWalletProps } from "./ConnectWallet.type";
import ConnectWalletChainFilter from "./ConnectWalletChainFilter";
import ConnectWalletHeader from "./ConnectWalletHeader";
import ConnectWalletList from "./ConnectWalletList";
import ConnectWalletQrCode from "./ConnectWalletQrCode";
import ConnectWalletSearch from "./ConnectWalletSearch";

function ConnectWallet(props: ConnectWalletProps) {
  const {
    isDark,
    config,
    walletConnectUri,
    walletRegistry,
    allExternalButtons,
    customConnectorButtons,
    connectorVisibilityMap,
    deviceDetails,
    buttonRadius = "pill",
    chainNamespace,
    onBackClick,
    handleExternalWalletClick,
    handleWalletDetailsHeight,
  } = props;

  const { bodyState, setBodyState, toast, setToast } = useContext(RootContext);

  const [currentPage, setCurrentPage] = useState(CONNECT_WALLET_PAGES.CONNECT_WALLET);
  const [selectedWallet, setSelectedWallet] = useState(false);
  const [isLoading] = useState<boolean>(false);
  const [selectedButton, setSelectedButton] = useState<ExternalButton>(null);
  const [walletSearch, setWalletSearch] = useState<string>("");
  const [selectedChain, setSelectedChain] = useState<string>("all");
  const [isShowAllWallets, setIsShowAllWallets] = useState<boolean>(false);

  const handleBack = () => {
    if (!selectedWallet && currentPage === CONNECT_WALLET_PAGES.CONNECT_WALLET && onBackClick) {
      onBackClick(false);
      return;
    }

    if (selectedWallet) {
      setCurrentPage(CONNECT_WALLET_PAGES.CONNECT_WALLET);
      setSelectedWallet(false);
      handleWalletDetailsHeight();
    }
  };

  const walletDiscoverySupported = useMemo(() => {
    const supported = walletRegistry && Object.keys(walletRegistry.default || {}).length > 0 && Object.keys(walletRegistry.others || {}).length > 0;
    return supported;
  }, [walletRegistry]);

  const allUniqueButtons = useMemo(() => {
    const uniqueButtonSet = new Set();
    return allExternalButtons.concat(customConnectorButtons).filter((button) => {
      if (uniqueButtonSet.has(button.name)) return false;
      uniqueButtonSet.add(button.name);
      return true;
    });
  }, [allExternalButtons, customConnectorButtons]);

  const defaultButtonKeys = useMemo(() => new Set(Object.keys(walletRegistry.default)), [walletRegistry]);

  const defaultButtons = useMemo(() => {
    // display order: default injected buttons > custom adapter buttons > default non-injected buttons
    const buttons = [
      ...allExternalButtons.filter((button) => button.hasInjectedWallet && defaultButtonKeys.has(button.name)),
      ...customConnectorButtons,
      ...allExternalButtons.filter((button) => !button.hasInjectedWallet && defaultButtonKeys.has(button.name)),
    ];

    const buttonSet = new Set();
    return buttons
      .filter((button) => {
        if (buttonSet.has(button.name)) return false;
        buttonSet.add(button.name);
        return true;
      })
      .filter((button) => selectedChain === "all" || button.chainNamespaces?.includes(selectedChain as ChainNamespaceType));
  }, [allExternalButtons, customConnectorButtons, defaultButtonKeys, selectedChain]);

  const installedWalletButtons = useMemo(() => {
    const visibilityMap = connectorVisibilityMap;
    return Object.keys(config).reduce((acc, adapter) => {
      if (![WALLET_CONNECTORS.WALLET_CONNECT_V2].includes(adapter) && visibilityMap[adapter]) {
        acc.push({
          name: adapter,
          displayName: config[adapter].label || adapter,
          hasInjectedWallet: config[adapter].isInjected,
          hasWalletConnect: false,
          hasInstallLinks: false,
        });
      }
      return acc;
    }, [] as ExternalButton[]);
  }, [connectorVisibilityMap, config]);

  const handleWalletSearch = (e: FormEvent<HTMLInputElement>) => {
    const searchValue = (e.target as HTMLInputElement).value;
    setWalletSearch(searchValue);
  };

  const handleChainFilterChange = (chain: string) => {
    setSelectedChain(chain);
    setIsShowAllWallets(false);
  };

  const filteredButtons = useMemo(() => {
    if (walletDiscoverySupported) {
      return allUniqueButtons
        .filter((button) => selectedChain === "all" || button.chainNamespaces.includes(selectedChain as ChainNamespaceType))
        .filter((button) => button.name.toLowerCase().includes(walletSearch.toLowerCase()));
    }
    return installedWalletButtons;
  }, [walletDiscoverySupported, installedWalletButtons, walletSearch, allUniqueButtons, selectedChain]);

  const externalButtons = useMemo(() => {
    if (walletDiscoverySupported && !walletSearch && !isShowAllWallets) {
      return defaultButtons;
    }
    return filteredButtons;
  }, [walletDiscoverySupported, walletSearch, filteredButtons, defaultButtons, isShowAllWallets]);

  const totalExternalWalletsCount = useMemo(() => filteredButtons.length, [filteredButtons]);

  const initialWalletCount = useMemo(() => {
    if (isShowAllWallets) return totalExternalWalletsCount;
    return walletDiscoverySupported ? defaultButtons.length : installedWalletButtons.length;
  }, [walletDiscoverySupported, defaultButtons, installedWalletButtons, isShowAllWallets, totalExternalWalletsCount]);

  const handleWalletClick = (button: ExternalButton) => {
    // show chain namespace selector if the button is an injected connector with multiple chain namespaces
    const isChainNamespaceSelectorRequired = button.hasInjectedWallet && button.chainNamespaces?.length > 1;
    if (isChainNamespaceSelectorRequired) {
      setBodyState({
        ...bodyState,
        showMultiChainSelector: true,
        walletDetails: button,
      });
      return;
    }

    const isInjectedConnectorAndSingleChainNamespace = button.hasInjectedWallet && button.chainNamespaces?.length === 1;
    // if doesn't have wallet connect & doesn't have install links, must be a custom connector
    const isCustomConnector = !button.hasInjectedWallet && !button.hasWalletConnect && !button.hasInstallLinks;
    if (isInjectedConnectorAndSingleChainNamespace || isCustomConnector) {
      return handleExternalWalletClick({ connector: button.name });
    }

    if (button.hasWalletConnect || !isInjectedConnectorAndSingleChainNamespace) {
      setSelectedButton(button);
      setSelectedWallet(true);
      setCurrentPage(CONNECT_WALLET_PAGES.SELECTED_WALLET);
      handleWalletDetailsHeight();
    } else {
      setBodyState({
        ...bodyState,
        showWalletDetails: true,
        walletDetails: button,
      });
    }
  };

  const handleMoreWallets = () => {
    setIsShowAllWallets(true);
  };

  return (
    <div className="w3a--relative w3a--flex w3a--flex-1 w3a--flex-col w3a--gap-y-4">
      {/* Header */}
      <ConnectWalletHeader onBackClick={handleBack} currentPage={currentPage} selectedButton={selectedButton} />
      {/* Body */}
      {selectedWallet ? (
        <ConnectWalletQrCode
          toast={toast}
          setToast={setToast}
          walletConnectUri={walletConnectUri}
          isDark={isDark}
          selectedButton={selectedButton}
          bodyState={bodyState}
          primaryColor={selectedButton.walletRegistryItem?.primaryColor}
          logoImage={`https://images.web3auth.io/login-${selectedButton.name}.${selectedButton.imgExtension}`}
          setBodyState={setBodyState}
        />
      ) : (
        <div className="w3a--flex w3a--flex-col w3a--gap-y-2">
          <ConnectWalletChainFilter
            isDark={isDark}
            isLoading={isLoading}
            selectedChain={selectedChain}
            setSelectedChain={handleChainFilterChange}
            chainNamespace={chainNamespace}
          />
          {/* Search Input */}
          <ConnectWalletSearch
            totalExternalWalletCount={totalExternalWalletsCount}
            isLoading={isLoading}
            walletSearch={walletSearch}
            handleWalletSearch={handleWalletSearch}
            buttonRadius={buttonRadius}
          />
          {/* Wallet List */}
          <ConnectWalletList
            externalButtons={externalButtons}
            isLoading={isLoading}
            totalExternalWalletsCount={totalExternalWalletsCount}
            initialWalletCount={initialWalletCount}
            handleWalletClick={handleWalletClick}
            handleMoreWallets={handleMoreWallets}
            isDark={isDark}
            deviceDetails={deviceDetails}
            walletConnectUri={walletConnectUri}
            buttonRadius={buttonRadius}
          />
        </div>
      )}
    </div>
  );
}

export default ConnectWallet;
