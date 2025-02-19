import { type SafeEventEmitter } from "@web3auth/auth";
import { ChainNamespaceType, log, WALLET_ADAPTERS, WalletRegistry, WalletRegistryItem } from "@web3auth/base/src";
import Bowser from "bowser";
import { createMemo, Match, Show, Suspense, Switch, useContext } from "solid-js";
import { createStore } from "solid-js/store";

import { PAGES } from "../../constants";
import { ThemedContext } from "../../context/ThemeContext";
import {
  browser,
  ExternalButton,
  ExternalWalletEventType,
  mobileOs,
  MODAL_STATUS,
  ModalState,
  os,
  platform,
  SocialLoginEventType,
  SocialLoginsConfig,
  StateEmitterEvents,
} from "../../interfaces";
import { t } from "../../localeImport";
import { getBrowserExtensionUrl, getBrowserName, getIcons, getMobileInstallLink, getOsName } from "../../utils/common";
import Footer from "../Footer/Footer";
import { Image } from "../Image";
import { Loader } from "../Loader";
import ConnectWallet from "./ConnectWallet";
import Login from "./Login";

export interface BodyProps {
  stateListener: SafeEventEmitter<StateEmitterEvents>;
  appLogo?: string;
  appName?: string;
  chainNamespace: ChainNamespaceType;
  walletRegistry?: WalletRegistry;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  handleShowExternalWallets: (externalWalletsInitialized: boolean) => void;
  showPasswordLessInput: boolean;
  showExternalWalletButton: boolean;
  socialLoginsConfig: SocialLoginsConfig;
  areSocialLoginsVisible: boolean;
  isEmailPrimary: boolean;
  isExternalPrimary: boolean;
  showExternalWalletPage: boolean;
  handleExternalWalletBtnClick?: (flag: boolean) => void;
  modalState: ModalState;
  preHandleExternalWalletClick: (params: { adapter: string }) => void;
  setModalState: (state: ModalState) => void;
  onCloseLoader: () => void;
  isEmailPasswordLessLoginVisible: boolean;
  isSmsPasswordLessLoginVisible: boolean;
  handleBackClick: () => void;
}

// interface BodyContextType {
//   bodyState: {
//     showWalletDetails: boolean;
//     walletDetails: ExternalButton;
//   };
//   setBodyState: (state: { showWalletDetails: boolean; walletDetails: ExternalButton }) => void;
// }

// export const BodyContext = createContext<BodyContextType>({} as BodyContextType);

const Body = (props: BodyProps) => {
  const { isDark } = useContext(ThemedContext);

  const [bodyState, setBodyState] = createStore<{
    showWalletDetails: boolean;
    walletDetails: ExternalButton;
  }>({
    showWalletDetails: false,
    walletDetails: null,
  });

  const handleExternalWalletBtnClick = (flag: boolean) => {
    props.setModalState({
      ...props.modalState,
      currentPage: PAGES.CONNECT_WALLET,
    });
    if (props.handleExternalWalletBtnClick) props.handleExternalWalletBtnClick(flag);
  };

  const handleBackClick = (flag: boolean) => {
    props.setModalState({
      ...props.modalState,
      currentPage: PAGES.LOGIN,
    });
    if (props.handleExternalWalletBtnClick) props.handleExternalWalletBtnClick(flag);
  };

  // Wallet Details
  const deviceDetails = createMemo<{ platform: platform; browser: browser; os: mobileOs }>(() => {
    const browserData = Bowser.getParser(window.navigator.userAgent);
    return {
      platform: browserData.getPlatformType() as platform,
      browser: browserData.getBrowserName().toLowerCase() as browser,
      os: browserData.getOSName() as mobileOs,
    };
  });

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
        <li class="w3a--w-full">
          <a href={appUrl} rel="noopener noreferrer" target="_blank">
            <button
              type="button"
              class="w3a--rounded-full w3a--px-5 w3a--py-2.5 w3a--flex w3a--items-center w3a--justify-start w3a--bg-app-gray-50 dark:w3a--bg-app-gray-800 w3a--gap-x-2 w3a--w-full w3a-box-shadow w3a--border w3a--border-app-gray-200 dark:w3a--border-app-gray-500 hover:w3a--translate-y-[0.5px] w3a--link-arrow hover:w3a--border-app-gray-50 dark:hover:w3a--border-app-gray-800"
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
              <span class="w3a--text-sm w3a--font-medium w3a--text-app-gray-900 dark:w3a--text-app-white">
                {t("modal.external.install-mobile-app", { os: getOsName(osKey as mobileOs) })}
              </span>
              <img
                id="device-link-arrow"
                class="w3a--icon-animation w3a--ml-auto"
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
    const browserType = deviceDetails().browser === "brave" ? "chrome" : deviceDetails().browser;
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
            class="w3a--rounded-full w3a--px-5 w3a--py-2.5 w3a--flex w3a--items-center w3a--justify-start w3a--bg-app-gray-50 dark:w3a--bg-app-gray-800 w3a--gap-x-2 w3a--w-full w3a-box-shadow w3a--border w3a--border-app-gray-200 dark:w3a--border-app-gray-500 hover:w3a--translate-y-[0.5px] w3a--link-arrow hover:w3a--border-app-gray-50 dark:hover:w3a--border-app-gray-800"
          >
            <Image
              imageId={deviceDetails().browser}
              darkImageId={deviceDetails().browser}
              hoverImageId={deviceDetails().browser}
              darkHoverImageId={deviceDetails().browser}
              height="30"
              width="30"
              isButton
            />
            <span class="w3a--text-sm w3a--font-medium w3a--text-app-gray-900 dark:w3a--text-app-white">
              {t("modal.external.install-browser-extension", { browser: getBrowserName(deviceDetails().browser) })}
            </span>
            <img
              id="device-link-arrow"
              class="w3a--icon-animation w3a--ml-auto"
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

  const deviceDetailsWallets = createMemo<{ platform: platform; browser: browser; os: os }>(() => {
    const browserData = Bowser.getParser(window.navigator.userAgent);
    return {
      platform: browserData.getPlatformType() as platform,
      browser: browserData.getBrowserName().toLowerCase() as browser,
      os: browserData.getOSName() as os,
    };
  });

  const config = createMemo(() => props.modalState.externalWalletsConfig);

  const adapterVisibilityMap = createMemo(() => {
    const canShowMap: Record<string, boolean> = {};

    Object.keys(config).forEach((adapter) => {
      const adapterConfig = config()[adapter];

      if (!adapterConfig.showOnModal) {
        canShowMap[adapter] = false;
        return;
      }

      if (deviceDetails().platform === "desktop" && adapterConfig.showOnDesktop) {
        canShowMap[adapter] = true;
        return;
      }

      if ((deviceDetails().platform === "mobile" || deviceDetails().platform === "tablet") && adapterConfig.showOnMobile) {
        canShowMap[adapter] = true;
        return;
      }

      canShowMap[adapter] = false;
    });

    log.debug("adapter visibility map", canShowMap);
    return canShowMap;
  });

  const isWalletConnectAdapterIncluded = createMemo(() => Object.keys(config()).some((adapter) => adapter === WALLET_ADAPTERS.WALLET_CONNECT_V2));
  const adapterVisibility = createMemo(() => adapterVisibilityMap());

  const generateWalletButtons = (wallets: Record<string, WalletRegistryItem>): ExternalButton[] => {
    // eslint-disable-next-line solid/reactivity
    return Object.keys(wallets).reduce((acc, wallet) => {
      if (adapterVisibility()[wallet] === false) return acc;

      const walletRegistryItem: WalletRegistryItem = wallets[wallet];
      let href = "";
      if (deviceDetails().platform === Bowser.PLATFORMS_MAP.mobile) {
        const universalLink = walletRegistryItem?.mobile?.universal;
        const deepLink = walletRegistryItem?.mobile?.native;
        href = universalLink || deepLink;
      }

      const button: ExternalButton = {
        name: wallet,
        displayName: walletRegistryItem.name,
        href,
        hasInjectedWallet: config()[wallet]?.isInjected || false,
        hasWalletConnect: isWalletConnectAdapterIncluded && walletRegistryItem.walletConnect?.sdks?.includes("sign_v2"),
        hasInstallLinks: Object.keys(walletRegistryItem.app || {}).length > 0,
        walletRegistryItem,
        imgExtension: walletRegistryItem.imgExtension || "svg",
      };

      if (!button.hasInjectedWallet && !button.hasWalletConnect && !button.hasInstallLinks) return acc;

      const chainNamespaces = new Set(walletRegistryItem.chains?.map((chain) => chain.split(":")[0]));
      const injectedChainNamespaces = new Set(walletRegistryItem.injected?.map((injected) => injected.namespace));
      if (!chainNamespaces.has(props.chainNamespace) && !injectedChainNamespaces.has(props.chainNamespace)) return acc;

      acc.push(button);
      return acc;
    }, [] as ExternalButton[]);
  };

  const customAdapterButtons = createMemo(() => {
    // eslint-disable-next-line solid/reactivity
    return Object.keys(config).reduce((acc, adapter) => {
      if (![WALLET_ADAPTERS.WALLET_CONNECT_V2].includes(adapter) && !config()[adapter].isInjected && adapterVisibilityMap()[adapter]) {
        acc.push({
          name: adapter,
          displayName: config()[adapter].label || adapter,
          hasInjectedWallet: false,
          hasWalletConnect: false,
          hasInstallLinks: false,
        });
      }
      return acc;
    }, [] as ExternalButton[]);
  });

  const allButtons = createMemo(() => {
    return [...generateWalletButtons(props.walletRegistry.default), ...generateWalletButtons(props.walletRegistry.others)];
  });

  const totalExternalWalletsLength = createMemo(() => {
    return allButtons().length + customAdapterButtons().length;
  });

  return (
    <div class="w3a--h-auto w3a--p-6 w3a--flex w3a--flex-col w3a--flex-1 w3a--relative">
      {/* Content */}
      <Show
        when={props.modalState.status !== MODAL_STATUS.INITIALIZED}
        fallback={
          <Suspense>
            <Switch>
              <Match
                when={
                  props.modalState.currentPage === PAGES.LOGIN && props.showExternalWalletPage && props.modalState.status === MODAL_STATUS.INITIALIZED
                }
              >
                <Login
                  {...props}
                  isDark={isDark}
                  showPasswordLessInput={props.showPasswordLessInput}
                  showExternalWalletButton={props.showExternalWalletButton}
                  handleSocialLoginClick={props.handleSocialLoginClick}
                  socialLoginsConfig={props.socialLoginsConfig}
                  areSocialLoginsVisible={props.areSocialLoginsVisible}
                  isEmailPrimary={props.isEmailPrimary}
                  isExternalPrimary={props.isExternalPrimary}
                  handleExternalWalletBtnClick={handleExternalWalletBtnClick}
                  isEmailPasswordLessLoginVisible={props.isEmailPasswordLessLoginVisible}
                  isSmsPasswordLessLoginVisible={props.isSmsPasswordLessLoginVisible}
                  totalExternalWallets={totalExternalWalletsLength()}
                />
              </Match>
              <Match
                when={
                  props.modalState.currentPage === PAGES.CONNECT_WALLET &&
                  !props.showExternalWalletPage &&
                  props.modalState.status === MODAL_STATUS.INITIALIZED
                }
              >
                <ConnectWallet
                  isDark={isDark}
                  onBackClick={handleBackClick}
                  modalStatus={props.modalState.status}
                  showBackButton={props.areSocialLoginsVisible || props.showPasswordLessInput}
                  handleExternalWalletClick={props.preHandleExternalWalletClick}
                  chainNamespace={props.chainNamespace}
                  walletConnectUri={props.modalState.walletConnectUri}
                  config={props.modalState.externalWalletsConfig}
                  walletRegistry={props.walletRegistry}
                  appLogo={props.appLogo}
                  totalExternalWallets={totalExternalWalletsLength()}
                  allExternalButtons={allButtons()}
                  adapterVisibilityMap={adapterVisibility()}
                  customAdapterButtons={customAdapterButtons()}
                  deviceDetails={deviceDetailsWallets()}
                  bodyState={bodyState}
                  setBodyState={setBodyState}
                />
              </Match>
            </Switch>
          </Suspense>
        }
      >
        <Loader
          adapter={props.modalState.detailedLoaderAdapter}
          adapterName={props.modalState.detailedLoaderAdapter}
          modalStatus={props.modalState.status}
          onClose={props.onCloseLoader}
          appLogo={props.appLogo}
        />
      </Show>

      {/* Footer */}
      <Footer />

      {/* Wallet Details */}
      <Show when={bodyState.showWalletDetails}>
        <div
          class="w3a--absolute w3a--h-full w3a--w-full w3a--top-0 w3a--left-0 w3a--bottom-sheet-bg w3a--rounded-3xl"
          onClick={() => setBodyState({ showWalletDetails: false })}
        />
        <div
          class="w3a--absolute w3a--bottom w3a--left-0 w3a--bg-app-light-surface-main dark:w3a--bg-app-dark-surface-main w3a--rounded-3xl w3a--p-4 w3a--bottom-sheet-width w3a--flex w3a--flex-col 
            w3a--gap-y-2 w3a--shadow-sm w3a--border w3a--border-app-gray-100 dark:w3a--border-app-gray-600"
        >
          <div
            class="w3a--h-1 w3a--w-16 w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700 w3a--mx-auto w3a--rounded-full w3a--cursor-pointer"
            onClick={() => setBodyState({ showWalletDetails: false })}
            aria-hidden="true"
            role="button"
          />
          <div class="w3a--flex w3a--justify-center w3a--my-4">
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
          <ul class="w3a--flex w3a--flex-col w3a--gap-y-2">
            {deviceDetails().platform === "desktop" ? desktopInstallLinks() : mobileInstallLinks()}
          </ul>
        </div>
      </Show>
    </div>
  );
};

export default Body;
