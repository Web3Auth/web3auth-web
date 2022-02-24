import type OpenLogin from "@toruslabs/openlogin";
import {
  ADAPTER_CATEGORY,
  ADAPTER_EVENTS,
  ADAPTER_STATUS,
  BaseAdapterConfig,
  BaseDefaultAdapters,
  CustomChainConfig,
  SafeEventEmitterProvider,
  SkipAdaptersConfig,
  WALLET_ADAPTER_TYPE,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import { Web3AuthCore, Web3AuthCoreOptions } from "@web3auth/core";
import LoginModal, { LOGIN_MODAL_EVENTS, ModalState } from "@web3auth/ui";
import log from "loglevel";

import { AdapterConfig } from "./interface";
import { mergeOpenLoginConfig, OPENLOGIN_PROVIDERS } from "./utils";
log.enableAll();
log.setLevel("debug");

export interface UIConfig {
  /**
   * Logo for your app.
   */
  appLogo?: string;

  /**
   * theme for the modal
   *
   * @defaultValue `light`
   */
  theme?: "light" | "dark";

  /**
   * order of how login methods are shown
   *
   * @defaultValue `["google", "facebook", "twitter", "reddit", "discord", "twitch", "apple", "line", "github", "kakao", "linkedin", "weibo", "wechat", "email_passwordless"]`
   */
  loginMethodsOrder?: string[];
}
export interface Web3AuthOptions extends Web3AuthCoreOptions {
  /**
   * Client id for web3auth.
   * You can obtain your client id from the web3auth developer dashboard.
   * You can set any random string for this on localhost.
   */
  clientId: string;

  /**
   * web3auth instance provides different adapters for different type of usages. If you are dapp and want to
   * use external wallets like metamask, then you can use the `DAPP` authMode.
   * If you are a wallet and only want to use you own wallet implementations along with openlogin,
   * then you should use `WALLET` authMode.
   *
   * @defaultValue `DAPP`
   */
  authMode?: "DAPP" | "WALLET";
  /**
   * Config for configuring modal ui display properties
   */
  uiConfig?: UIConfig;
}
export class Web3Auth extends Web3AuthCore {
  public loginModal: LoginModal;

  readonly options: Web3AuthOptions;

  private defaultAdapters: BaseDefaultAdapters | null = null;

  private adaptersConfig: Record<WALLET_ADAPTER_TYPE, AdapterConfig> = {};

  constructor(options: Web3AuthOptions) {
    super(options);
    this.options = { ...options };
    this.loginModal = new LoginModal({
      theme: this.options.uiConfig?.theme,
      appLogo: this.options.uiConfig?.appLogo || "",
      version: "",
      adapterListener: this,
    });
    this.subscribeToLoginModalEvents();
  }

  public async initModal(params?: { adaptersConfig?: Record<WALLET_ADAPTER_TYPE, AdapterConfig> }): Promise<void> {
    super.checkInitRequirements();

    // initialize default adapters if any.
    await this.initializeDefaultAdapters(params?.adaptersConfig);

    // merge default adapters with the custom configured adapters.
    const allAdapters = [...Object.keys(this.walletAdapters || {})];
    await this.initializeAdaptersConfiguration(allAdapters, params.adaptersConfig || {});

    // only initialize a external adapter before social login, if it is a cached adapter.
    if (this.cachedAdapter && this.cachedAdapter !== WALLET_ADAPTERS.OPENLOGIN) {
      await this.walletAdapters[this.cachedAdapter].init({ autoConnect: true });
    }

    // add social logins to modal ui
    const hasSocialLoginAdapter = this.walletAdapters[WALLET_ADAPTERS.OPENLOGIN];
    const socialLoginConfig = this.adaptersConfig[WALLET_ADAPTERS.OPENLOGIN];
    let canShowSocialLogin = true;
    if (!socialLoginConfig.showOnModal) {
      canShowSocialLogin = false;
    }

    if (socialLoginConfig.loginMethods && Object.values(socialLoginConfig.loginMethods).every((methodConfig) => !methodConfig.showOnModal)) {
      canShowSocialLogin = false;
    }

    log.debug(hasSocialLoginAdapter, this.walletAdapters, this.adaptersConfig, "hasInAppWallets");

    const hasExternalWallets = allAdapters.some((adapterName) => {
      return this.walletAdapters[adapterName]?.type === ADAPTER_CATEGORY.EXTERNAL && this.adaptersConfig?.[adapterName].showOnModal;
    });

    if (hasSocialLoginAdapter && canShowSocialLogin) {
      await this.initializeSocialLoginUi(hasExternalWallets);
    }

    // add external wallets to modal ui
    if ((!hasSocialLoginAdapter || !canShowSocialLogin) && hasExternalWallets) {
      // if no in app wallet is available then initialize external wallets in modal
      await this.initExternalWalletAdapters(false, { showExternalWalletsOnly: true });
    }
    this.status = ADAPTER_STATUS.READY;
  }

  public addDefaultAdapters(defaultAdapters: BaseDefaultAdapters) {
    if (this.defaultAdapters) throw new Error("Default adapters already exists");
    this.defaultAdapters = defaultAdapters;
  }

  public async connect(): Promise<SafeEventEmitterProvider | null> {
    // if (!this.loginModal.initialized) throw new Error("Login modal is not initialized");
    // if already connected return provider
    if (this.provider) return this.provider;
    this.loginModal.open();
    return new Promise((resolve, reject) => {
      this.once(ADAPTER_EVENTS.CONNECTED, () => {
        return resolve(this.provider);
      });
      this.once(ADAPTER_EVENTS.ERRORED, (err: unknown) => {
        return reject(err);
      });
    });
  }

  private async initializeDefaultAdapters(adaptersConfig: Record<WALLET_ADAPTER_TYPE, AdapterConfig>): Promise<void> {
    if (this.defaultAdapters) {
      const skipDefaultAdapters: SkipAdaptersConfig = {};

      Object.keys(this.walletAdapters).forEach((adapterName) => {
        // don't initialize adapters in default adapters which are custom configured here.
        skipDefaultAdapters[adapterName] = { initializeAdapter: false };
      });
      await this.defaultAdapters._init({
        chainConfig: this.options.chainConfig,
        clientId: this.options.clientId,
        skipAdapters: skipDefaultAdapters,
        adaptersConfig: adaptersConfig || {},
      });

      const defaultAdaptersInstances = this.defaultAdapters?.walletAdapters || {};
      Object.keys(defaultAdaptersInstances).forEach((adName) => {
        if (!this.walletAdapters[adName]) this.walletAdapters[adName] = defaultAdaptersInstances[adName];
      });
    }
  }

  private async initializeAdaptersConfiguration(allAdapters: string[], adaptersConfig: Record<WALLET_ADAPTER_TYPE, AdapterConfig>): Promise<void> {
    const adapterConfigurationPromises = allAdapters.map(async (adapterName: string) => {
      const adapter = this.walletAdapters[adapterName];

      const adapterConfig = adaptersConfig?.[adapterName] || {
        label: adapterName,
        showOnModal: true,
        showOnMobile: true,
        showOnDesktop: true,
      };
      this.adaptersConfig[adapterName] = adapterConfig;
      if (adapter?.type === ADAPTER_CATEGORY.IN_APP || adapter?.type === ADAPTER_CATEGORY.EXTERNAL || adapterName === this.cachedAdapter) {
        // add client id to openlogin adapter, same web3auth client id can be used in openlogin.
        // this id is being overridden if user is also passing client id in openlogin's adapter constructor.
        if (adapterName === WALLET_ADAPTERS.OPENLOGIN) {
          adapter.setAdapterSettings({ clientId: this.options.clientId });
        }

        // if adapter doesn't have any chainConfig then we will set the chainConfig based of passed chainNamespace
        // and chainNamespace.
        if (!adapter.chainConfigProxy) {
          // chainConfig is merged with default chainConfig in core constructor, so its safer to cast here.
          adapter.setChainConfig(this.coreOptions.chainConfig as CustomChainConfig);
        }

        return adapterName;
      }
    });

    await Promise.all(adapterConfigurationPromises);
  }

  private async initExternalWalletAdapters(externalWalletsInitialized: boolean, options?: { showExternalWalletsOnly: boolean }): Promise<void> {
    if (externalWalletsInitialized) return;
    const adaptersConfig: Record<string, BaseAdapterConfig> = {};
    const adaptersData: Record<string, unknown> = {};
    const adapterPromises = Object.keys(this.walletAdapters).map(async (adapterName) => {
      try {
        const adapter = this.walletAdapters[adapterName];
        if (adapter?.type === ADAPTER_CATEGORY.EXTERNAL && this.adaptersConfig[adapterName].showOnModal !== false) {
          log.debug("init external wallet", this.cachedAdapter, adapterName);
          this.subscribeToAdapterEvents(adapter);
          // we are not initializing cached adapter here as it is already being initialized in initModal before.
          if (this.cachedAdapter === adapterName) {
            return;
          }
          if (adapter.status === ADAPTER_STATUS.NOT_READY) await adapter.init({ autoConnect: this.cachedAdapter === adapterName });
          adaptersConfig[adapterName] = this.adaptersConfig[adapterName];
          adaptersData[adapterName] = adapter.adapterData || {};
          return adapterName;
        }
      } catch (error) {
        log.error(error, "error while initializing adapter");
      }
    });

    const adapterInitResults = await Promise.all(adapterPromises);
    const finalAdaptersConfig: Record<WALLET_ADAPTER_TYPE, BaseAdapterConfig> = {};
    adapterInitResults.forEach((result: string | undefined) => {
      if (result) {
        finalAdaptersConfig[result] = adaptersConfig[result];
      }
    });
    if (options?.showExternalWalletsOnly) {
      const modalState: Partial<ModalState> = {
        hasExternalWallets: true,
        externalWalletsInitialized: true,
        externalWalletsConfig: finalAdaptersConfig,
        detailedLoaderAdapter: "",
        showExternalWalletsOnly: true,
      };
      await this.loginModal.initModal(modalState);
    } else {
      this.loginModal.addWalletLogins(finalAdaptersConfig, { showExternalWalletsOnly: false });
    }
  }

  private async initializeSocialLoginUi(hasExternalWallets: boolean): Promise<void> {
    const socialLoginAdapter = this.walletAdapters[WALLET_ADAPTERS.OPENLOGIN];
    if (!socialLoginAdapter) return;

    try {
      this.subscribeToAdapterEvents(socialLoginAdapter);
      if (socialLoginAdapter.status === ADAPTER_STATUS.NOT_READY)
        await socialLoginAdapter.init({ autoConnect: this.cachedAdapter === WALLET_ADAPTERS.OPENLOGIN });

      const modalState: Partial<ModalState> = {
        hasExternalWallets: !!hasExternalWallets,
        socialLoginsConfig: {
          adapter: WALLET_ADAPTERS.OPENLOGIN,
          loginMethods: mergeOpenLoginConfig(
            (this.walletAdapters[WALLET_ADAPTERS.OPENLOGIN] as any).openloginInstance as OpenLogin,
            this.adaptersConfig[WALLET_ADAPTERS.OPENLOGIN]?.loginMethods
          ),
          loginMethodsOrder: this.options.uiConfig?.loginMethodsOrder || OPENLOGIN_PROVIDERS,
        },
      };

      await this.loginModal.initModal(modalState);
    } catch (error) {
      log.error(error, "error while initializing adapter");
    }
  }

  private subscribeToLoginModalEvents(): void {
    this.loginModal.on(LOGIN_MODAL_EVENTS.LOGIN, async (params: { adapter: WALLET_ADAPTER_TYPE; loginParams: unknown }) => {
      try {
        await this.connectTo<unknown>(params.adapter, params.loginParams);
      } catch (error) {
        log.error(`Error while connecting to adapter: ${params.adapter}`, error);
      }
    });
    this.loginModal.on(LOGIN_MODAL_EVENTS.INIT_EXTERNAL_WALLETS, async (params: { externalWalletsInitialized: boolean }) => {
      await this.initExternalWalletAdapters(params.externalWalletsInitialized);
    });
    this.loginModal.on(LOGIN_MODAL_EVENTS.DISCONNECT, async () => {
      try {
        await this.logout();
      } catch (error) {
        log.error(`Error while disconnecting`, error);
      }
    });
    this.loginModal.on(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, async (visibility: boolean) => {
      log.debug("is login modal visible", visibility);
      this.emit(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, visibility);
      const walletConnectStatus = this.walletAdapters[WALLET_ADAPTERS.WALLET_CONNECT_V1]?.status;
      if (visibility && walletConnectStatus === ADAPTER_STATUS.READY) {
        // refreshing session for wallet connect whenever modal is opened.
        try {
          this.walletAdapters[WALLET_ADAPTERS.WALLET_CONNECT_V1].connect();
        } catch (error) {
          log.error(`Error while disconnecting to wallet connect in core`, error);
        }
      }
    });
  }
}
