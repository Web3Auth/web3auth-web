import {
  ADAPTER_CATEGORY,
  ADAPTER_EVENTS,
  ADAPTER_STATUS,
  BaseAdapterConfig,
  CHAIN_NAMESPACES,
  CustomChainConfig,
  getChainConfig,
  log,
  LoginMethodConfig,
  SafeEventEmitterProvider,
  WALLET_ADAPTER_TYPE,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import { Web3AuthNoModal, Web3AuthNoModalOptions } from "@web3auth/no-modal";
import { getAdapterSocialLogins, LOGIN_MODAL_EVENTS, LoginModal, OPENLOGIN_PROVIDERS, UIConfig } from "@web3auth/ui";

import {
  defaultEvmDappModalConfig,
  defaultEvmWalletModalConfig,
  defaultOtherModalConfig,
  defaultSolanaDappModalConfig,
  defaultSolanaWalletModalConfig,
} from "./config";
import { getDefaultAdapterModule } from "./default";
import { AdaptersModalConfig, IWeb3AuthModal, ModalConfig } from "./interface";
import { getUserLanguage } from "./utils";

export interface Web3AuthOptions extends Web3AuthNoModalOptions {
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
  uiConfig?: Omit<UIConfig, "adapterListener">;
}

export class Web3Auth extends Web3AuthNoModal implements IWeb3AuthModal {
  public loginModal: LoginModal;

  readonly options: Web3AuthOptions;

  private modalConfig: AdaptersModalConfig = defaultEvmDappModalConfig;

  constructor(options: Web3AuthOptions) {
    super(options);
    this.options = { ...options };
    const providedChainConfig = this.options.chainConfig;
    if (providedChainConfig.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      if (options.authMode === "WALLET") {
        // default config for solana wallet modal
        this.modalConfig = defaultSolanaWalletModalConfig;
      } else {
        // default config for solana dapp modal
        this.modalConfig = defaultSolanaDappModalConfig;
      }
    } else if (providedChainConfig.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      if (options.authMode === "WALLET") {
        // default config for evm wallet modal
        this.modalConfig = defaultEvmWalletModalConfig;
      } else {
        // default config for evm dapp modal
        this.modalConfig = defaultEvmDappModalConfig;
      }
    } else if (providedChainConfig.chainNamespace === CHAIN_NAMESPACES.OTHER) {
      this.modalConfig = defaultOtherModalConfig;
    } else {
      throw new Error(`Invalid chainNamespace provided: ${providedChainConfig.chainNamespace}`);
    }

    // get userLanguage
    const defaultLanguage = getUserLanguage(this.options.uiConfig?.defaultLanguage);

    this.loginModal = new LoginModal({
      theme: this.options.uiConfig?.theme,
      appName: this.options.uiConfig?.appName || "blockchain",
      appLogo: this.options.uiConfig?.appLogo || "",
      adapterListener: this,
      displayErrorsOnModal: this.options.uiConfig?.displayErrorsOnModal,
      defaultLanguage,
      modalZIndex: this.options.uiConfig?.modalZIndex || "99998",
      web3AuthNetwork: this.options.web3AuthNetwork,
      loginGridCol: this.options.uiConfig?.loginGridCol || 3,
      primaryButton: this.options.uiConfig?.primaryButton || "socialLogin",
    });
    this.subscribeToLoginModalEvents();
  }

  public async initModal(params?: { modalConfig?: Record<WALLET_ADAPTER_TYPE, ModalConfig> }): Promise<void> {
    super.checkInitRequirements();
    await this.loginModal.initModal();
    const providedChainConfig = this.options.chainConfig;

    // merge default adapters with the custom configured adapters.
    const allAdapters = [...new Set([...Object.keys(this.modalConfig.adapters || {}), ...Object.keys(this.walletAdapters)])];

    const adapterConfigurationPromises = allAdapters.map(async (adapterName) => {
      // start with the default config of adapter.
      let adapterConfig = this.modalConfig.adapters?.[adapterName] || {
        label: adapterName,
        showOnModal: true,
        showOnMobile: true,
        showOnDesktop: true,
      };

      // override the default config of adapter if some config is being provided by the user.
      if (params?.modalConfig?.[adapterName]) {
        adapterConfig = { ...adapterConfig, ...params.modalConfig[adapterName] };
      }
      (this.modalConfig.adapters as Record<WALLET_ADAPTER_TYPE, ModalConfig>)[adapterName] = adapterConfig as ModalConfig;

      // check if adapter is configured/added by user and exist in walletAdapters map.
      const adapter = this.walletAdapters[adapterName];
      log.debug("adapter config", adapterName, this.modalConfig.adapters?.[adapterName].showOnModal, adapter);

      // if adapter is not custom configured then check if it is available in default adapters.
      // and if adapter is not hidden by user
      if (!adapter && this.modalConfig.adapters?.[adapterName].showOnModal) {
        // if adapter is not configured and some default configuration is available, use it.
        const ad = await getDefaultAdapterModule({
          name: adapterName,
          customChainConfig: this.options.chainConfig,
          clientId: this.options.clientId,
          sessionTime: this.options.sessionTime,
          web3AuthNetwork: this.options.web3AuthNetwork,
        });

        this.walletAdapters[adapterName] = ad;
        return adapterName;
      } else if (adapter?.type === ADAPTER_CATEGORY.IN_APP || adapter?.type === ADAPTER_CATEGORY.EXTERNAL || adapterName === this.cachedAdapter) {
        if (!this.modalConfig.adapters?.[adapterName].showOnModal) return;
        // add client id to adapter, same web3auth client id can be used in adapter.
        // this id is being overridden if user is also passing client id in adapter's constructor.
        this.walletAdapters[adapterName].setAdapterSettings({
          clientId: this.options.clientId,
          sessionTime: this.options.sessionTime,
          web3AuthNetwork: this.options.web3AuthNetwork,
        });

        // if adapter doesn't have any chainConfig then we will set the chainConfig based of passed chainNamespace
        // and chainNamespace.
        if (!adapter.chainConfigProxy) {
          const chainConfig = {
            ...getChainConfig(providedChainConfig.chainNamespace, this.coreOptions.chainConfig?.chainId),
            ...this.coreOptions.chainConfig,
          } as CustomChainConfig;
          this.walletAdapters[adapterName].setAdapterSettings({ chainConfig });
        }

        return adapterName;
      }
    });

    let adapterNames = await Promise.all(adapterConfigurationPromises);
    const hasInAppWallets = Object.values(this.walletAdapters).some((adapter) => {
      if (adapter.type !== ADAPTER_CATEGORY.IN_APP) return false;
      if (this.modalConfig.adapters?.[adapter.name]?.showOnModal !== true) return false;
      if (!this.modalConfig.adapters?.[adapter.name]?.loginMethods) return true;
      const mergedLoginMethods = getAdapterSocialLogins(
        adapter.name,
        this.walletAdapters[adapter.name],
        (this.modalConfig.adapters as Record<WALLET_ADAPTER_TYPE, ModalConfig>)[adapter.name]?.loginMethods
      );
      if (Object.values(mergedLoginMethods).some((method: LoginMethodConfig[keyof LoginMethodConfig]) => method.showOnModal)) return true;
      return false;
    });
    log.debug(hasInAppWallets, this.walletAdapters, adapterNames, "hasInAppWallets");

    // if both wc1 and wc2 are configured, give precedence to wc2.
    if (this.walletAdapters[WALLET_ADAPTERS.WALLET_CONNECT_V1] && this.walletAdapters[WALLET_ADAPTERS.WALLET_CONNECT_V2]) {
      delete this.walletAdapters[WALLET_ADAPTERS.WALLET_CONNECT_V1];
      adapterNames = adapterNames.filter((ad) => ad !== WALLET_ADAPTERS.WALLET_CONNECT_V1);
    }
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
        if (adapter.status === ADAPTER_STATUS.NOT_READY) await adapter.init({ autoConnect: this.cachedAdapter === adapterName });
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

    const hasExternalWallets = allAdapters.some((adapterName) => {
      return this.walletAdapters[adapterName]?.type === ADAPTER_CATEGORY.EXTERNAL && this.modalConfig.adapters?.[adapterName].showOnModal;
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

  private async initExternalWalletAdapters(externalWalletsInitialized: boolean, options?: { showExternalWalletsOnly: boolean }): Promise<void> {
    if (externalWalletsInitialized) return;
    const adaptersConfig: Record<string, BaseAdapterConfig> = {};
    Object.keys(this.walletAdapters).forEach(async (adapterName) => {
      const adapter = this.walletAdapters[adapterName];
      if (adapter?.type === ADAPTER_CATEGORY.EXTERNAL) {
        log.debug("init external wallet", this.cachedAdapter, adapterName);
        this.subscribeToAdapterEvents(adapter);
        // we are not initializing cached adapter here as it is already being initialized in initModal before.
        if (this.cachedAdapter === adapterName) {
          return;
        }
        if (adapter.status === ADAPTER_STATUS.NOT_READY)
          await adapter
            .init({ autoConnect: this.cachedAdapter === adapterName })
            .then(() => {
              adaptersConfig[adapterName] = (this.modalConfig.adapters as Record<WALLET_ADAPTER_TYPE, ModalConfig>)[adapterName];
              this.loginModal.addWalletLogins(adaptersConfig, { showExternalWalletsOnly: !!options?.showExternalWalletsOnly });
              return undefined;
            })
            .catch((error) => log.error(error, "error while initializing adapter"));
      }
    });
  }

  private initializeInAppWallet(adapterName: string): void {
    log.info("adapterInitResults", adapterName);
    if (this.walletAdapters[adapterName].type === ADAPTER_CATEGORY.IN_APP) {
      this.loginModal.addSocialLogins(
        adapterName,
        getAdapterSocialLogins(
          adapterName,
          this.walletAdapters[adapterName],
          (this.modalConfig.adapters as Record<WALLET_ADAPTER_TYPE, ModalConfig>)[adapterName]?.loginMethods
        ),
        this.options.uiConfig?.loginMethodsOrder || OPENLOGIN_PROVIDERS,
        {
          ...this.options.uiConfig,
          loginGridCol: this.options.uiConfig?.loginGridCol || 3,
          primaryButton: this.options.uiConfig?.primaryButton || "socialLogin",
        }
      );
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
      const adapter = this.walletAdapters[WALLET_ADAPTERS.WALLET_CONNECT_V2] || this.walletAdapters[WALLET_ADAPTERS.WALLET_CONNECT_V1];
      if (adapter) {
        const walletConnectStatus = adapter?.status;
        log.debug("trying refreshing wc session", visibility, walletConnectStatus);
        if (visibility && (walletConnectStatus === ADAPTER_STATUS.READY || walletConnectStatus === ADAPTER_STATUS.CONNECTING)) {
          log.debug("refreshing wc session");

          // refreshing session for wallet connect whenever modal is opened.
          try {
            adapter.connect();
          } catch (error) {
            log.error(`Error while disconnecting to wallet connect in core`, error);
          }
        }
      }
    });
  }
}
