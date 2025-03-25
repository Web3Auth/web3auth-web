import {
  AUTH_CONNECTION,
  AuthLoginParams,
  type BaseConnectorConfig,
  cloneDeep,
  CONNECTOR_CATEGORY,
  CONNECTOR_EVENTS,
  CONNECTOR_NAMES,
  CONNECTOR_STATUS,
  fetchProjectConfig,
  fetchWalletRegistry,
  IConnector,
  type IProvider,
  type IWeb3AuthCoreOptions,
  log,
  type LoginMethodConfig,
  type ProjectConfig,
  type WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletInitializationError,
  type WalletRegistry,
  Web3AuthNoModal,
} from "@web3auth/no-modal";
import deepmerge from "deepmerge";

import { defaultOtherModalConfig, walletRegistryUrl } from "./config";
import { type ConnectorsModalConfig, type IWeb3AuthModal, type ModalConfig, type ModalConfigParams } from "./interface";
import {
  AUTH_PROVIDERS,
  capitalizeFirstLetter,
  getConnectorSocialLogins,
  getUserLanguage,
  LOGIN_MODAL_EVENTS,
  LoginModal,
  type UIConfig,
} from "./ui";

export interface Web3AuthOptions extends IWeb3AuthCoreOptions {
  /**
   * Config for configuring modal ui display properties
   */
  uiConfig?: Omit<UIConfig, "connectorListener">;
}

export class Web3Auth extends Web3AuthNoModal implements IWeb3AuthModal {
  public loginModal: LoginModal;

  readonly options: Web3AuthOptions;

  private modalConfig: ConnectorsModalConfig = cloneDeep(defaultOtherModalConfig);

  constructor(options: Web3AuthOptions) {
    super(options);
    this.options = { ...options };

    if (!this.options.uiConfig) this.options.uiConfig = {};
  }

  public setModalConfig(modalConfig: ConnectorsModalConfig): void {
    super.checkInitRequirements();
    this.modalConfig = modalConfig;
  }

  public async initModal(params?: ModalConfigParams): Promise<void> {
    super.checkInitRequirements();
    // get project config and wallet registry
    const { projectConfig, walletRegistry } = await this.getProjectAndWalletConfig(params);
    this.options.uiConfig = deepmerge(cloneDeep(projectConfig.whitelabel || {}), this.options.uiConfig || {});
    if (!this.options.uiConfig.defaultLanguage) this.options.uiConfig.defaultLanguage = getUserLanguage(this.options.uiConfig.defaultLanguage);
    if (!this.options.uiConfig.mode) this.options.uiConfig.mode = "light";

    // init config
    super.initAccountAbstractionConfig(projectConfig);
    super.initChainsConfig(projectConfig);
    super.initCachedConnectorAndChainId();

    // init login modal
    this.loginModal = new LoginModal({
      ...this.options.uiConfig,
      connectorListener: this,
      chainNamespaces: [...new Set(this.coreOptions.chains?.map((x) => x.chainNamespace) || [])],
      walletRegistry,
    });
    this.subscribeToLoginModalEvents();
    await this.loginModal.initModal();

    // setup common JRPC provider
    await this.setupCommonJRPCProvider();

    // initialize connectors
    this.on(CONNECTOR_EVENTS.CONNECTORS_UPDATED, ({ connectors: newConnectors }) =>
      this.initConnectors({ connectors: newConnectors, projectConfig, modalConfig: params })
    );
    await this.loadConnectors({ projectConfig });

    // initialize plugins
    await this.initPlugins();
  }

  public async connect(): Promise<IProvider | null> {
    if (!this.loginModal) throw WalletInitializationError.notReady("Login modal is not initialized");
    // if already connected return provider
    if (this.connectedConnectorName && this.status === CONNECTOR_STATUS.CONNECTED && this.provider) return this.provider;
    this.loginModal.open();
    return new Promise((resolve, reject) => {
      this.once(CONNECTOR_EVENTS.CONNECTED, () => {
        return resolve(this.provider);
      });
      this.once(CONNECTOR_EVENTS.ERRORED, (err: unknown) => {
        return reject(err);
      });
      this.once(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, (visibility: boolean) => {
        // modal is closed but user is not connected to any wallet.
        if (!visibility && this.status !== CONNECTOR_STATUS.CONNECTED) {
          return reject(new Error("User closed the modal"));
        }
      });
    });
  }

  private async getProjectAndWalletConfig(params?: ModalConfigParams) {
    // get project config
    let projectConfig: ProjectConfig;
    try {
      projectConfig = await fetchProjectConfig(
        this.options.clientId,
        this.options.web3AuthNetwork,
        this.options.accountAbstractionConfig?.smartAccountType
      );
      // TODO: we're using mock project config to test, remove this before production
      // projectConfig = {
      //   ...projectConfig,
      //   chains: [
      //     {
      //       chainId: "0x1",
      //       enabled: true,
      //       config: getChainConfig("eip155", "0x1", this.options.clientId),
      //     },
      //     {
      //       chainId: "0x65",
      //       enabled: true,
      //       config: getChainConfig("solana", "0x65", this.options.clientId),
      //     },
      //     {
      //       chainId: "0x67",
      //       enabled: false,
      //       config: getChainConfig("solana", "0x67", this.options.clientId),
      //     },
      //   ],
      //   walletUi: {
      //     confirmationModalEnabled: true,
      //     portfolioWidgetEnabled: true,
      //     portfolioWidgetPosition: "bottom-left",
      //     defaultPortfolio: "token",
      //     tokenDisplayEnabled: true,
      //     nftDisplayEnabled: true,
      //     walletConnectEnabled: true,
      //     buyButtonEnabled: true,
      //     sendButtonEnabled: true,
      //     swapButtonEnabled: true,
      //     receiveButtonEnabled: true,
      //     showAllTokensButtonEnabled: true,
      //   },
      //   smartAccounts: {
      //     enabled: true,
      //     config: {
      //       walletScope: "all",
      //       smartAccountType: "safe",
      //       chains: [
      //         {
      //           chainId: "0xaa36a7",
      //           bundlerConfig: {
      //             url: "https://api.pimlico.io/v2/11155111/rpc?apikey=pim_9ZMPA69qJ1BP19kt3Pi3Ro",
      //           },
      //         },
      //         {
      //           chainId: "0x1",
      //           bundlerConfig: {
      //             url: "https://api.pimlico.io/v2/1/rpc?apikey=pim_9ZMPA69qJ1BP19kt3Pi3Ro",
      //           },
      //         },
      //       ],
      //     },
      //   },
      //   externalWalletLogin: {
      //     enabled: true,
      //     config: [
      //       { wallet: "phantom", enabled: false },
      //       { wallet: "trust", enabled: false },
      //     ],
      //   },
      // };
    } catch (e) {
      log.error("Failed to fetch project configurations", e);
      throw WalletInitializationError.notReady("failed to fetch project configurations", e);
    }

    // get wallet registry
    let walletRegistry: WalletRegistry = { others: {}, default: {} };
    const isExternalWalletEnabled = projectConfig.externalWalletLogin?.enabled ?? true;
    if (!params?.hideWalletDiscovery && isExternalWalletEnabled) {
      try {
        walletRegistry = await fetchWalletRegistry(walletRegistryUrl);

        // remove wallets that are disabled in project config from wallet registry
        (projectConfig.externalWalletLogin?.config || []).forEach(({ wallet, enabled }) => {
          if (!enabled) {
            delete walletRegistry.default[wallet];
            delete walletRegistry.others[wallet];
          }
        });
      } catch (e) {
        log.error("Failed to fetch wallet registry", e);
      }
    }
    return { projectConfig, walletRegistry };
  }

  private async initConnectors({
    connectors,
    projectConfig,
    modalConfig,
  }: {
    connectors: IConnector<unknown>[];
    projectConfig: ProjectConfig;
    modalConfig: ModalConfigParams;
  }) {
    // filter connectors based on config
    const filteredConnectorNames = await this.filterConnectors(modalConfig, projectConfig);

    // initialize connectors based on availability
    const { hasInAppConnectors, hasExternalConnectors } = await this.checkConnectorAvailability(filteredConnectorNames, modalConfig);
    if (hasInAppConnectors) {
      await this.initInAppAndCachedConnectors(connectors, filteredConnectorNames);
      // show connect button if external wallets are available
      if (hasExternalConnectors) this.loginModal.initExternalWalletContainer();
    } else if (hasExternalConnectors) {
      // if no in app wallet is available then initialize external wallets in modal
      await this.initExternalConnectors(connectors, false, { showExternalWalletsOnly: true });
    }

    // emit ready event if connector is ready
    if (this.status === CONNECTOR_STATUS.NOT_READY) {
      this.status = CONNECTOR_STATUS.READY;
      this.emit(CONNECTOR_EVENTS.READY);
    }
  }

  private async filterConnectors(params: ModalConfigParams, projectConfig: ProjectConfig): Promise<string[]> {
    // update auth connector config
    const { sms_otp_enabled: smsOtpEnabled } = projectConfig;
    if (smsOtpEnabled !== undefined) {
      // TODO: use the new login config method
      const connectorConfig: Record<WALLET_CONNECTOR_TYPE, ModalConfig> = {
        [WALLET_CONNECTORS.AUTH]: {
          label: WALLET_CONNECTORS.AUTH,
          loginMethods: {
            [AUTH_CONNECTION.SMS_PASSWORDLESS]: {
              name: AUTH_CONNECTION.SMS_PASSWORDLESS,
              showOnModal: smsOtpEnabled,
              showOnDesktop: smsOtpEnabled,
              showOnMobile: smsOtpEnabled,
            },
          },
        },
      };
      if (!params?.modalConfig) params = { modalConfig: {} };
      const localSmsOtpEnabled = params.modalConfig[WALLET_CONNECTORS.AUTH]?.loginMethods?.[AUTH_CONNECTION.SMS_PASSWORDLESS]?.showOnModal;
      if (localSmsOtpEnabled === true && smsOtpEnabled === false) {
        throw WalletInitializationError.invalidParams("must enable sms otp on dashboard in order to utilise it");
      }
      params.modalConfig = deepmerge(connectorConfig, cloneDeep(params.modalConfig));
    }

    // external wallets config
    const isExternalWalletEnabled = projectConfig.externalWalletLogin?.enabled ?? true;
    const disabledExternalWallets = new Set(
      (projectConfig.externalWalletLogin?.config || []).filter(({ enabled }) => !enabled).map(({ wallet }) => wallet)
    );

    // merge default connectors with the custom configured connectors.
    const allConnectorNames = [
      ...new Set([...Object.keys(this.modalConfig.connectors || {}), ...this.connectors.map((connector) => connector.name)]),
    ];
    const connectorConfigurationPromises = allConnectorNames.map(async (connectorName) => {
      // start with the default config of connector.
      let connectorConfig = this.modalConfig.connectors?.[connectorName] || {
        label: CONNECTOR_NAMES[connectorName] || connectorName.split("-").map(capitalizeFirstLetter).join(" "),
        showOnModal: true,
        showOnMobile: true,
        showOnDesktop: true,
      };
      // override the default config of connector if some config is being provided by the user.
      if (params?.modalConfig?.[connectorName]) {
        connectorConfig = { ...connectorConfig, ...params.modalConfig[connectorName] };
      }

      // check if connector is configured/added by user and exist in connectors map.
      const connector = this.getConnector(connectorName);
      log.debug("connector config", connectorName, connectorConfig.showOnModal, connector);

      // if connector is not custom configured then check if it is available in default connectors.
      // and if connector is not hidden by user
      if (!connector) {
        if (connectorConfig.showOnModal) throw WalletInitializationError.invalidParams(`Connector ${connectorName} is not configured`);
        return;
      }
      // skip connector if it is hidden by user
      if (!connectorConfig.showOnModal) return;

      // skip connector if it is external and external wallets are disabled or it is disabled in project config
      const isExternalWallet = connector.type === CONNECTOR_CATEGORY.EXTERNAL || connectorName === WALLET_CONNECTORS.WALLET_CONNECT_V2;
      if (isExternalWallet && (!isExternalWalletEnabled || disabledExternalWallets.has(connectorName))) return;

      this.modalConfig.connectors[connectorName] = connectorConfig;
      return connectorName;
    });
    const connectorNames = await Promise.all(connectorConfigurationPromises);
    return connectorNames.filter((name) => name !== undefined);
  }

  private async checkConnectorAvailability(
    connectorNames: string[],
    modalConfig: ModalConfigParams
  ): Promise<{ hasInAppConnectors: boolean; hasExternalConnectors: boolean }> {
    // currently all default in app and external wallets can be hidden or shown based on config.
    // check if in app connectors are available
    const hasInAppConnectors = this.connectors.some((connector) => {
      if (connector.type !== CONNECTOR_CATEGORY.IN_APP) return false;
      if (this.modalConfig.connectors?.[connector.name]?.showOnModal !== true) return false;
      if (!this.modalConfig.connectors?.[connector.name]?.loginMethods) return true;
      const mergedLoginMethods = getConnectorSocialLogins(
        connector.name,
        (this.modalConfig.connectors as Record<WALLET_CONNECTOR_TYPE, ModalConfig>)[connector.name]?.loginMethods
      );
      if (Object.values(mergedLoginMethods).some((method: LoginMethodConfig[keyof LoginMethodConfig]) => method.showOnModal)) return true;
      return false;
    });
    log.debug(hasInAppConnectors, this.connectors, connectorNames, "hasInAppWallets");

    // check if external connectors are available
    const hasExternalConnectors = connectorNames.some((connectorName) => {
      // if wallet connect connector is available but hideWalletDiscovery is true then don't consider it as external wallet
      if (connectorName === WALLET_CONNECTORS.WALLET_CONNECT_V2 && modalConfig?.hideWalletDiscovery) return false;
      return this.getConnector(connectorName)?.type === CONNECTOR_CATEGORY.EXTERNAL && this.modalConfig.connectors?.[connectorName].showOnModal;
    });
    return { hasInAppConnectors, hasExternalConnectors };
  }

  private async initInAppAndCachedConnectors(connectors: IConnector<unknown>[], connectorNames: string[]) {
    await Promise.all(
      connectorNames.map(async (connectorName) => {
        const connector = connectors.find((x) => x.name === connectorName);
        if (!connector) return;
        try {
          // skip if connector is already initialized
          if (connector.status !== CONNECTOR_STATUS.NOT_READY) return;

          // only initialize a external connectors here if it is a cached connector.
          if (this.cachedConnector !== connectorName && connector.type === CONNECTOR_CATEGORY.EXTERNAL) return;

          // in-app wallets or cached wallet (being connected or already connected) are initialized first.
          // if connector is configured then only initialize in app or cached connector.
          // external wallets are initialized on INIT_EXTERNAL_WALLET event.
          this.subscribeToConnectorEvents(connector);
          const initialChain = this.getInitialChainIdForConnector(connector);
          await connector.init({ autoConnect: this.cachedConnector === connectorName, chainId: initialChain.chainId });

          // note: not adding cachedWallet to modal if it is external wallet.
          // adding it later if no in-app wallets are available.
          if (connector.type === CONNECTOR_CATEGORY.IN_APP) {
            log.info("connectorInitResults", connectorName);
            const loginMethods = getConnectorSocialLogins(
              connectorName,
              (this.modalConfig.connectors as Record<WALLET_CONNECTOR_TYPE, ModalConfig>)[connectorName]?.loginMethods
            );
            this.loginModal.addSocialLogins(connectorName, loginMethods, this.options.uiConfig?.loginMethodsOrder || AUTH_PROVIDERS, {
              ...this.options.uiConfig,
              loginGridCol: this.options.uiConfig?.loginGridCol || 3,
              primaryButton: this.options.uiConfig?.primaryButton || "socialLogin",
            });
          }
        } catch (error) {
          log.error(error, "error while initializing connector ", connectorName);
        }
      })
    );
  }

  private async initExternalConnectors(
    connectors: IConnector<unknown>[],
    externalWalletsInitialized: boolean,
    options?: { showExternalWalletsOnly: boolean }
  ): Promise<void> {
    if (externalWalletsInitialized) return;
    const connectorsConfig: Record<string, BaseConnectorConfig> = {};
    // we do it like this because we don't want one slow connector to delay the load of the entire external wallet section.
    connectors.forEach(async (connector) => {
      const connectorName = connector.name;
      if (connector?.type === CONNECTOR_CATEGORY.EXTERNAL) {
        log.debug("init external wallet", this.cachedConnector, connectorName, connector.status);
        this.subscribeToConnectorEvents(connector);
        // we are not initializing cached connector here as it is already being initialized in initModal before.
        if (this.cachedConnector === connectorName) {
          return;
        }
        if (connector.status === CONNECTOR_STATUS.NOT_READY) {
          try {
            const initialChain = this.getInitialChainIdForConnector(connector);
            await connector.init({ autoConnect: this.cachedConnector === connectorName, chainId: initialChain.chainId });
            const connectorModalConfig = (this.modalConfig.connectors as Record<WALLET_CONNECTOR_TYPE, ModalConfig>)[connectorName];
            connectorsConfig[connectorName] = { ...connectorModalConfig, isInjected: connector.isInjected };
            this.loginModal.addWalletLogins(connectorsConfig, { showExternalWalletsOnly: !!options?.showExternalWalletsOnly });
          } catch (error) {
            log.error(error, "error while initializing connector", connectorName);
          }
        } else if (connector.status === CONNECTOR_STATUS.READY || connector.status === CONNECTOR_STATUS.CONNECTING) {
          // we use connecting status for wallet connect
          const connectorModalConfig = (this.modalConfig.connectors as Record<WALLET_CONNECTOR_TYPE, ModalConfig>)[connectorName];
          connectorsConfig[connectorName] = { ...connectorModalConfig, isInjected: connector.isInjected };
          this.loginModal.addWalletLogins(connectorsConfig, { showExternalWalletsOnly: !!options?.showExternalWalletsOnly });
        }
      }
    });
  }

  private subscribeToLoginModalEvents(): void {
    this.loginModal.on(LOGIN_MODAL_EVENTS.EXTERNAL_WALLET_LOGIN, async (params: { connector: WALLET_CONNECTOR_TYPE }) => {
      try {
        await this.connectTo<unknown>(params.connector);
      } catch (error) {
        log.error(`Error while connecting to connector: ${params.connector}`, error);
      }
    });

    this.loginModal.on(LOGIN_MODAL_EVENTS.SOCIAL_LOGIN, async (params: { connector: WALLET_CONNECTOR_TYPE; loginParams: AuthLoginParams }) => {
      try {
        await this.connectTo<AuthLoginParams>(params.connector, params.loginParams);
      } catch (error) {
        log.error(`Error while connecting to connector: ${params.connector}`, error);
      }
    });
    this.loginModal.on(LOGIN_MODAL_EVENTS.INIT_EXTERNAL_WALLETS, async (params: { externalWalletsInitialized: boolean }) => {
      await this.initExternalConnectors(this.connectors, params.externalWalletsInitialized);
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
      const wcConnector = this.getConnector(WALLET_CONNECTORS.WALLET_CONNECT_V2);
      if (wcConnector) {
        const walletConnectStatus = wcConnector?.status;
        log.debug("trying refreshing wc session", visibility, walletConnectStatus);
        if (visibility && (walletConnectStatus === CONNECTOR_STATUS.READY || walletConnectStatus === CONNECTOR_STATUS.CONNECTING)) {
          log.debug("refreshing wc session");

          // refreshing session for wallet connect whenever modal is opened.
          try {
            const initialChain = this.getInitialChainIdForConnector(wcConnector);
            wcConnector.connect({ chainId: initialChain.chainId });
          } catch (error) {
            log.error(`Error while disconnecting to wallet connect in core`, error);
          }
        }
        if (
          !visibility &&
          this.status === CONNECTOR_STATUS.CONNECTED &&
          (walletConnectStatus === CONNECTOR_STATUS.READY || walletConnectStatus === CONNECTOR_STATUS.CONNECTING)
        ) {
          log.debug("this stops wc connector from trying to reconnect once proposal expires");
          wcConnector.status = CONNECTOR_STATUS.READY;
        }
      }
    });
  }
}
