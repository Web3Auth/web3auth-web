import { WALLET_CONNECTORS, type WalletRegistryItem } from "@web3auth/no-modal";
import Bowser from "bowser";
import { JSX, useCallback, useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CONNECT_WALLET_PAGES, DEFAULT_METAMASK_WALLET_REGISTRY_ITEM, PAGES } from "../../constants";
import { BodyState, RootContext } from "../../context/RootContext";
import { ThemedContext } from "../../context/ThemeContext";
import { browser, ExternalButton, mobileOs, MODAL_STATUS, os, platform, TOAST_TYPE, ToastType } from "../../interfaces";
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
    logoAlignment = "center",
    buttonRadiusType = "pill",
    privacyPolicy = "",
    tncLink = "",
    displayInstalledExternalWallets = true,
    displayExternalWalletsCount = true,
  } = uiConfig;

  const [t] = useTranslation(undefined, { i18n });
  const { isDark } = useContext(ThemedContext);

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

  const allButtons = useMemo(() => {
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
        hasWalletConnect: false,
        hasInstallLinks: false,
        icon: connectorConfig?.icon,
        chainNamespaces: connectorConfig?.chainNamespaces || [],
      });
      return acc;
    }, [] as ExternalButton[]);

    // if metamask connector is not injected, use the registry button instead to display QR code
    const metamaskCustomConnectorIdx = installedConnectors.findIndex((button) => button.name === WALLET_CONNECTORS.METAMASK);
    if (metamaskCustomConnectorIdx !== -1) {
      const metamaskCustomConnector = installedConnectors[metamaskCustomConnectorIdx];
      let metamaskRegistryButton = allButtons.find((button) => button.name === WALLET_CONNECTORS.METAMASK);
      if (!metamaskRegistryButton) {
        // if metamask is not in the registry, use the default metamask registry item
        metamaskRegistryButton = generateWalletButtons({
          [WALLET_CONNECTORS.METAMASK]: DEFAULT_METAMASK_WALLET_REGISTRY_ITEM,
        })[0];
      }
      if (metamaskRegistryButton) {
        installedConnectors.splice(metamaskCustomConnectorIdx, 1, {
          ...metamaskRegistryButton,
          chainNamespaces: metamaskCustomConnector.chainNamespaces, // preserve the chain namespaces
        });
      }
    }

    // make metamask the first button and limit the number of buttons
    return installedConnectors;
  }, [allButtons, config, connectorVisibilityMap, generateWalletButtons]);

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
    const isPrivacyPolicyOrTncLink = privacyPolicy || tncLink;

    // Loader Screen
    if (modalState.status !== MODAL_STATUS.INITIALIZED) {
      return "642px";
    }

    // Wallet Details Screen
    if (isWalletDetailsExpanded) {
      return isPrivacyPolicyOrTncLink ? "640px" : "588px";
    }

    // MetaMask QR Code Screen
    if (bodyState.metamaskQrCode?.show) {
      return isPrivacyPolicyOrTncLink ? "640px" : "588px";
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
    // don't show loader if metamask is connecting and there is a connect uri
    if (modalState.detailedLoaderConnector === WALLET_CONNECTORS.METAMASK && modalState.metamaskConnectUri) {
      return false;
    }
    return modalState.status !== MODAL_STATUS.INITIALIZED;
  }, [modalState.detailedLoaderConnector, modalState.metamaskConnectUri, modalState.status]);

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
                    />
                  </div>
                ) : (
                  <>
                    {/* Login Screen */}
                    {modalState.currentPage === PAGES.LOGIN && showExternalWalletPage && modalState.status === MODAL_STATUS.INITIALIZED && (
                      <Login
                        web3authClientId={modalState.web3authClientId}
                        web3authNetwork={modalState.web3authNetwork}
                        authBuildEnv={modalState.authBuildEnv}
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
                        handleSocialLoginClick={handleSocialLoginClick}
                        handleExternalWalletBtnClick={onExternalWalletBtnClick}
                        handleSocialLoginHeight={handleSocialLoginHeight}
                        handleExternalWalletClick={preHandleExternalWalletClick}
                      />
                    )}
                    {/* Connect Wallet Screen */}
                    {modalState.currentPage === PAGES.CONNECT_WALLET && !showExternalWalletPage && modalState.status === MODAL_STATUS.INITIALIZED && (
                      <ConnectWallet
                        isDark={isDark}
                        walletConnectUri={modalState.walletConnectUri}
                        metamaskConnectUri={modalState.metamaskConnectUri}
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
              </>
            )}

            {/* Footer */}
            <Footer privacyPolicy={privacyPolicy} termsOfService={tncLink} />

            {/* Multi Chain Selector */}
            {bodyState.multiChainSelector?.show && (
              <BottomSheet
                uiConfig={uiConfig}
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
                uiConfig={uiConfig}
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
