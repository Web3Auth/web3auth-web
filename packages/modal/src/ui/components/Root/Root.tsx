import { WALLET_CONNECTORS, type WalletRegistryItem } from "@web3auth/no-modal";
import Bowser from "bowser";
import { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { PAGES } from "../../constants";
import { BodyState, RootContext } from "../../context/RootContext";
import { ThemedContext } from "../../context/ThemeContext";
import { browser, ExternalButton, mobileOs, MODAL_STATUS, os, platform } from "../../interfaces";
import i18n from "../../localeImport";
import { getBrowserExtensionUrl, getBrowserName, getIcons, getMobileInstallLink, getOsName } from "../../utils";
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
  } = props;

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

  const mobileInstallLinks = () => {
    const installConfig = bodyState.walletDetails.walletRegistryItem.app || {};
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
              className="w3a--link-arrow w3a--flex w3a--w-full w3a--items-center w3a--justify-start w3a--gap-x-2 w3a--rounded-full w3a--border w3a--border-app-gray-200 w3a--bg-app-gray-50 w3a--px-5 w3a--py-2.5 hover:w3a--translate-y-[0.5px] hover:w3a--border-app-gray-50 dark:w3a--border-app-gray-500 dark:w3a--bg-app-gray-800 dark:hover:w3a--border-app-gray-800"
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
  };

  const desktopInstallLinks = () => {
    // if browser is brave, use chrome extension
    const browserType = deviceDetails.browser === "brave" ? "chrome" : deviceDetails.browser;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const browserExtensionConfig: any = bodyState.walletDetails.walletRegistryItem.app || {};
    const extensionForCurrentBrowser =
      browserExtensionConfig.browser && browserExtensionConfig.browser.includes(browserType) ? browserExtensionConfig.browser : undefined;
    const browserExtensionId = browserExtensionConfig[browserType] || extensionForCurrentBrowser;
    const browserExtensionUrl = browserExtensionId ? getBrowserExtensionUrl(browserType, browserExtensionId) : null;
    const installLink = browserExtensionUrl ? (
      <li>
        <a href={browserExtensionUrl} rel="noopener noreferrer" target="_blank">
          <button
            type="button"
            className="w3a--link-arrow w3a--flex w3a--w-full w3a--items-center w3a--justify-start w3a--gap-x-2 w3a--rounded-full w3a--border w3a--border-app-gray-200 w3a--bg-app-gray-50 w3a--px-5 w3a--py-2.5 hover:w3a--translate-y-[0.5px] hover:w3a--border-app-gray-50 dark:w3a--border-app-gray-500 dark:w3a--bg-app-gray-800 dark:hover:w3a--border-app-gray-800"
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
    return [installLink, ...mobileInstallLinks()];
  };

  // External Wallets

  const deviceDetailsWallets = useMemo<{ platform: platform; browser: browser; os: os }>(() => {
    const browserData = Bowser.getParser(window.navigator.userAgent);
    return {
      platform: browserData.getPlatformType() as platform,
      browser: browserData.getBrowserName().toLowerCase() as browser,
      os: browserData.getOSName() as os,
    };
  }, []);

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
  const adapterVisibility = useMemo(() => adapterVisibilityMap, [adapterVisibilityMap]);

  const generateWalletButtons = (wallets: Record<string, WalletRegistryItem>): ExternalButton[] => {
    return Object.keys(wallets).reduce((acc, wallet) => {
      if (adapterVisibility[wallet] === false) return acc;

      const walletRegistryItem: WalletRegistryItem = wallets[wallet];
      let href = "";
      if (deviceDetails.platform === Bowser.PLATFORMS_MAP.mobile) {
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
  };

  const customAdapterButtons = useMemo(() => {
    return Object.keys(config).reduce((acc, adapter) => {
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

  const allButtons = useMemo(() => {
    return [...generateWalletButtons(walletRegistry.default), ...generateWalletButtons(walletRegistry.others)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, walletRegistry]);

  const totalExternalWalletsLength = useMemo(() => {
    return allButtons.length + customAdapterButtons.length;
  }, [allButtons, customAdapterButtons]);

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
      return "642px";
    }
    return "539px";
  }, [isWalletDetailsExpanded, modalState.currentPage, isSocialLoginsExpanded]);

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
                    handleSocialLoginClick={handleSocialLoginClick}
                    socialLoginsConfig={socialLoginsConfig}
                    areSocialLoginsVisible={areSocialLoginsVisible}
                    isEmailPrimary={isEmailPrimary}
                    isExternalPrimary={isExternalPrimary}
                    handleExternalWalletBtnClick={onExternalWalletBtnClick}
                    isEmailPasswordLessLoginVisible={isEmailPasswordLessLoginVisible}
                    isSmsPasswordLessLoginVisible={isSmsPasswordLessLoginVisible}
                    totalExternalWallets={totalExternalWalletsLength}
                    handleSocialLoginHeight={handleSocialLoginHeight}
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
                    totalExternalWallets={totalExternalWalletsLength}
                    allExternalButtons={allButtons}
                    adapterVisibilityMap={adapterVisibility}
                    customAdapterButtons={customAdapterButtons}
                    deviceDetails={deviceDetailsWallets}
                    handleWalletDetailsHeight={handleWalletDetailsHeight}
                  />
                )}
              </>
            )}

            {/* Footer */}
            <Footer />

            {bodyState.showWalletDetails && (
              <>
                {/* Backdrop */}
                <div
                  className="w3a--bottom-sheet-bg w3a--fixed w3a--left-0 w3a--top-0 w3a--size-full w3a--transition-opacity w3a--duration-300"
                  onClick={() => setBodyState({ showWalletDetails: false })}
                  aria-hidden="true"
                  role="button"
                />
                {/* Bottom Sheet */}
                <div
                  className={`w3a--fixed w3a--bottom-0 w3a--left-0 w3a--flex w3a--w-full w3a--flex-col 
      w3a--gap-y-2 w3a--rounded-t-3xl w3a--border w3a--border-app-gray-100 w3a--bg-app-light-surface-main w3a--p-4 w3a--shadow-lg w3a--transition-transform 
      w3a--duration-500 w3a--ease-out dark:w3a--border-app-gray-600 dark:w3a--bg-app-dark-surface-main
      ${bodyState.showWalletDetails ? "w3a--translate-y-0 w3a--delay-700" : "w3a--translate-y-full"}`}
                >
                  {/* Drag Handle */}
                  <div
                    className="w3a--mx-auto w3a--h-1 w3a--w-16 w3a--cursor-pointer w3a--rounded-full w3a--bg-app-gray-200 
        dark:w3a--bg-app-gray-700"
                    onClick={() => setBodyState({ showWalletDetails: false })}
                    aria-hidden="true"
                    role="button"
                  />
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
                    {deviceDetails.platform === "desktop" ? desktopInstallLinks() : mobileInstallLinks()}
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
