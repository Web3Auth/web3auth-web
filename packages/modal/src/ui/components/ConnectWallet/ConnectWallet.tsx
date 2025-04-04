import { type ChainNamespaceType, WALLET_CONNECTORS } from "@web3auth/no-modal";
import { FormEvent, useContext, useEffect, useMemo, useState } from "react";

import { CONNECT_WALLET_PAGES } from "../../constants";
import { RootContext } from "../../context/RootContext";
import { ExternalButton } from "../../interfaces";
import { ConnectWalletProps } from "./ConnectWallet.type";
import ConnectWalletChainFilter from "./ConnectWalletChainFilter";
import ConnectWalletHeader from "./ConnectWalletHeader";
import ConnectWalletList from "./ConnectWalletList";
import ConnectWalletQrCode from "./ConnectWalletQrCode";
import ConnectWalletSearch from "./ConnectWalletSearch";

const WALLET_LIMIT_COUNT = 10;

function ConnectWallet(props: ConnectWalletProps) {
  const {
    isDark,
    onBackClick,
    handleExternalWalletClick,
    config,
    walletConnectUri,
    walletRegistry,
    allExternalButtons,
    totalExternalWallets,
    customAdapterButtons,
    adapterVisibilityMap,
    deviceDetails,
    handleWalletDetailsHeight,
    buttonRadius = "pill",
    chainNamespace,
  } = props;

  const { bodyState, setBodyState } = useContext(RootContext);

  const [currentPage, setCurrentPage] = useState(CONNECT_WALLET_PAGES.CONNECT_WALLET);
  const [selectedWallet, setSelectedWallet] = useState(false);
  const [externalButtons, setExternalButtons] = useState<ExternalButton[]>([]);
  const [totalExternalWalletsCount, setTotalExternalWalletsCount] = useState<number>(0);
  const [selectedButton, setSelectedButton] = useState<ExternalButton>(null);
  const [walletSearch, setWalletSearch] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedChain, setSelectedChain] = useState<string>("all");
  const [initialWalletCount, setInitialWalletCount] = useState<number>(0);

  const handleBack = () => {
    if (!selectedWallet && currentPage === CONNECT_WALLET_PAGES.CONNECT_WALLET && onBackClick) {
      onBackClick(false);
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
    return allExternalButtons.concat(customAdapterButtons).filter((button) => {
      if (uniqueButtonSet.has(button.name)) return false;
      uniqueButtonSet.add(button.name);
      return true;
    });
  }, [allExternalButtons, customAdapterButtons]);

  const filteredButtons = (searchValue: string) => {
    return allUniqueButtons.filter((button) => button.name.toLowerCase().includes(searchValue.toLowerCase()));
  };

  const defaultButtonKeys = useMemo(() => new Set(Object.keys(walletRegistry.default)), [walletRegistry]);

  const sortedButtons = useMemo(() => {
    // display order: default injected buttons > custom adapter buttons > default non-injected buttons
    const buttons = [
      ...allExternalButtons.filter((button) => button.hasInjectedWallet && defaultButtonKeys.has(button.name)),
      ...customAdapterButtons,
      ...allExternalButtons.filter((button) => !button.hasInjectedWallet && defaultButtonKeys.has(button.name)),
    ];

    const buttonSet = new Set();
    return buttons.filter((button) => {
      if (buttonSet.has(button.name)) return false;
      buttonSet.add(button.name);
      return true;
    });
  }, [allExternalButtons, customAdapterButtons, defaultButtonKeys]);

  const visibleButtons = useMemo(() => {
    const visibilityMap = adapterVisibilityMap;
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
  }, [adapterVisibilityMap, config]);

  const handleWalletSearch = (e: FormEvent<HTMLInputElement>) => {
    const searchValue = (e.target as HTMLInputElement).value;
    setWalletSearch(searchValue);
    if (searchValue) {
      setExternalButtons(filteredButtons(searchValue));
    } else {
      setExternalButtons(sortedButtons);
    }
    setInitialWalletCount(sortedButtons.length);
  };

  useEffect(() => {
    if (walletDiscoverySupported) {
      setExternalButtons(sortedButtons);
      setInitialWalletCount(sortedButtons.length);
      setTotalExternalWalletsCount(totalExternalWallets);
    } else {
      setExternalButtons(visibleButtons);
      setTotalExternalWalletsCount(visibleButtons.length);
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 0);
  }, [walletDiscoverySupported, sortedButtons, visibleButtons, totalExternalWallets]);

  const handleWalletClick = (button: ExternalButton) => {
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
    // setIsLoading(true);
    setInitialWalletCount((prev) => prev + 10);
    const buttons = allUniqueButtons.slice(initialWalletCount, initialWalletCount + WALLET_LIMIT_COUNT);
    setExternalButtons((prev) => [...prev, ...buttons]);
    setInitialWalletCount((prev) => prev + WALLET_LIMIT_COUNT);
  };

  const handleChainFilterChange = (chain: string) => {
    setInitialWalletCount(0);
    setSelectedChain(chain);
    if (chain === "all") {
      setExternalButtons(sortedButtons.slice(0, WALLET_LIMIT_COUNT));
      setTotalExternalWalletsCount(sortedButtons.length);
    } else {
      const filteredButtons = sortedButtons.filter((button) => button.chainNamespaces.includes(chain as ChainNamespaceType));
      setExternalButtons(filteredButtons.slice(0, WALLET_LIMIT_COUNT));
      setTotalExternalWalletsCount(filteredButtons.length);
    }
  };

  return (
    <div className="w3a--relative w3a--flex w3a--flex-1 w3a--flex-col w3a--gap-y-4">
      {/* Header */}
      <ConnectWalletHeader onBackClick={handleBack} currentPage={currentPage} selectedButton={selectedButton} />
      {/* Body */}
      {selectedWallet ? (
        <ConnectWalletQrCode
          walletConnectUri={walletConnectUri}
          isDark={isDark}
          selectedButton={selectedButton}
          bodyState={bodyState}
          primaryColor={selectedButton.walletRegistryItem?.primaryColor}
          logoImage={`https://images.web3auth.io/login-${selectedButton.name}.${selectedButton.imgExtension}`}
          setBodyState={setBodyState}
          handleExternalWalletClick={handleExternalWalletClick}
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
