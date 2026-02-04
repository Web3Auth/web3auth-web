import { WALLET_CONNECTORS, type WalletRegistryItem } from "@web3auth/no-modal";
import { JSX, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CONNECT_WALLET_PAGES, DEFAULT_METAMASK_WALLET_REGISTRY_ITEM, PAGES } from "../../constants";
import { useModalState } from "../../context/ModalStateContext";
import { BodyState, RootContext } from "../../context/RootContext";
import { useWidget } from "../../context/WidgetContext";
import { ExternalButton, mobileOs, MODAL_STATUS, TOAST_TYPE, ToastType } from "../../interfaces";
import i18n from "../../localeImport";
import { cn, getBrowserExtensionUrl, getBrowserName, getIcons, getMobileInstallLink, getOsName } from "../../utils";
import BottomSheet from "../BottomSheet";
import ConnectWallet from "../ConnectWallet";
import ConnectWalletChainNamespaceSelect from "../ConnectWallet/ConnectWalletChainNamespaceSelect";
import ConnectWalletHeader from "../ConnectWallet/ConnectWalletHeader";
import ConnectWalletQrCode from "../ConnectWallet/ConnectWalletQrCode";
import Footer from "../Footer/Footer";
import Image from "../Image";
import Loader from "../Loader";
import Login from "../Login";
import Toast from "../Toast";
import { RootProps } from "./Root.type";

function Root(props: RootProps) {
  const {
    handleExternalWalletBtnClick,
    handleMobileVerifyConnect,
    onCloseLoader,
    handleSocialLoginClick,
    preHandleExternalWalletClick,
    isConnectAndSignAuthenticationMode,
  } = props;

  const { modalState, setModalState, showExternalWalletPage, showPasswordLessInput, areSocialLoginsVisible } = useModalState();
  const { isDark, appLogo, chainNamespaces, walletRegistry, deviceDetails, uiConfig } = useWidget();

  const { buttonRadiusType, privacyPolicy = "", tncLink = "", displayInstalledExternalWallets = true, hideSuccessScreen = false } = uiConfig;

  const [t] = useTranslation(undefined, { i18n });

  const [bodyState, setBodyState] = useState<BodyState>({
    metamaskQrCode: {
      show: false,
      wallet: null,
    },
    installLinks: {
      show: false,
      wallet: null,
    },
    multiChainSelector: {
      show: false,
      wallet: null,
    },
  });

  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  }>({
    message: "",
    type: TOAST_TYPE.SUCCESS,
  });

  const [isSocialLoginsExpanded, setIsSocialLoginsExpanded] = useState(false);
  const [isWalletDetailsExpanded, setIsWalletDetailsExpanded] = useState(false);

  const onExternalWalletBtnClick = (flag: boolean) => {
    setModalState({
      ...modalState,
      currentPage: PAGES.CONNECT_WALLET,
    });
    if (handleExternalWalletBtnClick) handleExternalWalletBtnClick(flag);
  };

  const onBackClick = (flag: boolean) => {
    setModalState({
      ...modalState,
      currentPage: PAGES.LOGIN,
    });
    if (handleExternalWalletBtnClick) handleExternalWalletBtnClick(flag);
  };

  // Wallet Details
  const mobileInstallLinks = useMemo<JSX.Element[]>(() => {
    if (deviceDetails.platform === "desktop") return [];
    const installConfig = bodyState.installLinks?.wallet?.walletRegistryItem?.app || {};
    const installLinks = Object.keys(installConfig).reduce((acc, osKey) => {
      if (!["android", "ios"].includes(osKey)) return acc;
      const appId = installConfig[osKey as mobileOs];
      if (!appId) return acc;
      const appUrl = getMobileInstallLink(osKey as mobileOs, appId);
      if (!appUrl) return acc;
      const logoLight = `${osKey}-light`;
      const logoDark = `${osKey}-dark`;
      acc.push(
        <li key={appUrl} className="w3a--w-full">
          <a href={appUrl} rel="noopener noreferrer" target="_blank">
            <button
              type="button"
              className={cn(
                "w3a--group w3a--relative w3a--overflow-hidden w3a--h-11 w3a--flex w3a--w-full w3a--items-center w3a--justify-start w3a--gap-x-2 w3a--border w3a--border-app-gray-200 w3a--bg-app-gray-50 w3a--px-5 w3a--py-2.5 hover:w3a--translate-y-[0.5px] hover:w3a--border-app-gray-50 dark:w3a--border-app-gray-500 dark:w3a--bg-app-gray-800 dark:hover:w3a--border-app-gray-800",
                {
                  "w3a--rounded-full": buttonRadiusType === "pill",
                  "w3a--rounded-lg": buttonRadiusType === "rounded",
                  "w3a--rounded-none": buttonRadiusType === "square",
                }
              )}
            >
              <Image
                imageId={logoLight}
                darkImageId={logoDark}
                hoverImageId={logoLight}
                darkHoverImageId={logoDark}
                height="28"
                width="28"
                isButton
              />
              <span className="w3a--text-sm w3a--font-medium w3a--text-app-gray-900 dark:w3a--text-app-white">
                {t("modal.external.install-mobile-app", { os: getOsName(osKey as mobileOs) })}
              </span>
              <img
                id="install-links-arrow"
                className="w3a--absolute w3a--right-4 w3a--top-1/2 -w3a--translate-x-6 -w3a--translate-y-1/2 w3a--opacity-0 w3a--transition-all w3a--duration-300
          group-hover:w3a--translate-x-0 group-hover:w3a--opacity-100"
                src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")}
                alt="arrow"
              />
            </button>
          </a>
        </li>
      );
      return acc;
    }, []);
    return installLinks;
  }, [bodyState.installLinks?.wallet?.walletRegistryItem?.app, deviceDetails.platform, isDark, t, buttonRadiusType]);

  const desktopInstallLinks = useMemo<JSX.Element[]>(() => {
    if (deviceDetails.platform !== "desktop") return [];
    // if browser is brave, use chrome extension
    const browserType = deviceDetails.browser === "brave" ? "chrome" : deviceDetails.browser;

    const browserExtensionConfig = bodyState.installLinks?.wallet?.walletRegistryItem?.app || {};
    const extensionForCurrentBrowser =
      browserExtensionConfig.browser && browserExtensionConfig.browser.includes(browserType) ? browserExtensionConfig.browser : undefined;
    const browserExtensionId = browserExtensionConfig[browserType as keyof typeof browserExtensionConfig] || extensionForCurrentBrowser;
    const browserExtensionUrl = browserExtensionId ? getBrowserExtensionUrl(browserType, browserExtensionId) : null;
    const installLink = browserExtensionUrl ? (
      <li key={browserExtensionUrl}>
        <a href={browserExtensionUrl} rel="noopener noreferrer" target="_blank">
          <button
            type="button"
            className={cn(
              "w3a--group w3a--relative w3a--overflow-hidden w3a--h-11 w3a--flex w3a--w-full w3a--items-center w3a--justify-start w3a--gap-x-2 w3a--border w3a--border-app-gray-200 w3a--bg-app-gray-50 w3a--px-5 w3a--py-2.5 hover:w3a--translate-y-[0.5px] hover:w3a--border-app-gray-50 dark:w3a--border-app-gray-500 dark:w3a--bg-app-gray-800 dark:hover:w3a--border-app-gray-800",
              {
                "w3a--rounded-full": buttonRadiusType === "pill",
                "w3a--rounded-lg": buttonRadiusType === "rounded",
                "w3a--rounded-none": buttonRadiusType === "square",
              }
            )}
          >
            <Image
              imageId={deviceDetails.browser}
              darkImageId={deviceDetails.browser}
              hoverImageId={deviceDetails.browser}
              darkHoverImageId={deviceDetails.browser}
              height="30"
              width="30"
              isButton
            />
            <span className="w3a--text-sm w3a--font-medium w3a--text-app-gray-900 dark:w3a--text-app-white">
              {t("modal.external.install-browser-extension", { browser: getBrowserName(deviceDetails.browser) })}
            </span>
            <img
              id="install-links-arrow"
              className="w3a--absolute w3a--right-4 w3a--top-1/2 -w3a--translate-x-6 -w3a--translate-y-1/2 w3a--opacity-0 w3a--transition-all w3a--duration-300
          group-hover:w3a--translate-x-0 group-hover:w3a--opacity-100"
              src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")}
              alt="arrow"
            />
          </button>
        </a>
      </li>
    ) : null;
    return [installLink, ...mobileInstallLinks];
  }, [
    bodyState.installLinks?.wallet?.walletRegistryItem?.app,
    deviceDetails.browser,
    deviceDetails.platform,
    isDark,
    mobileInstallLinks,
    buttonRadiusType,
    t,
  ]);

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

  const handleSocialLoginHeight = () => {
    setIsSocialLoginsExpanded((prev) => !prev);
  };

  const handleWalletDetailsHeight = () => {
    setIsWalletDetailsExpanded((prev) => !prev);
  };

  const containerMaxHeight = useMemo(() => {
    const isPrivacyPolicyOrTncLink = privacyPolicy || tncLink;

    // Loader Screen
    if (modalState.status !== MODAL_STATUS.INITIALIZED) {
      return "530px";
    }

    // Wallet Details Screen
    if (isWalletDetailsExpanded) {
      return isPrivacyPolicyOrTncLink ? "680px" : "628px";
    }

    // MetaMask QR Code Screen
    if (bodyState.metamaskQrCode?.show) {
      return isPrivacyPolicyOrTncLink ? "680px" : "628px";
    }

    // Connect Wallet Screen
    if (modalState.currentPage === PAGES.CONNECT_WALLET) {
      return isPrivacyPolicyOrTncLink ? "640px" : "580px";
    }

    // Expanded Social Login Screen
    if (isSocialLoginsExpanded) {
      return isPrivacyPolicyOrTncLink ? "644px" : "588px";
    }

    // Only MetaMask
    if (topInstalledConnectorButtons.length === 1) {
      return isPrivacyPolicyOrTncLink ? "560px" : "530px";
    }

    // More than 1 connector
    if (topInstalledConnectorButtons.length > 1) {
      const maxHeight = 500 + (topInstalledConnectorButtons.length - 1) * 58;
      if (isPrivacyPolicyOrTncLink) {
        return `${maxHeight + 60}px`;
      }
      return `${maxHeight + 16}px`;
    }
    // Default
    return "539px";
  }, [
    privacyPolicy,
    tncLink,
    modalState.status,
    modalState.currentPage,
    isWalletDetailsExpanded,
    bodyState.metamaskQrCode?.show,
    isSocialLoginsExpanded,
    topInstalledConnectorButtons.length,
  ]);

  const contextValue = useMemo(
    () => ({
      bodyState,
      setBodyState,
      toast,
      setToast,
    }),
    [bodyState, setBodyState, toast, setToast]
  );

  const isShowLoader = useMemo(() => {
    return modalState.status !== MODAL_STATUS.INITIALIZED;
  }, [modalState.status]);

  return (
    <RootContext.Provider value={contextValue}>
      <div className="w3a--relative w3a--flex w3a--flex-col">
        <div
          className="w3a--relative w3a--h-screen w3a--overflow-hidden w3a--transition-all w3a--duration-[400ms] w3a--ease-in-out"
          style={{
            maxHeight: containerMaxHeight,
          }}
        >
          <div className="w3a--modal-curtain" />
          <div className="w3a--relative w3a--flex w3a--h-full w3a--flex-1 w3a--flex-col w3a--p-6">
            {/* Content */}
            {isShowLoader ? (
              <Loader
                connector={modalState.detailedLoaderConnector}
                connectorName={modalState.detailedLoaderConnectorName}
                modalStatus={modalState.status}
                onClose={onCloseLoader}
                appLogo={appLogo}
                isConnectAndSignAuthenticationMode={isConnectAndSignAuthenticationMode}
                externalWalletsConfig={modalState.externalWalletsConfig}
                walletRegistry={walletRegistry}
                handleMobileVerifyConnect={handleMobileVerifyConnect}
                hideSuccessScreen={hideSuccessScreen}
              />
            ) : (
              <>
                {/* MetaMask Connect via QR Code */}
                {bodyState.metamaskQrCode?.show ? (
                  <div className="w3a--relative w3a--flex w3a--flex-1 w3a--flex-col w3a--gap-y-4">
                    <ConnectWalletHeader
                      onBackClick={() => setBodyState({ ...bodyState, metamaskQrCode: { show: false, wallet: null } })}
                      currentPage={CONNECT_WALLET_PAGES.SELECTED_WALLET}
                      selectedButton={bodyState.metamaskQrCode.wallet}
                    />
                    <ConnectWalletQrCode
                      qrCodeValue={modalState.metamaskConnectUri}
                      isDark={isDark}
                      selectedButton={bodyState.metamaskQrCode.wallet}
                      primaryColor={bodyState.metamaskQrCode.wallet.walletRegistryItem?.primaryColor}
                      logoImage={`https://images.web3auth.io/login-${bodyState.metamaskQrCode.wallet.name}.${bodyState.metamaskQrCode.wallet.imgExtension}`}
                      platform={deviceDetails.platform}
                    />
                  </div>
                ) : (
                  <>
                    {/* Login Screen */}
                    {modalState.currentPage === PAGES.LOGIN && showExternalWalletPage && modalState.status === MODAL_STATUS.INITIALIZED && (
                      <Login
                        installedExternalWalletConfig={topInstalledConnectorButtons}
                        totalExternalWallets={allExternalWallets.length}
                        remainingUndisplayedWallets={remainingUndisplayedWallets}
                        handleSocialLoginClick={handleSocialLoginClick}
                        handleExternalWalletBtnClick={onExternalWalletBtnClick}
                        handleSocialLoginHeight={handleSocialLoginHeight}
                        handleExternalWalletClick={preHandleExternalWalletClick}
                      />
                    )}
                    {/* Connect Wallet Screen */}
                    {modalState.currentPage === PAGES.CONNECT_WALLET &&
                      (!showExternalWalletPage || isExternalWalletModeOnly) &&
                      modalState.status === MODAL_STATUS.INITIALIZED && (
                        <ConnectWallet
                          allRegistryButtons={allRegistryButtons}
                          connectorVisibilityMap={connectorVisibilityMap}
                          customConnectorButtons={customConnectorButtons}
                          handleWalletDetailsHeight={handleWalletDetailsHeight}
                          isExternalWalletModeOnly={isExternalWalletModeOnly}
                          onBackClick={onBackClick}
                          handleExternalWalletClick={preHandleExternalWalletClick}
                          disableBackButton={bodyState.installLinks?.show || bodyState.multiChainSelector?.show}
                        />
                      )}
                  </>
                )}
              </>
            )}

            {/* Footer */}
            <Footer privacyPolicy={privacyPolicy} termsOfService={tncLink} />

            {/* Multi Chain Selector */}
            {bodyState.multiChainSelector?.show && (
              <BottomSheet
                borderRadiusType={uiConfig.borderRadiusType}
                isShown={bodyState.multiChainSelector.show}
                onClose={() => setBodyState({ ...bodyState, multiChainSelector: { show: false, wallet: null } })}
              >
                <ConnectWalletChainNamespaceSelect
                  isDark={isDark}
                  wallet={bodyState.multiChainSelector.wallet}
                  handleExternalWalletClick={(params) => {
                    preHandleExternalWalletClick(params);
                    setBodyState({ ...bodyState, multiChainSelector: { show: false, wallet: null } });
                  }}
                />
              </BottomSheet>
            )}

            {/* Wallet Install Links */}
            {bodyState.installLinks?.show && (
              <BottomSheet
                borderRadiusType={uiConfig.borderRadiusType}
                isShown={bodyState.installLinks.show}
                onClose={() => setBodyState({ ...bodyState, installLinks: { show: false, wallet: null } })}
              >
                <p className="w3a--mb-2 w3a--text-center w3a--text-base w3a--font-semibold w3a--text-app-gray-900 dark:w3a--text-app-white">
                  {t("modal.getWallet")}
                </p>
                <div className="w3a--my-4 w3a--flex w3a--justify-center">
                  <Image
                    imageId={`login-${bodyState.installLinks.wallet.name}`}
                    hoverImageId={`login-${bodyState.installLinks.wallet.name}`}
                    fallbackImageId="wallet"
                    height="80"
                    width="80"
                    isButton
                    extension={bodyState.installLinks.wallet.imgExtension}
                  />
                </div>
                <ul className="w3a--flex w3a--flex-col w3a--gap-y-2">
                  {deviceDetails.platform === "desktop" ? desktopInstallLinks : mobileInstallLinks}
                </ul>
              </BottomSheet>
            )}
          </div>
        </div>
        <Toast />
      </div>
    </RootContext.Provider>
  );
}

export default Root;
