import {
  ADAPTER_CATEGORY,
  ADAPTER_EVENTS,
  ADAPTER_STATUS,
  AdapterConfig,
  AdapterFactoryConfig,
  CustomChainConfig,
  getChainConfig,
  IAdapterFactory,
  SafeEventEmitterProvider,
  WALLET_ADAPTER_TYPE,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import { Web3AuthCore, Web3AuthCoreOptions } from "@web3auth/core";
import LoginModal, { LOGIN_MODAL_EVENTS } from "@web3auth/ui";
import log from "loglevel";

import { getAdapterSocialLogins } from "./utils";

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
   * If you are a wallet and only want to use you own wallet implementations along with customAuth or openlogin,
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

  private adapterFactory: IAdapterFactory | null = null;

  private adaptersConfig: Record<WALLET_ADAPTER_TYPE, AdapterConfig> = {};

  constructor(options: Web3AuthOptions) {
    super(options);
    this.options = { ...options };
    this.loginModal = new LoginModal({ appLogo: this.options.uiConfig?.appLogo || "", version: "", adapterListener: this });
    this.subscribeToLoginModalEvents();
  }

  public addAdapterFactory(adapterFactory: IAdapterFactory) {
    if (this.adapterFactory) throw new Error("Adapter factory already exists");
    this.adapterFactory = adapterFactory;
  }

  public async initModal(params?: { adaptersConfig?: Record<WALLET_ADAPTER_TYPE, AdapterConfig> }): Promise<void> {
    super.checkInitRequirements();
    this.loginModal.init();
    const adapterFactoryConfig: AdapterFactoryConfig = {};
    Object.keys(this.walletAdapters).forEach((adapterName) => {
      // don't initialize adapters in factory which are custom configured here.
      adapterFactoryConfig[adapterName] = { initializeAdapter: false };
    });
    if (this.adapterFactory)
      await this.adapterFactory.init({
        chainConfig: this.options.chainConfig,
        clientId: this.options.clientId,
        adapterFactoryConfig,
        adaptersConfig: params?.adaptersConfig || {},
      });
    const defaultAdapters = this.adapterFactory?.walletAdapters || {};
    Object.keys(defaultAdapters).forEach((adName) => {
      if (!this.walletAdapters[adName]) this.walletAdapters[adName] = defaultAdapters[adName];
    });
    const providedChainConfig = this.options.chainConfig;

    const adapterConfigurationPromises = Object.keys(this.walletAdapters).map(async (adapterName: string) => {
      const adapterConfig = params?.adaptersConfig?.[adapterName] || {
        label: adapterName,
        showOnModal: true,
        showOnMobile: true,
        showOnDesktop: true,
      };
      this.adaptersConfig[adapterName] = adapterConfig;
      const adapter = this.walletAdapters[adapterName];
      if (adapter?.type === ADAPTER_CATEGORY.IN_APP || adapter?.type === ADAPTER_CATEGORY.EXTERNAL || adapterName === this.cachedAdapter) {
        // add client id to openlogin adapter, same web3auth client id can be used in openlogin.
        // this id is being overridden if user is also passing client id in openlogin's adapter constructor.
        if (adapterName === WALLET_ADAPTERS.OPENLOGIN) {
          adapter.setAdapterSettings({ clientId: this.options.clientId });
        }

        // if adapter doesn't have any chainConfig then we will set the chainConfig based of passed chainNamespace
        // and chainNamespace.
        if (!adapter.chainConfigProxy) {
          const chainConfig = {
            ...getChainConfig(providedChainConfig.chainNamespace, this.coreOptions.chainConfig?.chainId),
            ...this.coreOptions.chainConfig,
          } as CustomChainConfig;
          adapter.setChainConfig(chainConfig);
        }

        return adapterName;
      }
    });

    const adapterNames = await Promise.all(adapterConfigurationPromises);
    const hasInAppWallets = Object.values(this.walletAdapters).some((adapter) => adapter.type === ADAPTER_CATEGORY.IN_APP);

    // Now, initialize the adapters.
    const initPromises = adapterNames.map(async (adapterName) => {
      if (!adapterName) return;
      try {
        const adapter = this.walletAdapters[adapterName];
        // only initialize a external adapter here if it is a cached adapter.
        if (this.cachedAdapter !== adapterName && adapter.type === ADAPTER_CATEGORY.EXTERNAL) {
          return;
        }
        // in-app wallets or cached wallet (being connected or already connected) are initialized first.
        // if adapter is configured thn only initialize in app or cached adapter.
        // external wallets are initialized on INIT_EXTERNAL_WALLET event.
        this.subscribeToAdapterEvents(adapter);

        await adapter.init({ autoConnect: this.cachedAdapter === adapterName });

        // note: not adding cachedWallet to modal if it is external wallet.
        // adding it later if no in-app wallets are available.
        if (adapter.type === ADAPTER_CATEGORY.IN_APP) {
          this.initializeInAppWallet(adapterName);
        }
      } catch (error) {
        log.error(error, "error while initializing adapter");
      }
    });

    this.status = ADAPTER_STATUS.READY;

    await Promise.all(initPromises);

    const hasExternalWallets = Object.keys(this.walletAdapters).some((adapterName) => {
      return this.walletAdapters[adapterName]?.type === ADAPTER_CATEGORY.EXTERNAL && this.adaptersConfig[adapterName].showOnModal;
    });

    if (hasExternalWallets) {
      this.loginModal.initExternalWalletContainer();
    }

    // variable to check if we have any in app wallets
    // currently all default in app and external wallets can be hidden or shown based on config.
    if (!hasInAppWallets && hasExternalWallets) {
      // if no in app wallet is available then initialize external wallets in modal
      await this.initExternalWalletAdapters(false, { showExternalWalletsOnly: true });
    }
  }

  public async connect(): Promise<SafeEventEmitterProvider | null> {
    if (!this.loginModal.initialized) throw new Error("Login modal is not initialized");
    // if already connected return provider
    if (this.provider) return this.provider;
    this.loginModal.toggleModal();
    return new Promise((resolve, reject) => {
      this.once(ADAPTER_EVENTS.CONNECTED, () => {
        return resolve(this.provider);
      });
      this.once(ADAPTER_EVENTS.ERRORED, (err: unknown) => {
        return reject(err);
      });
    });
  }

  private async initExternalWalletAdapters(externalWalletsInitialized: boolean, options?: { showExternalWalletsOnly: boolean }): Promise<void> {
    if (externalWalletsInitialized) return;
    const adaptersConfig: Record<string, AdapterConfig> = {};
    const adaptersData: Record<string, unknown> = {};
    const adapterPromises = Object.keys(this.walletAdapters).map(async (adapterName) => {
      try {
        const adapter = this.walletAdapters[adapterName];
        if (adapter?.type === ADAPTER_CATEGORY.EXTERNAL) {
          log.debug("init external wallet", this.cachedAdapter, adapterName);
          this.subscribeToAdapterEvents(adapter);
          // we are not initializing cached adapter here as it is already being initialized in initModal before.
          if (this.cachedAdapter === adapterName) {
            return;
          }
          await adapter.init({ autoConnect: this.cachedAdapter === adapterName });
          adaptersConfig[adapterName] = this.adaptersConfig[adapterName];
          adaptersData[adapterName] = adapter.adapterData || {};
          return adapterName;
        }
      } catch (error) {
        log.error(error, "error while initializing adapter");
      }
    });

    const adapterInitResults = await Promise.all(adapterPromises);
    const finalAdaptersConfig: Record<WALLET_ADAPTER_TYPE, AdapterConfig> = {};
    adapterInitResults.forEach((result: string | undefined) => {
      if (result) {
        finalAdaptersConfig[result] = adaptersConfig[result];
      }
    });
    this.loginModal.addWalletLogins(finalAdaptersConfig, adaptersData, { showExternalWalletsOnly: !!options?.showExternalWalletsOnly });
  }

  private initializeInAppWallet(adapterName: string): void {
    log.info("adapterInitResults", adapterName);
    if (this.walletAdapters[adapterName].type === ADAPTER_CATEGORY.IN_APP) {
      this.loginModal.addSocialLogins(
        adapterName,
        this.adaptersConfig[adapterName],
        getAdapterSocialLogins(adapterName, this.walletAdapters[adapterName], this.adaptersConfig[adapterName]?.loginMethods)
      );
    }
  }

  private subscribeToLoginModalEvents(): void {
    this.loginModal.on(LOGIN_MODAL_EVENTS.LOGIN, async (params: { adapter: WALLET_ADAPTER_TYPE; loginParams: unknown }) => {
      await this.connectTo<unknown>(params.adapter, params.loginParams);
    });
    this.loginModal.on(LOGIN_MODAL_EVENTS.INIT_EXTERNAL_WALLETS, async (params: { externalWalletsInitialized: boolean }) => {
      await this.initExternalWalletAdapters(params.externalWalletsInitialized);
    });
    this.loginModal.on(LOGIN_MODAL_EVENTS.DISCONNECT, async () => {
      await this.logout();
    });
    this.loginModal.on(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, async (visibility: boolean) => {
      log.debug("is login modal visible", visibility);
      this.emit(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, visibility);
      if (visibility && this.status !== ADAPTER_STATUS.CONNECTING && this.status !== ADAPTER_STATUS.CONNECTED) {
        // refreshing session for wallet connect whenever modal is opened.
        this.walletAdapters[WALLET_ADAPTERS.WALLET_CONNECT_V1].connect();
      }
    });
  }
}
