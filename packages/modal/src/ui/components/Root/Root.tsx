import { WALLET_CONNECTORS, type WalletRegistryItem } from "@web3auth/no-modal";
import Bowser from "bowser";
import { JSX, useCallback, useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { PAGES } from "../../constants";
import { BodyState, RootContext } from "../../context/RootContext";
import { ThemedContext } from "../../context/ThemeContext";
import { browser, ExternalButton, mobileOs, MODAL_STATUS, os, platform } from "../../interfaces";
import i18n from "../../localeImport";
import { cn, getBrowserExtensionUrl, getBrowserName, getIcons, getMobileInstallLink, getOsName } from "../../utils";
import BottomSheet from "../BottomSheet";
import ConnectWallet from "../ConnectWallet";
import ConnectWalletChainNamespaceSelect from "../ConnectWallet/ConnectWalletChainNamespaceSelect";
import Footer from "../Footer/Footer";
import Image from "../Image";
import Loader from "../Loader";
import Login from "../Login";
import { RootProps } from "./Root.type";

function Root(props: RootProps) {
  const {
    setModalState,
    modalState,
    handleExternalWalletBtnClick,
    chainNamespaces,
    walletRegistry,
    appLogo,
    onCloseLoader,
    handleSocialLoginClick,
    showPasswordLessInput,
    showExternalWalletButton,
    socialLoginsConfig,
    areSocialLoginsVisible,
    isEmailPrimary,
    isExternalPrimary,
    showExternalWalletPage,
    isEmailPasswordLessLoginVisible,
    isSmsPasswordLessLoginVisible,
    preHandleExternalWalletClick,
    uiConfig,
  } = props;

  const {
    logoAlignment,
    buttonRadiusType,
    enableMainSocialLoginButton,
    privacyPolicy,
    tncLink,
    displayInstalledExternalWallets = true,
    displayExternalWalletsCount = true,
  } = uiConfig;

  const [t] = useTranslation(undefined, { i18n });
  const { isDark } = useContext(ThemedContext);

  const [bodyState, setBodyState] = useState<BodyState>({
    showWalletDetails: false,
    walletDetails: null,
    showMultiChainSelector: false,
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
  const deviceDetails = useMemo<{ platform: platform; browser: browser; os: mobileOs }>(() => {
    const browserData = Bowser.getParser(window.navigator.userAgent);
    return {
      platform: browserData.getPlatformType() as platform,
      browser: browserData.getBrowserName().toLowerCase() as browser,
      os: browserData.getOSName() as mobileOs,
    };
  }, []);

  const mobileInstallLinks = useMemo<JSX.Element[]>(() => {
    if (deviceDetails.platform === "desktop") return [];
    const installConfig = bodyState.walletDetails?.walletRegistryItem?.app || {};
    const installLinks = Object.keys(installConfig).reduce((acc, osKey) => {
      if (!["android", "ios"].includes(osKey)) return acc;
      const appId = installConfig[osKey as mobileOs];
      if (!appId) return acc;
      const appUrl = getMobileInstallLink(osKey as mobileOs, appId);
      if (!appUrl) return acc;
      const logoLight = `${osKey}-light`;
      const logoDark = `${osKey}-dark`;
      acc.push(
        <li className="w3a--w-full">
          <a href={appUrl} rel="noopener noreferrer" target="_blank">
            <button
              type="button"
              className={cn(
                "w3a--link-arrow w3a--flex w3a--w-full w3a--items-center w3a--justify-start w3a--gap-x-2 w3a--border w3a--border-app-gray-200 w3a--bg-app-gray-50 w3a--px-5 w3a--py-2.5 hover:w3a--translate-y-[0.5px] hover:w3a--border-app-gray-50 dark:w3a--border-app-gray-500 dark:w3a--bg-app-gray-800 dark:hover:w3a--border-app-gray-800",
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
                id="device-link-arrow"
                className="w3a--icon-animation w3a--ml-auto"
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
  }, [bodyState.walletDetails?.walletRegistryItem?.app, deviceDetails.platform, isDark, t, buttonRadiusType]);

  const desktopInstallLinks = useMemo<JSX.Element[]>(() => {
    if (deviceDetails.platform !== "desktop") return [];
    // if browser is brave, use chrome extension
    const browserType = deviceDetails.browser === "brave" ? "chrome" : deviceDetails.browser;

    const browserExtensionConfig = bodyState.walletDetails?.walletRegistryItem?.app || {};
    const extensionForCurrentBrowser =
      browserExtensionConfig.browser && browserExtensionConfig.browser.includes(browserType) ? browserExtensionConfig.browser : undefined;
    const browserExtensionId = browserExtensionConfig[browserType as keyof typeof browserExtensionConfig] || extensionForCurrentBrowser;
    const browserExtensionUrl = browserExtensionId ? getBrowserExtensionUrl(browserType, browserExtensionId) : null;
    const installLink = browserExtensionUrl ? (
      <li>
        <a href={browserExtensionUrl} rel="noopener noreferrer" target="_blank">
          <button
            type="button"
            className={cn(
              "w3a--link-arrow w3a--flex w3a--w-full w3a--items-center w3a--justify-start w3a--gap-x-2 w3a--border w3a--border-app-gray-200 w3a--bg-app-gray-50 w3a--px-5 w3a--py-2.5 hover:w3a--translate-y-[0.5px] hover:w3a--border-app-gray-50 dark:w3a--border-app-gray-500 dark:w3a--bg-app-gray-800 dark:hover:w3a--border-app-gray-800",
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
              id="device-link-arrow"
              className="w3a--icon-animation w3a--ml-auto"
              src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")}
              alt="arrow"
            />
          </button>
        </a>
      </li>
    ) : null;
    return [installLink, ...mobileInstallLinks];
  }, [
    bodyState.walletDetails?.walletRegistryItem?.app,
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
      const connectorConfig = config[connector];

      if (!connectorConfig.showOnModal) {
        canShowMap[connector] = false;
        return;
      }

      if (deviceDetails.platform === "desktop" && connectorConfig.showOnDesktop) {
        canShowMap[connector] = true;
        return;
      }

      if ((deviceDetails.platform === "mobile" || deviceDetails.platform === "tablet") && connectorConfig.showOnMobile) {
        canShowMap[connector] = true;
        return;
      }

      canShowMap[connector] = false;
    });
    return canShowMap;
  }, [deviceDetails, config]);

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

        const registryNamespaces = new Set(walletRegistryItem.chains?.map((chain) => chain.split(":")[0]));
        const injectedChainNamespaces = new Set(walletRegistryItem.injected?.map((injected) => injected.namespace));
        const availableChainNamespaces = chainNamespaces.filter((x) => registryNamespaces.has(x) || injectedChainNamespaces.has(x));
        const connector = config[wallet];
        const button: ExternalButton = {
          name: wallet,
          displayName: walletRegistryItem.name,
          href,
          hasInjectedWallet: connector?.isInjected || false,
          hasWalletConnect: isWalletConnectConnectorIncluded && walletRegistryItem.walletConnect?.sdks?.includes("sign_v2"),
          hasInstallLinks: Object.keys(walletRegistryItem.app || {}).length > 0,
          walletRegistryItem,
          imgExtension: walletRegistryItem.imgExtension || "svg",
          icon: connector?.icon,
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

  const installedConnectorButtons = useMemo(() => {
    const installedConnectors = Object.keys(config).reduce((acc, connector) => {
      if ([WALLET_CONNECTORS.WALLET_CONNECT_V2].includes(connector) || !connectorVisibilityMap[connector]) return acc;

      // determine chain namespaces based on wallet registry
      const walletRegistryItem = walletRegistry.default[connector];
      const registryNamespaces = new Set(walletRegistryItem?.chains?.map((chain) => chain.split(":")[0]));
      const injectedChainNamespaces = new Set(walletRegistryItem?.injected?.map((injected) => injected.namespace));
      const availableChainNamespaces = chainNamespaces.filter((x) => registryNamespaces.has(x) || injectedChainNamespaces.has(x));

      acc.push({
        name: connector,
        displayName: config[connector].label || connector,
        hasInjectedWallet: config[connector]?.isInjected || false,
        hasWalletConnect: false,
        hasInstallLinks: false,
        walletRegistryItem,
        icon: config[connector]?.icon,
        chainNamespaces: availableChainNamespaces,
      });
      return acc;
    }, [] as ExternalButton[]);

    // make metamask the first button and limit the number of buttons
    return installedConnectors;
  }, [config, connectorVisibilityMap, walletRegistry.default, chainNamespaces]);

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

  const allButtons = useMemo(() => {
    return [...generateWalletButtons(walletRegistry.default), ...generateWalletButtons(walletRegistry.others)];
  }, [generateWalletButtons, walletRegistry.default, walletRegistry.others]);

  const totalExternalWallets = useMemo(() => {
    const uniqueWalletSet = new Set();
    return allButtons.concat(installedConnectorButtons).filter((button) => {
      if (uniqueWalletSet.has(button.name)) return false;
      uniqueWalletSet.add(button.name);
      return true;
    }).length;
  }, [allButtons, installedConnectorButtons]);

  const handleSocialLoginHeight = () => {
    setIsSocialLoginsExpanded((prev) => !prev);
  };

  const handleWalletDetailsHeight = () => {
    setIsWalletDetailsExpanded((prev) => !prev);
  };

  const containerMaxHeight = useMemo(() => {
    if (isWalletDetailsExpanded) {
      return "588px";
    }
    if (modalState.currentPage === PAGES.CONNECT_WALLET || isSocialLoginsExpanded) {
      return privacyPolicy || tncLink || enableMainSocialLoginButton ? "750px" : "700px";
    }
    if (installedConnectorButtons.length === 1) {
      if (privacyPolicy || tncLink) {
        return enableMainSocialLoginButton ? "600px" : "560px";
      }
      return enableMainSocialLoginButton ? "570px" : "530px";
    }
    if (installedConnectorButtons.length > 1) {
      const maxHeight = 500 + (installedConnectorButtons.length - 1) * 58;
      if (privacyPolicy || tncLink) {
        return `${maxHeight + (enableMainSocialLoginButton ? 120 : 60)}px`;
      }
      return `${maxHeight + (enableMainSocialLoginButton ? 66 : 16)}px`;
    }
    return "539px";
  }, [
    isWalletDetailsExpanded,
    modalState.currentPage,
    isSocialLoginsExpanded,
    installedConnectorButtons,
    privacyPolicy,
    tncLink,
    enableMainSocialLoginButton,
  ]);

  const contextValue = useMemo(
    () => ({
      bodyState,
      setBodyState,
    }),
    [bodyState, setBodyState]
  );

  return (
    <RootContext.Provider value={contextValue}>
      <div className="w3a--flex w3a--flex-col">
        <div
          className="w3a--relative w3a--h-screen w3a--overflow-hidden w3a--transition-all w3a--duration-[400ms] w3a--ease-in-out"
          style={{
            maxHeight: containerMaxHeight,
          }}
        >
          <div className="w3a--modal-curtain" />
          <div className="w3a--relative w3a--flex w3a--h-full w3a--flex-1 w3a--flex-col w3a--p-6">
            {/* Content */}
            {modalState.status !== MODAL_STATUS.INITIALIZED ? (
              <Loader
                connector={modalState.detailedLoaderConnector}
                connectorName={modalState.detailedLoaderConnectorName}
                modalStatus={modalState.status}
                onClose={onCloseLoader}
                appLogo={appLogo}
              />
            ) : (
              <>
                {modalState.currentPage === PAGES.LOGIN && showExternalWalletPage && modalState.status === MODAL_STATUS.INITIALIZED && (
                  <Login
                    isModalVisible={modalState.modalVisibility}
                    isDark={isDark}
                    appLogo={appLogo}
                    showPasswordLessInput={showPasswordLessInput}
                    showExternalWalletButton={showExternalWalletButton}
                    showExternalWalletCount={displayExternalWalletsCount}
                    showInstalledExternalWallets={displayInstalledExternalWallets}
                    socialLoginsConfig={socialLoginsConfig}
                    areSocialLoginsVisible={areSocialLoginsVisible}
                    isEmailPrimary={isEmailPrimary}
                    isExternalPrimary={isExternalPrimary}
                    installedExternalWalletConfig={topInstalledConnectorButtons}
                    isEmailPasswordLessLoginVisible={isEmailPasswordLessLoginVisible}
                    isSmsPasswordLessLoginVisible={isSmsPasswordLessLoginVisible}
                    totalExternalWallets={totalExternalWallets}
                    logoAlignment={logoAlignment}
                    buttonRadius={buttonRadiusType}
                    enableMainSocialLoginButton={enableMainSocialLoginButton}
                    handleSocialLoginClick={handleSocialLoginClick}
                    handleExternalWalletBtnClick={onExternalWalletBtnClick}
                    handleSocialLoginHeight={handleSocialLoginHeight}
                    handleExternalWalletClick={preHandleExternalWalletClick}
                  />
                )}
                {modalState.currentPage === PAGES.CONNECT_WALLET && !showExternalWalletPage && modalState.status === MODAL_STATUS.INITIALIZED && (
                  <ConnectWallet
                    isDark={isDark}
                    walletConnectUri={modalState.walletConnectUri}
                    config={modalState.externalWalletsConfig}
                    walletRegistry={walletRegistry}
                    allExternalButtons={allButtons}
                    connectorVisibilityMap={connectorVisibilityMap}
                    customConnectorButtons={customConnectorButtons}
                    deviceDetails={{
                      platform: deviceDetails.platform,
                      browser: deviceDetails.browser,
                      os: deviceDetails.os as os,
                    }}
                    chainNamespace={chainNamespaces}
                    buttonRadius={buttonRadiusType}
                    handleWalletDetailsHeight={handleWalletDetailsHeight}
                    onBackClick={onBackClick}
                    handleExternalWalletClick={preHandleExternalWalletClick}
                  />
                )}
              </>
            )}

            {/* Footer */}
            <Footer privacyPolicy={privacyPolicy} termsOfService={tncLink} />

            {/* Multi Chain Selector */}
            {bodyState.showMultiChainSelector && (
              <BottomSheet isShown={bodyState.showMultiChainSelector} onClose={() => setBodyState({ showMultiChainSelector: false })}>
                <ConnectWalletChainNamespaceSelect
                  isDark={isDark}
                  wallet={bodyState.walletDetails}
                  handleExternalWalletClick={(params) => {
                    preHandleExternalWalletClick(params);
                    setBodyState({ showMultiChainSelector: false });
                  }}
                />
              </BottomSheet>
            )}

            {/* Wallet Install Links */}
            {bodyState.showWalletDetails && (
              <BottomSheet isShown={bodyState.showWalletDetails} onClose={() => setBodyState({ showWalletDetails: false })}>
                <div className="w3a--my-4 w3a--flex w3a--justify-center">
                  <Image
                    imageId={`login-${bodyState.walletDetails.name}`}
                    hoverImageId={`login-${bodyState.walletDetails.name}`}
                    fallbackImageId="wallet"
                    height="80"
                    width="80"
                    isButton
                    extension={bodyState.walletDetails.imgExtension}
                  />
                </div>
                <ul className="w3a--flex w3a--flex-col w3a--gap-y-2">
                  {deviceDetails.platform === "desktop" ? desktopInstallLinks : mobileInstallLinks}
                </ul>
              </BottomSheet>
            )}
          </div>
        </div>
      </div>
    </RootContext.Provider>
  );
}

export default Root;
