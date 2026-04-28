import { WALLET_CONNECTORS, type WalletRegistryItem } from "@web3auth/no-modal";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

import Footer from "../../components/Footer/Footer";
import Loader from "../../components/Loader";
import Toast from "../../components/Toast";
import { DEFAULT_METAMASK_WALLET_REGISTRY_ITEM, PAGES, WALLET_CONNECT_LOGO } from "../../constants";
import { useModalState } from "../../context/ModalStateContext";
import { RootProvider } from "../../context/RootContext";
import { useWidget } from "../../context/WidgetContext";
import { ACCOUNT_LINKING_STATUS, ExternalButton, MODAL_STATUS } from "../../interfaces";
import ConnectWallet from "../ConnectWallet";
import ConnectWalletQrCode from "../ConnectWallet/ConnectWalletQrCode";
import Login from "../Login";
import { RootProps } from "./Root.type";
import RootBodySheets from "./RootBodySheets/RootBodySheets";

function RootContent(props: RootProps) {
  const { onCloseLoader } = props;

  const { modalState, shouldShowLoginPage, showPasswordLessInput, areSocialLoginsVisible } = useModalState();
  const {
    deviceDetails,
    isDark,
    uiConfig,
    isConnectAndSignAuthenticationMode,
    handleMobileVerifyConnect,
    handleAcceptConsent,
    handleDeclineConsent,
  } = useWidget();
  const { chainNamespaces, walletRegistry, privacyPolicy, tncLink, displayInstalledExternalWallets, hideSuccessScreen, consentRequired } = uiConfig;

  const contentRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(530);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const updateHeight = () => {
      const elToMeasure = contentRef.current;
      if (!elToMeasure) return;
      const fullHeight = elToMeasure.scrollHeight;
      if (fullHeight > 0) setContainerHeight(Math.ceil(fullHeight));
    };
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updateHeight);
    });
    observer.observe(el);
    // Run initial measurement after layout so scrollHeight includes full content (e.g. footer)
    requestAnimationFrame(updateHeight);
    return () => observer.disconnect();
  }, []);

  // External Wallets
  const config = useMemo(() => modalState.externalWalletsConfig, [modalState.externalWalletsConfig]);

  const connectorVisibilityMap = useMemo(() => {
    const canShowMap: Record<string, boolean> = {};

    Object.keys(config).forEach((connector) => {
      canShowMap[connector] = Boolean(config[connector]?.showOnModal);
    });
    return canShowMap;
  }, [config]);

  const isWalletConnectConnectorIncluded = useMemo(
    // WC is always included when enabling wallet discovery
    () => Object.keys(walletRegistry?.default || {}).length > 0 || Object.keys(walletRegistry?.others || {}).length > 0,
    [walletRegistry]
  );

  const generateWalletButtons = useCallback(
    (wallets: Record<string, WalletRegistryItem>): ExternalButton[] => {
      return Object.keys(wallets).reduce((acc, wallet) => {
        if (connectorVisibilityMap[wallet] === false) return acc;

        const walletRegistryItem: WalletRegistryItem = wallets[wallet];
        let href = "";
        if (deviceDetails.platform !== "desktop") {
          const universalLink = walletRegistryItem?.mobile?.universal;
          const deepLink = walletRegistryItem?.mobile?.native;
          href = universalLink || deepLink;
        }

        // determine the chain namespaces supported by the wallet
        const connectorConfig = config[wallet];
        const connectorChainNamespaces = connectorConfig?.chainNamespaces || [];
        const registryNamespaces = new Set(walletRegistryItem.chains?.map((chain) => chain.split(":")[0]));
        const injectedChainNamespaces = new Set(walletRegistryItem.injected?.map((injected) => injected.namespace));
        const availableChainNamespaces = chainNamespaces.filter(
          (x) => registryNamespaces.has(x) || injectedChainNamespaces.has(x) || connectorChainNamespaces.includes(x)
        );

        const button: ExternalButton = {
          name: wallet,
          displayName: walletRegistryItem.name,
          href,
          hasInjectedWallet: connectorConfig?.isInjected || false,
          isInstalled: !!connectorConfig,
          hasWalletConnect: isWalletConnectConnectorIncluded && walletRegistryItem.walletConnect?.sdks?.includes("sign_v2"),
          hasInstallLinks: Object.keys(walletRegistryItem.app || {}).length > 0,
          walletRegistryItem,
          imgExtension: walletRegistryItem.imgExtension || "svg",
          icon: connectorConfig?.icon,
          chainNamespaces: availableChainNamespaces,
        };

        if (!button.hasInjectedWallet && !button.hasWalletConnect && !button.hasInstallLinks) return acc;
        if (availableChainNamespaces.length === 0) return acc;

        acc.push(button);
        return acc;
      }, [] as ExternalButton[]);
    },
    [connectorVisibilityMap, chainNamespaces, config, deviceDetails.platform, isWalletConnectConnectorIncluded]
  );

  const allRegistryButtons = useMemo(() => {
    return [...generateWalletButtons(walletRegistry.default), ...generateWalletButtons(walletRegistry.others)];
  }, [generateWalletButtons, walletRegistry.default, walletRegistry.others]);

  const installedConnectorButtons = useMemo(() => {
    const installedConnectors = Object.keys(config).reduce((acc, connector) => {
      if (connector === WALLET_CONNECTORS.WALLET_CONNECT_V2 || !connectorVisibilityMap[connector]) return acc;
      const connectorConfig = config[connector];
      acc.push({
        name: connector,
        displayName: connectorConfig?.label || connector,
        hasInjectedWallet: connectorConfig?.isInjected || false,
        isInstalled: true,
        hasWalletConnect: false,
        hasInstallLinks: false,
        icon: connectorConfig?.icon,
        chainNamespaces: connectorConfig?.chainNamespaces || [],
      });
      return acc;
    }, [] as ExternalButton[]);

    // if metamask connector is not injected, use the registry button instead to display QR code
    const metamaskConnectorIdx = installedConnectors.findIndex((x) => x.name === WALLET_CONNECTORS.METAMASK && !x.hasInjectedWallet);
    if (metamaskConnectorIdx !== -1) {
      const metamaskConnector = installedConnectors[metamaskConnectorIdx];
      let metamaskRegistryButton = allRegistryButtons.find((button) => button.name === WALLET_CONNECTORS.METAMASK);
      if (!metamaskRegistryButton) {
        // use the default metamask registry item if it's not in the registry
        metamaskRegistryButton = generateWalletButtons({
          [WALLET_CONNECTORS.METAMASK]: DEFAULT_METAMASK_WALLET_REGISTRY_ITEM,
        })[0];
      }
      if (metamaskRegistryButton) {
        installedConnectors.splice(metamaskConnectorIdx, 1, {
          ...metamaskRegistryButton,
          chainNamespaces: metamaskConnector.chainNamespaces, // preserve the chain namespaces
          isInstalled: true,
        });
      }
    }

    // make metamask the first button and limit the number of buttons
    return installedConnectors;
  }, [allRegistryButtons, config, connectorVisibilityMap, generateWalletButtons]);

  const customConnectorButtons = useMemo(() => {
    return installedConnectorButtons.filter((button) => !button.hasInjectedWallet);
  }, [installedConnectorButtons]);

  const topInstalledConnectorButtons = useMemo(() => {
    const MAX_TOP_INSTALLED_CONNECTORS = 3;

    // make metamask the first button and limit the number of buttons
    return installedConnectorButtons
      .sort((a, _) => (a.name === WALLET_CONNECTORS.METAMASK ? -1 : 1))
      .slice(0, displayInstalledExternalWallets ? MAX_TOP_INSTALLED_CONNECTORS : 1);
  }, [installedConnectorButtons, displayInstalledExternalWallets]);

  const allExternalWallets = useMemo(() => {
    const uniqueButtonSet = new Set();
    return installedConnectorButtons.concat(allRegistryButtons).filter((button) => {
      if (uniqueButtonSet.has(button.name)) return false;
      uniqueButtonSet.add(button.name);
      return true;
    });
  }, [allRegistryButtons, installedConnectorButtons]);

  const remainingUndisplayedWallets = useMemo(() => {
    return allExternalWallets.filter((button) => {
      return !topInstalledConnectorButtons.includes(button);
    }).length;
  }, [allExternalWallets, topInstalledConnectorButtons]);

  const isExternalWalletModeOnly = useMemo(() => {
    return !showPasswordLessInput && !areSocialLoginsVisible;
  }, [areSocialLoginsVisible, showPasswordLessInput]);

  const isWalletConnectAccountLinkingVisible = useMemo(() => {
    return modalState.accountLinking.active && modalState.accountLinking.connectorName === WALLET_CONNECTORS.WALLET_CONNECT_V2;
  }, [modalState.accountLinking.active, modalState.accountLinking.connectorName]);

  const accountLinkingButton = useMemo<ExternalButton>(
    () => ({
      name: WALLET_CONNECTORS.WALLET_CONNECT_V2,
      displayName: "WalletConnect",
      hasInjectedWallet: false,
      hasWalletConnect: true,
      hasInstallLinks: false,
      imgExtension: "svg",
    }),
    []
  );

  const accountLinkingMessage = useMemo(() => {
    switch (modalState.accountLinking.status) {
      case ACCOUNT_LINKING_STATUS.INITIALIZING:
        return "Initializing WalletConnect...";
      case ACCOUNT_LINKING_STATUS.AWAITING_CONNECTION:
        return modalState.accountLinking.walletConnectUri
          ? "Scan the QR code with a WalletConnect-compatible wallet."
          : "Preparing WalletConnect QR code...";
      case ACCOUNT_LINKING_STATUS.WALLET_CONNECTED:
        return "Wallet connected. Preparing account linking...";
      case ACCOUNT_LINKING_STATUS.LINKING:
        return "Linking wallet...";
      case ACCOUNT_LINKING_STATUS.COMPLETED:
        return "Wallet linked.";
      case ACCOUNT_LINKING_STATUS.ERRORED:
        return modalState.accountLinking.errorMessage || "Failed to connect with WalletConnect.";
      default:
        return "";
    }
  }, [modalState.accountLinking.errorMessage, modalState.accountLinking.status, modalState.accountLinking.walletConnectUri]);

  const isShowLoader = useMemo(() => {
    return !isWalletConnectAccountLinkingVisible && modalState.status !== MODAL_STATUS.INITIALIZED;
  }, [isWalletConnectAccountLinkingVisible, modalState.status]);

  const isConsentRequiringStatus = modalState.status === MODAL_STATUS.CONSENT_REQUIRING;

  return (
    <div className="w3a--relative w3a--flex w3a--flex-col">
      <div
        className="w3a-modal-container w3a--relative w3a--flex w3a--flex-col w3a--overflow-hidden"
        style={{
          height: containerHeight,
        }}
      >
        <div className="w3a--modal-curtain" />
        <div
          ref={contentRef}
          className={twMerge(
            "w3a--relative w3a--flex w3a--flex-col w3a--p-6",
            isShowLoader && !isConsentRequiringStatus ? "w3a--flex-1" : "w3a--flex-none"
          )}
        >
          {/* Content */}
          {isShowLoader ? (
            <Loader
              connector={modalState.detailedLoaderConnector}
              connectorName={modalState.detailedLoaderConnectorName}
              modalStatus={modalState.status}
              onClose={onCloseLoader}
              isConnectAndSignAuthenticationMode={isConnectAndSignAuthenticationMode}
              externalWalletsConfig={modalState.externalWalletsConfig}
              handleMobileVerifyConnect={handleMobileVerifyConnect}
              hideSuccessScreen={hideSuccessScreen}
              onAcceptConsent={handleAcceptConsent}
              onDeclineConsent={handleDeclineConsent}
              privacyPolicy={privacyPolicy}
              tncLink={tncLink}
            />
          ) : (
            <>
              {isWalletConnectAccountLinkingVisible && (
                <div className="w3a--flex w3a--flex-1 w3a--flex-col w3a--gap-y-4">
                  <div className="w3a--flex w3a--items-center w3a--justify-center">
                    <p className="w3a--text-base w3a--font-medium w3a--text-app-gray-900 dark:w3a--text-app-white">WalletConnect</p>
                  </div>
                  {modalState.accountLinking.status === ACCOUNT_LINKING_STATUS.ERRORED ? (
                    <div className="w3a--rounded-2xl w3a--border w3a--border-app-gray-200 w3a--bg-app-gray-50 w3a--p-4 dark:w3a--border-app-gray-700 dark:w3a--bg-app-gray-800">
                      <p className="w3a--text-center w3a--text-sm w3a--text-app-gray-700 dark:w3a--text-app-gray-200">{accountLinkingMessage}</p>
                    </div>
                  ) : (
                    <ConnectWalletQrCode
                      qrCodeValue={modalState.accountLinking.walletConnectUri}
                      isDark={isDark}
                      selectedButton={accountLinkingButton}
                      logoImage={WALLET_CONNECT_LOGO}
                      platform={deviceDetails.platform}
                    />
                  )}
                  {accountLinkingMessage && modalState.accountLinking.status !== ACCOUNT_LINKING_STATUS.ERRORED && (
                    <p className="w3a--text-center w3a--text-sm w3a--text-app-gray-500 dark:w3a--text-app-gray-300">{accountLinkingMessage}</p>
                  )}
                </div>
              )}
              {/* Login Screen */}
              {!isWalletConnectAccountLinkingVisible &&
                modalState.currentPage === PAGES.LOGIN_OPTIONS &&
                shouldShowLoginPage &&
                modalState.status === MODAL_STATUS.INITIALIZED && (
                  <Login
                    installedExternalWalletConfig={topInstalledConnectorButtons}
                    totalExternalWallets={allExternalWallets.length}
                    remainingUndisplayedWallets={remainingUndisplayedWallets}
                  />
                )}
              {/* Connect Wallet Screen */}
              {!isWalletConnectAccountLinkingVisible &&
                modalState.currentPage === PAGES.WALLET_LIST &&
                (!shouldShowLoginPage || isExternalWalletModeOnly) &&
                modalState.status === MODAL_STATUS.INITIALIZED && (
                  <ConnectWallet
                    allRegistryButtons={allRegistryButtons}
                    connectorVisibilityMap={connectorVisibilityMap}
                    customConnectorButtons={customConnectorButtons}
                    isExternalWalletModeOnly={isExternalWalletModeOnly}
                  />
                )}
            </>
          )}

          {/* Footer */}
          <Footer
            privacyPolicy={!consentRequired && modalState.status !== MODAL_STATUS.CONSENT_REQUIRING ? privacyPolicy : undefined}
            termsOfService={!consentRequired && modalState.status !== MODAL_STATUS.CONSENT_REQUIRING ? tncLink : undefined}
          />

          <RootBodySheets />
        </div>
      </div>
      <Toast />
    </div>
  );
}

function Root(props: RootProps) {
  return (
    <RootProvider>
      <RootContent {...props} />
    </RootProvider>
  );
}
export default Root;
