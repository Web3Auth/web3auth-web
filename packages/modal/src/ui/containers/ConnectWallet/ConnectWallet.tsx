import { ANALYTICS_EVENTS, log, WALLET_CONNECTORS } from "@web3auth/no-modal";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { CONNECT_WALLET_PAGES, PAGES } from "../../constants";
import { AnalyticsContext } from "../../context/AnalyticsContext";
import { useModalState } from "../../context/ModalStateContext";
import { useBodyState } from "../../context/RootContext";
import { useWidget } from "../../context/WidgetContext";
import { useWalletFiltering } from "../../hooks/useWalletFiltering";
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
  const { walletConnectUri, metamaskConnectUri } = modalState;

  const {
    allUniqueButtons,
    externalButtons,
    totalExternalWalletsCount,
    initialWalletCount,
    walletSearch,
    handleWalletSearch,
    selectedChain,
    setSelectedChain: handleChainFilterChange,
    isShowAllWallets,
    handleMoreWallets,
  } = useWalletFiltering({
    allRegistryButtons,
    customConnectorButtons,
    connectorVisibilityMap,
    externalWalletsConfig: modalState.externalWalletsConfig,
    walletRegistry,
  });

  const [currentPage, setCurrentPage] = useState(CONNECT_WALLET_PAGES.CONNECT_WALLET);
  const [selectedWallet, setSelectedWallet] = useState(false);
  const [isLoading] = useState<boolean>(false);
  const [selectedButton, setSelectedButton] = useState<ExternalButton>(null);
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

  // Handle pre-selected wallet from Login page (e.g., MetaMask QR code flow)
  useEffect(() => {
    if (bodyState.preSelectedWallet) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional
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
      if (button.chainNamespaces?.length > 1 && button.name !== WALLET_CONNECTORS.METAMASK) {
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
