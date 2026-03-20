import { ANALYTICS_EVENTS, type ChainNamespaceType, log, type WALLET_CONNECTOR_TYPE, WALLET_CONNECTORS } from "@web3auth/no-modal";
import { FormEvent, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { CONNECT_WALLET_PAGES, PAGES } from "../../constants";
import { AnalyticsContext } from "../../context/AnalyticsContext";
import { useModalState } from "../../context/ModalStateContext";
import { useBodyState } from "../../context/RootContext";
import { useWidget } from "../../context/WidgetContext";
import { ExternalButton } from "../../interfaces";
import { ConnectWalletProps } from "./ConnectWallet.type";
import ConnectWalletChainFilter from "./ConnectWalletChainFilter";
import ConnectWalletHeader from "./ConnectWalletHeader";
import ConnectWalletList from "./ConnectWalletList";
import ConnectWalletQrCode from "./ConnectWalletQrCode";
import ConnectWalletSearch from "./ConnectWalletSearch";

function ConnectWallet(props: ConnectWalletProps) {
  const { allRegistryButtons, customConnectorButtons, connectorVisibilityMap, isExternalWalletModeOnly } = props;

  const { bodyState, setBodyState } = useBodyState();
  const { analytics } = useContext(AnalyticsContext);
  const { deviceDetails, isDark, uiConfig } = useWidget();
  const { walletRegistry } = uiConfig;
  const { modalState, setModalState, handleShowExternalWallets, preHandleExternalWalletClick: handleExternalWalletClick } = useModalState();
  const { externalWalletsConfig: config, walletConnectUri, metamaskConnectUri } = modalState;

  const [currentPage, setCurrentPage] = useState(CONNECT_WALLET_PAGES.CONNECT_WALLET);
  const [selectedWallet, setSelectedWallet] = useState(false);
  const [isLoading] = useState<boolean>(false);
  const [selectedButton, setSelectedButton] = useState<ExternalButton>(null);
  const [walletSearch, setWalletSearch] = useState<string>("");
  const [selectedChain, setSelectedChain] = useState<string>("all");
  const [isShowAllWallets, setIsShowAllWallets] = useState<boolean>(false);
  // Track if user came directly from Login page with a pre-selected wallet
  const [isPreSelectedFromLogin, setIsPreSelectedFromLogin] = useState(false);

  const onBackClick = useCallback(
    (flag: boolean) => {
      setModalState({
        ...modalState,
        currentPage: PAGES.LOGIN_OPTIONS,
      });
      handleShowExternalWallets(flag);
    },
    [modalState, setModalState, handleShowExternalWallets]
  );

  const handleBack = () => {
    if (!selectedWallet && currentPage === CONNECT_WALLET_PAGES.CONNECT_WALLET && onBackClick) {
      onBackClick(false);
      return;
    }

    if (selectedWallet) {
      // If user came from Login page with pre-selected wallet, go back to Login
      if (isPreSelectedFromLogin && onBackClick) {
        setSelectedWallet(false);
        setIsPreSelectedFromLogin(false);
        onBackClick(false);
        return;
      }
      // Otherwise, go back to wallet list
      setCurrentPage(CONNECT_WALLET_PAGES.CONNECT_WALLET);
      setSelectedWallet(false);
    }
  };

  const disableBackButton = useMemo(() => {
    return bodyState.installLinks?.show || bodyState.multiChainSelector?.show;
  }, [bodyState.installLinks?.show, bodyState.multiChainSelector?.show]);

  const walletDiscoverySupported = useMemo(() => {
    const supported = walletRegistry && (Object.keys(walletRegistry.default || {}).length > 0 || Object.keys(walletRegistry.others || {}).length > 0);
    return supported;
  }, [walletRegistry]);

  const allUniqueButtons = useMemo(() => {
    const uniqueButtonSet = new Set();
    return customConnectorButtons.concat(allRegistryButtons).filter((button) => {
      if (uniqueButtonSet.has(button.name)) return false;
      uniqueButtonSet.add(button.name);
      return true;
    });
  }, [allRegistryButtons, customConnectorButtons]);

  const defaultButtonKeys = useMemo(() => new Set(Object.keys(walletRegistry.default)), [walletRegistry]);

  const defaultButtons = useMemo(() => {
    // display order: default injected buttons > custom adapter buttons > default non-injected buttons
    const buttons = [
      ...allRegistryButtons.filter((button) => button.hasInjectedWallet && defaultButtonKeys.has(button.name)),
      ...customConnectorButtons,
      ...allRegistryButtons.filter((button) => !button.hasInjectedWallet && defaultButtonKeys.has(button.name)),
    ].sort((a, b) => {
      // favor MetaMask over other wallets
      if (a.name === WALLET_CONNECTORS.METAMASK && b.name === WALLET_CONNECTORS.METAMASK) {
        // favor installed MetaMask over non-installed MetaMask
        if (a.isInstalled) return -1;
        if (b.isInstalled) return 1;
        // favor injected MetaMask over non-injected MetaMask
        if (a.hasInjectedWallet) return -1;
        if (b.hasInjectedWallet) return 1;
        return 0;
      }
      if (a.name === WALLET_CONNECTORS.METAMASK) return -1;
      if (b.name === WALLET_CONNECTORS.METAMASK) return 1;
      return 0;
    });

    const buttonSet = new Set();
    return buttons
      .filter((button) => {
        if (buttonSet.has(button.name)) return false;
        buttonSet.add(button.name);
        return true;
      })
      .filter((button) => selectedChain === "all" || button.chainNamespaces?.includes(selectedChain as ChainNamespaceType));
  }, [allRegistryButtons, customConnectorButtons, defaultButtonKeys, selectedChain]);

  const installedWalletButtons = useMemo(() => {
    const visibilityMap = connectorVisibilityMap;
    return Object.keys(config).reduce((acc, localConnector) => {
      if (localConnector !== WALLET_CONNECTORS.WALLET_CONNECT_V2 && visibilityMap[localConnector]) {
        acc.push({
          name: localConnector,
          displayName: config[localConnector as WALLET_CONNECTOR_TYPE].label || localConnector,
          hasInjectedWallet: config[localConnector as WALLET_CONNECTOR_TYPE].isInjected,
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
  };

  const filteredButtons = useMemo(() => {
    if (walletDiscoverySupported) {
      return [...allUniqueButtons.filter((button) => button.hasInjectedWallet), ...allUniqueButtons.filter((button) => !button.hasInjectedWallet)]
        .sort((a, _) => (a.name === WALLET_CONNECTORS.METAMASK ? -1 : 1))
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

  // Automatically show all wallets if there are less than or equal to 15 wallets
  // also resets everytime we search causing no. of wallets to change or select different chain
  useEffect(() => {
    if (walletDiscoverySupported && totalExternalWalletsCount <= 15) {
      setIsShowAllWallets(true);
    } else {
      setIsShowAllWallets(false);
    }
  }, [walletDiscoverySupported, selectedChain, totalExternalWalletsCount]);

  // Handle pre-selected wallet from Login page (e.g., MetaMask QR code flow)
  useEffect(() => {
    if (bodyState.preSelectedWallet) {
      setSelectedButton(bodyState.preSelectedWallet);
      setSelectedWallet(true);
      setCurrentPage(CONNECT_WALLET_PAGES.SELECTED_WALLET);
      setIsPreSelectedFromLogin(true);
      // Clear pre-selected wallet after handling
      setBodyState((prev) => ({
        ...prev,
        preSelectedWallet: null,
      }));
    }
  }, [bodyState.preSelectedWallet, setBodyState]);

  /**
   * Wallet click logic
   * - For installed wallets
   *  - For MetaMask non-injected on desktop, show QR code for connection
   *  - Ask user to select a chain namespace if it has multiple namespaces
   *  - Otherwise, use their connectors to connect
   * - For wallet-discovery wallets (not installed)
   *  - On desktop, show QR code for connection if wallet connect v2 is supported, otherwise show install links
   *  - On mobile, open deeplink with wallet connect uri (won't go into this function as it'll open the deeplink)
   */
  const handleWalletClick = (button: ExternalButton) => {
    analytics?.track(ANALYTICS_EVENTS.EXTERNAL_WALLET_SELECTED, {
      connector: button.isInstalled ? button.name : button.hasWalletConnect ? WALLET_CONNECTORS.WALLET_CONNECT_V2 : "",
      wallet_name: button.displayName,
      is_installed: button.isInstalled,
      is_injected: button.hasInjectedWallet,
      chain_namespaces: button.chainNamespaces,
      has_wallet_connect: button.hasWalletConnect,
      has_install_links: button.hasInstallLinks,
      has_wallet_registry_item: !!button.walletRegistryItem,
      total_external_wallets: allUniqueButtons.length,
    });
    log.info("handleWalletClick", button);

    // for installed wallets
    if (button.isInstalled) {
      // for MetaMask non-injected on desktop, show QR code for connection
      if (button.name === WALLET_CONNECTORS.METAMASK && !button.hasInjectedWallet && deviceDetails.platform === "desktop") {
        handleExternalWalletClick({ connector: button.name });
        setSelectedButton(button);
        setSelectedWallet(true);
        setCurrentPage(CONNECT_WALLET_PAGES.SELECTED_WALLET);
        return;
      }

      // show chain namespace selector if the button has multiple chain namespaces
      if (button.chainNamespaces?.length > 1) {
        setBodyState({
          ...bodyState,
          multiChainSelector: {
            show: true,
            wallet: button,
          },
        });
        return;
      }

      // otherwise, use their connectors to connect
      handleExternalWalletClick({ connector: button.name });
      return;
    } else {
      // show QR code if wallet connect v2 is supported
      if (button.hasWalletConnect) {
        setSelectedButton(button);
        setSelectedWallet(true);
        setCurrentPage(CONNECT_WALLET_PAGES.SELECTED_WALLET);
      } else {
        // otherwise, show install links
        setBodyState({
          ...bodyState,
          installLinks: {
            show: true,
            wallet: button,
          },
        });
      }
    }
  };

  const handleMoreWallets = () => {
    setIsShowAllWallets(true);
  };

  const qrCodeValue = useMemo(() => {
    if (!selectedWallet) return null;

    if (selectedButton.name === WALLET_CONNECTORS.METAMASK && !selectedButton.hasInjectedWallet) {
      return metamaskConnectUri;
    }
    return walletConnectUri;
  }, [metamaskConnectUri, selectedButton, selectedWallet, walletConnectUri]);

  const hideBackButton = useMemo(() => {
    // If wallet is selected, show the back button
    if (selectedWallet) return false;
    // Otherwise, if external wallet mode only, login screen is skipped so back button is not needed
    if (isExternalWalletModeOnly) return true;
    return false;
  }, [selectedWallet, isExternalWalletModeOnly]);

  return (
    <div className="w3a--relative w3a--flex w3a--flex-1 w3a--flex-col w3a--gap-y-4">
      {/* Header */}
      <ConnectWalletHeader
        hideBackButton={hideBackButton}
        disableBackButton={disableBackButton}
        onBackClick={handleBack}
        currentPage={currentPage}
        selectedButton={selectedButton}
      />
      {/* Body */}
      {selectedWallet ? (
        <ConnectWalletQrCode
          qrCodeValue={qrCodeValue}
          isDark={isDark}
          selectedButton={selectedButton}
          primaryColor={selectedButton.walletRegistryItem?.primaryColor}
          logoImage={`https://images.web3auth.io/login-${selectedButton.name}.${selectedButton.imgExtension}`}
          platform={deviceDetails.platform}
        />
      ) : (
        <div className="w3a--flex w3a--flex-col w3a--gap-y-2">
          <ConnectWalletChainFilter isDark={isDark} isLoading={isLoading} selectedChain={selectedChain} setSelectedChain={handleChainFilterChange} />
          {/* Search Input */}
          <ConnectWalletSearch
            totalExternalWalletCount={totalExternalWalletsCount}
            isLoading={isLoading}
            walletSearch={walletSearch}
            handleWalletSearch={handleWalletSearch}
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
            walletConnectUri={walletConnectUri}
            isShowAllWallets={isShowAllWallets}
          />
        </div>
      )}
    </div>
  );
}

export default ConnectWallet;
