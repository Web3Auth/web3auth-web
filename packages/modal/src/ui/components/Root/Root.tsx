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
import ConnectWallet from "../ConnectWallet";
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
    chainNamespace,
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
    logoAlignment = "center",
    buttonRadiusType = "pill",
    borderRadiusType = "large",
    enableMainSocialLoginButton = false,
    privacyPolicy = "",
    tncLink = "",
    displayInstalledExternalWallets = true,
    displayExternalWalletsCount = true,
  } = uiConfig;

  const [t] = useTranslation(undefined, { i18n });
  const { isDark } = useContext(ThemedContext);

  const [bodyState, setBodyState] = useState<BodyState>({
    showWalletDetails: false,
    walletDetails: null,
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

  const adapterVisibilityMap = useMemo(() => {
    const canShowMap: Record<string, boolean> = {};

    Object.keys(config).forEach((adapter) => {
      const adapterConfig = config[adapter];

      if (!adapterConfig.showOnModal) {
        canShowMap[adapter] = false;
        return;
      }

      if (deviceDetails.platform === "desktop" && adapterConfig.showOnDesktop) {
        canShowMap[adapter] = true;
        return;
      }

      if ((deviceDetails.platform === "mobile" || deviceDetails.platform === "tablet") && adapterConfig.showOnMobile) {
        canShowMap[adapter] = true;
        return;
      }

      canShowMap[adapter] = false;
    });
    return canShowMap;
  }, [deviceDetails, config]);

  const isWalletConnectAdapterIncluded = useMemo(
    () => Object.keys(config).some((adapter) => adapter === WALLET_CONNECTORS.WALLET_CONNECT_V2),
    [config]
  );

  const generateWalletButtons = useCallback(
    (wallets: Record<string, WalletRegistryItem>): ExternalButton[] => {
      return Object.keys(wallets).reduce((acc, wallet) => {
        if (adapterVisibilityMap[wallet] === false) return acc;

        // Metamask is always visible in the main screen, no need to show it in the external wallets list
        if (wallet === WALLET_CONNECTORS.METAMASK) return acc;

        const walletRegistryItem: WalletRegistryItem = wallets[wallet];
        let href = "";
        if (deviceDetails.platform !== "desktop") {
          const universalLink = walletRegistryItem?.mobile?.universal;
          const deepLink = walletRegistryItem?.mobile?.native;
          href = universalLink || deepLink;
        }

        const registryNamespaces = new Set(walletRegistryItem.chains?.map((chain) => chain.split(":")[0]));
        const injectedChainNamespaces = new Set(walletRegistryItem.injected?.map((injected) => injected.namespace));
        const availableChainNamespaces = chainNamespace.filter((x) => registryNamespaces.has(x) || injectedChainNamespaces.has(x));

        const button: ExternalButton = {
          name: wallet,
          displayName: walletRegistryItem.name,
          href,
          hasInjectedWallet: config[wallet]?.isInjected || false,
          hasWalletConnect: isWalletConnectAdapterIncluded && walletRegistryItem.walletConnect?.sdks?.includes("sign_v2"),
          hasInstallLinks: Object.keys(walletRegistryItem.app || {}).length > 0,
          walletRegistryItem,
          imgExtension: walletRegistryItem.imgExtension || "svg",
          chainNamespaces: availableChainNamespaces,
        };

        if (!button.hasInjectedWallet && !button.hasWalletConnect && !button.hasInstallLinks) return acc;
        if (availableChainNamespaces.length === 0) return acc;

        acc.push(button);
        return acc;
      }, [] as ExternalButton[]);
    },
    [adapterVisibilityMap, chainNamespace, config, deviceDetails.platform, isWalletConnectAdapterIncluded]
  );

  const customAdapterButtons = useMemo(() => {
    return Object.keys(config).reduce((acc, adapter) => {
      // Metamask is always visible in the main screen, no need to show it in the external wallets list
      if (adapter === WALLET_CONNECTORS.METAMASK) return acc;
      if (![WALLET_CONNECTORS.WALLET_CONNECT_V2].includes(adapter) && !config[adapter].isInjected && adapterVisibilityMap[adapter]) {
        acc.push({
          name: adapter,
          displayName: config[adapter].label || adapter,
          hasInjectedWallet: false,
          hasWalletConnect: false,
          hasInstallLinks: false,
        });
      }
      return acc;
    }, [] as ExternalButton[]);
  }, [config, adapterVisibilityMap]);

  const topInstalledConnectorButtons = useMemo(() => {
    const MAX_TOP_INSTALLED_CONNECTORS = 3;
    const installedConnectors = Object.keys(config).reduce((acc, connector) => {
      if (![WALLET_CONNECTORS.WALLET_CONNECT_V2].includes(connector) && adapterVisibilityMap[connector]) {
        acc.push({
          name: connector,
          displayName: config[connector].label || connector,
          hasInjectedWallet: false,
          hasWalletConnect: false,
          hasInstallLinks: false,
        });
      }
      return acc;
    }, [] as ExternalButton[]);

    // make metamask the first button and limit the number of buttons
    return installedConnectors
      .sort((a, _) => (a.name === WALLET_CONNECTORS.METAMASK ? -1 : 1))
      .slice(0, displayInstalledExternalWallets ? MAX_TOP_INSTALLED_CONNECTORS : 1);
  }, [config, adapterVisibilityMap, displayInstalledExternalWallets]);

  const allButtons = useMemo(() => {
    return [...generateWalletButtons(walletRegistry.default), ...generateWalletButtons(walletRegistry.others)];
  }, [generateWalletButtons, walletRegistry.default, walletRegistry.others]);

  const totalExternalWalletsLength = useMemo(() => {
    const uniqueWalletSet = new Set();
    return allButtons.concat(customAdapterButtons).filter((button) => {
      if (uniqueWalletSet.has(button.name)) return false;
      uniqueWalletSet.add(button.name);
      return true;
    }).length;
  }, [allButtons, customAdapterButtons]);

  const handleSocialLoginHeight = () => {
    setIsSocialLoginsExpanded((prev) => !prev);
  };

  const handleWalletDetailsHeight = () => {
    setIsWalletDetailsExpanded((prev) => !prev);
  };

  const containerMaxHeight = useMemo(() => {
    const isPrivacyPolicyOrTncLink = privacyPolicy || tncLink;
    const isEnableMainSocialLoginButton = enableMainSocialLoginButton;

    // Loader Screen
    if (modalState.status !== MODAL_STATUS.INITIALIZED) {
      return "642px";
    }

    // Wallet Details Screen
    if (isWalletDetailsExpanded) {
      return "588px";
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
      if (isPrivacyPolicyOrTncLink) {
        return isEnableMainSocialLoginButton ? "600px" : "560px";
      }
      return isEnableMainSocialLoginButton ? "570px" : "530px";
    }

    // More than 1 connector
    if (topInstalledConnectorButtons.length > 1) {
      const maxHeight = 500 + (topInstalledConnectorButtons.length - 1) * 58;
      if (isPrivacyPolicyOrTncLink) {
        return `${maxHeight + (isEnableMainSocialLoginButton ? 120 : 60)}px`;
      }
      return `${maxHeight + (isEnableMainSocialLoginButton ? 66 : 16)}px`;
    }
    // Default
    return "539px";
  }, [
    isWalletDetailsExpanded,
    modalState.currentPage,
    isSocialLoginsExpanded,
    topInstalledConnectorButtons,
    privacyPolicy,
    tncLink,
    enableMainSocialLoginButton,
    modalState.status,
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
                    web3authClientId={modalState.web3authClientId}
                    web3authNetwork={modalState.web3authNetwork}
                    isModalVisible={modalState.modalVisibility}
                    isDark={isDark}
                    appLogo={appLogo}
                    showPasswordLessInput={showPasswordLessInput}
                    showExternalWalletButton={showExternalWalletButton}
                    showExternalWalletCount={displayExternalWalletsCount}
                    showInstalledExternalWallets={displayInstalledExternalWallets}
                    handleSocialLoginClick={handleSocialLoginClick}
                    socialLoginsConfig={socialLoginsConfig}
                    areSocialLoginsVisible={areSocialLoginsVisible}
                    isEmailPrimary={isEmailPrimary}
                    isExternalPrimary={isExternalPrimary}
                    installedExternalWalletConfig={topInstalledConnectorButtons}
                    handleExternalWalletBtnClick={onExternalWalletBtnClick}
                    isEmailPasswordLessLoginVisible={isEmailPasswordLessLoginVisible}
                    isSmsPasswordLessLoginVisible={isSmsPasswordLessLoginVisible}
                    totalExternalWallets={totalExternalWalletsLength}
                    handleSocialLoginHeight={handleSocialLoginHeight}
                    logoAlignment={logoAlignment}
                    buttonRadius={buttonRadiusType}
                    enableMainSocialLoginButton={enableMainSocialLoginButton}
                    handleExternalWalletClick={preHandleExternalWalletClick}
                  />
                )}
                {modalState.currentPage === PAGES.CONNECT_WALLET && !showExternalWalletPage && modalState.status === MODAL_STATUS.INITIALIZED && (
                  <ConnectWallet
                    isDark={isDark}
                    onBackClick={onBackClick}
                    handleExternalWalletClick={preHandleExternalWalletClick}
                    walletConnectUri={modalState.walletConnectUri}
                    config={modalState.externalWalletsConfig}
                    walletRegistry={walletRegistry}
                    allExternalButtons={allButtons}
                    adapterVisibilityMap={adapterVisibilityMap}
                    customAdapterButtons={customAdapterButtons}
                    deviceDetails={{
                      platform: deviceDetails.platform,
                      browser: deviceDetails.browser,
                      os: deviceDetails.os as os,
                    }}
                    chainNamespace={chainNamespace}
                    handleWalletDetailsHeight={handleWalletDetailsHeight}
                    buttonRadius={buttonRadiusType}
                  />
                )}
              </>
            )}

            {/* Footer */}
            <Footer privacyPolicy={privacyPolicy} termsOfService={tncLink} />

            {bodyState.showWalletDetails && (
              <>
                {/* Backdrop */}
                <div
                  className={cn("w3a--bottom-sheet-bg w3a--fixed w3a--left-0 w3a--top-0 w3a--size-full w3a--transition-opacity w3a--duration-300", {
                    "w3a--rounded-[30px]": borderRadiusType === "large",
                    "w3a--rounded-2xl": borderRadiusType === "medium",
                    "w3a--rounded-none": borderRadiusType === "small",
                  })}
                  onClick={() => setBodyState({ showWalletDetails: false })}
                  aria-hidden="true"
                  role="button"
                />
                {/* Bottom Sheet */}
                <div
                  className={cn(
                    `w3a--fixed w3a--bottom-2 w3a--left-2 w3a--mx-auto w3a--flex w3a--w-[96%] w3a--flex-col 
      w3a--gap-y-2 w3a--rounded-3xl w3a--border w3a--border-app-gray-100 w3a--bg-app-white w3a--p-4 w3a--shadow-lg w3a--transition-transform w3a--duration-500 
      w3a--ease-out dark:w3a--border-app-gray-600 dark:w3a--bg-app-dark-surface-main
      ${bodyState.showWalletDetails ? "w3a--translate-y-0 w3a--delay-700" : "w3a--translate-y-full"}`,
                    {
                      "w3a--rounded-[30px]": borderRadiusType === "large",
                      "w3a--rounded-2xl": borderRadiusType === "medium",
                      "w3a--rounded-none": borderRadiusType === "small",
                    }
                  )}
                >
                  <div className="w3a--absolute w3a--right-4 w3a--top-[16px] w3a--z-10 w3a--cursor-pointer">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      onClick={() => setBodyState({ showWalletDetails: false })}
                      className="w3a--text-app-gray-500 dark:w3a--text-app-gray-200"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M0.292787 1.29299C0.480314 1.10552 0.734622 1.0002 0.999786 1.0002C1.26495 1.0002 1.51926 1.10552 1.70679 1.29299L5.99979 5.58599L10.2928 1.29299C10.385 1.19748 10.4954 1.1213 10.6174 1.06889C10.7394 1.01648 10.8706 0.988893 11.0034 0.987739C11.1362 0.986585 11.2678 1.01189 11.3907 1.06217C11.5136 1.11245 11.6253 1.1867 11.7192 1.28059C11.8131 1.37449 11.8873 1.48614 11.9376 1.60904C11.9879 1.73193 12.0132 1.86361 12.012 1.99639C12.0109 2.12917 11.9833 2.26039 11.9309 2.38239C11.8785 2.5044 11.8023 2.61474 11.7068 2.70699L7.41379 6.99999L11.7068 11.293C11.8889 11.4816 11.9897 11.7342 11.9875 11.9964C11.9852 12.2586 11.88 12.5094 11.6946 12.6948C11.5092 12.8802 11.2584 12.9854 10.9962 12.9877C10.734 12.9899 10.4814 12.8891 10.2928 12.707L5.99979 8.41399L1.70679 12.707C1.51818 12.8891 1.26558 12.9899 1.00339 12.9877C0.741188 12.9854 0.490376 12.8802 0.304968 12.6948C0.11956 12.5094 0.0143906 12.2586 0.0121121 11.9964C0.00983372 11.7342 0.110629 11.4816 0.292787 11.293L4.58579 6.99999L0.292787 2.70699C0.105316 2.51946 0 2.26515 0 1.99999C0 1.73483 0.105316 1.48052 0.292787 1.29299V1.29299Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
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
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </RootContext.Provider>
  );
}

export default Root;
