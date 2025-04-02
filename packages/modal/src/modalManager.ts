import {
  type AUTH_CONNECTION_TYPE,
  type AuthLoginParams,
  type BaseConnectorConfig,
  type ChainNamespaceType,
  cloneDeep,
  CONNECTOR_CATEGORY,
  CONNECTOR_EVENTS,
  CONNECTOR_NAMES,
  CONNECTOR_STATUS,
  fetchProjectConfig,
  fetchWalletRegistry,
  type IConnector,
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

import { defaultConnectorsModalConfig, walletRegistryUrl } from "./config";
import { type ConnectorsModalConfig, type IWeb3AuthModal, type ModalConfig } from "./interface";
import { AUTH_PROVIDERS, capitalizeFirstLetter, getUserLanguage, LOGIN_MODAL_EVENTS, LoginModal, type UIConfig } from "./ui";

export interface Web3AuthOptions extends IWeb3AuthCoreOptions {
  /**
   * Config for configuring modal ui display properties
   */
  uiConfig?: Omit<UIConfig, "connectorListener">;

  /**
   * Config for configuring modal ui display properties
   */
  modalConfig?: ConnectorsModalConfig;
}

export class Web3Auth extends Web3AuthNoModal implements IWeb3AuthModal {
  public loginModal: LoginModal;

  readonly options: Web3AuthOptions;

  private modalConfig: ConnectorsModalConfig = cloneDeep(defaultConnectorsModalConfig);

  constructor(options: Web3AuthOptions) {
    super(options);
    this.options = { ...options };

    if (!this.options.uiConfig) this.options.uiConfig = {};
    if (this.options.modalConfig) this.modalConfig = this.options.modalConfig;

    log.info("modalConfig", this.modalConfig);
  }

  public async initModal(): Promise<void> {
    super.checkInitRequirements();
    // get project config and wallet registry
    const { projectConfig, walletRegistry } = await this.getProjectAndWalletConfig();
    this.options.uiConfig = deepmerge(cloneDeep(projectConfig.whitelabel || {}), this.options.uiConfig || {});
    if (!this.options.uiConfig.defaultLanguage) this.options.uiConfig.defaultLanguage = getUserLanguage(this.options.uiConfig.defaultLanguage);
    if (!this.options.uiConfig.mode) this.options.uiConfig.mode = "light";
    this.options.uiConfig = deepmerge(projectConfig.loginModal || {}, this.options.uiConfig || {});

    // init config
    super.initAccountAbstractionConfig(projectConfig);
    super.initChainsConfig(projectConfig);
    super.initCachedConnectorAndChainId();

    // init login modal
    const { filteredWalletRegistry, disabledExternalWallets } = this.filterWalletRegistry(walletRegistry, projectConfig);
    this.loginModal = new LoginModal(
      {
        ...this.options.uiConfig,
        connectorListener: this,
        chainNamespaces: [...new Set(this.coreOptions.chains?.map((x) => x.chainNamespace) || [])],
        walletRegistry: filteredWalletRegistry,
      },
      {
        onInitExternalWallets: this.onInitExternalWallets,
        onSocialLogin: this.onSocialLogin,
        onExternalWalletLogin: this.onExternalWalletLogin,
        onModalVisibility: this.onModalVisibility,
      }
    );
    await this.loginModal.initModal();

    // setup common JRPC provider
    await this.setupCommonJRPCProvider();

    // initialize connectors
    this.on(CONNECTOR_EVENTS.CONNECTORS_UPDATED, ({ connectors: newConnectors }) =>
      this.initConnectors({ connectors: newConnectors, projectConfig, disabledExternalWallets })
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
      // remove all listeners when promise is resolved or rejected.
      // this is to prevent memory leaks if user clicks connect button multiple times.
      const handleConnected = () => {
        this.removeListener(CONNECTOR_EVENTS.ERRORED, handleError);
        this.removeListener(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, handleVisibility);
        return resolve(this.provider);
      };

      const handleError = (err: unknown) => {
        this.removeListener(CONNECTOR_EVENTS.CONNECTED, handleConnected);
        this.removeListener(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, handleVisibility);
        return reject(err);
      };

      const handleVisibility = (visibility: boolean) => {
        // modal is closed but user is not connected to any wallet.
        if (!visibility && this.status !== CONNECTOR_STATUS.CONNECTED) {
          this.removeListener(CONNECTOR_EVENTS.CONNECTED, handleConnected);
          this.removeListener(CONNECTOR_EVENTS.ERRORED, handleError);
          return reject(new Error("User closed the modal"));
        }
      };

      this.once(CONNECTOR_EVENTS.CONNECTED, handleConnected);
      this.once(CONNECTOR_EVENTS.ERRORED, handleError);
      this.once(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, handleVisibility);
    });
  }

  private filterWalletRegistry(
    walletRegistry: WalletRegistry,
    projectConfig: ProjectConfig
  ): { disabledExternalWallets: Set<string>; filteredWalletRegistry: WalletRegistry } {
    const { disableAllRecommendedWallets, disableAllOtherWallets, disabledWallets } = projectConfig.externalWalletAuth || {};

    // add disabled wallets to set
    const disabledExternalWallets = new Set(disabledWallets || []);
    if (disableAllRecommendedWallets) {
      Object.keys(walletRegistry.default).forEach((wallet) => disabledExternalWallets.add(wallet));
    }
    if (disableAllOtherWallets) {
      Object.keys(walletRegistry.others).forEach((wallet) => disabledExternalWallets.add(wallet));
    }
    // always show MetaMask, force enable it
    disabledExternalWallets.delete(WALLET_CONNECTORS.METAMASK);

    // remove wallets that are disabled in project config from wallet registry
    const filteredWalletRegistry = cloneDeep(walletRegistry);
    disabledExternalWallets.forEach((wallet) => {
      delete filteredWalletRegistry.default[wallet];
      delete filteredWalletRegistry.others[wallet];
    });
    return { disabledExternalWallets, filteredWalletRegistry };
  }

  private async getProjectAndWalletConfig() {
    // get project config
    let projectConfig: ProjectConfig;
    try {
      projectConfig = await fetchProjectConfig(
        this.options.clientId,
        this.options.web3AuthNetwork,
        this.options.accountAbstractionConfig?.smartAccountType
      );
    } catch (e) {
      log.error("Failed to fetch project configurations", e);
      throw WalletInitializationError.notReady("failed to fetch project configurations", e);
    }
    projectConfig = {
      ...projectConfig,
      loginModal: {
        ...projectConfig.loginModal,
        logoAlignment: "left",
        displayInstalledExternalWallets: false,
        displayExternalWalletsCount: false,
        signInMethods: ["passwordless", "externalWallets", "social"],
      },
    };
    // get wallet registry
    let walletRegistry: WalletRegistry = { others: {}, default: {} };
    const isExternalWalletEnabled = Boolean(projectConfig.externalWalletAuth);
    if (isExternalWalletEnabled && !this.modalConfig?.hideWalletDiscovery) {
      try {
        walletRegistry = await fetchWalletRegistry(walletRegistryUrl);
      } catch (e) {
        log.error("Failed to fetch wallet registry", e);
      }
    }
    return { projectConfig, walletRegistry };
  }

  private async initConnectors({
    connectors,
    projectConfig,
    disabledExternalWallets,
  }: {
    connectors: IConnector<unknown>[];
    projectConfig: ProjectConfig;
    disabledExternalWallets: Set<string>;
  }) {
    // filter connectors based on config
    const filteredConnectorNames = await this.filterConnectors({ projectConfig, disabledExternalWallets });

    // initialize connectors based on availability
    const { hasInAppConnectors, hasExternalConnectors } = await this.checkConnectorAvailability(filteredConnectorNames);
    const filteredConnectors = connectors.filter((x) => filteredConnectorNames.includes(x.name));
    if (hasInAppConnectors) {
      await this.initInAppAndCachedConnectors(filteredConnectors);
    }
    if (hasExternalConnectors) {
      this.loginModal.setExternalWalletConfig({
        showExternalWalletCount: projectConfig.loginModal?.displayExternalWalletsCount ?? true,
        showInstalledExternalWallets: projectConfig.loginModal?.displayInstalledExternalWallets ?? true,
      });
      if (hasInAppConnectors) {
        // show connect button if both in-app and external wallets are available
        this.loginModal.initExternalWalletContainer();
        // initialize installed external wallets (except WC), don't mark external wallets as fully initialized
        this.initExternalConnectors(
          filteredConnectors.filter((x) => x.type === CONNECTOR_CATEGORY.EXTERNAL && x.name !== WALLET_CONNECTORS.WALLET_CONNECT_V2),
          { externalWalletsInitialized: false, showExternalWalletsOnly: false, externalWalletsVisibility: false }
        );
      } else {
        // if no in app wallet is available then initialize all external wallets in modal
        await this.initExternalConnectors(
          filteredConnectors.filter((x) => x.type === CONNECTOR_CATEGORY.EXTERNAL),
          { externalWalletsInitialized: true, showExternalWalletsOnly: true, externalWalletsVisibility: true }
        );
      }
    }

    // emit ready event if connector is ready
    if (this.status === CONNECTOR_STATUS.NOT_READY) {
      this.status = CONNECTOR_STATUS.READY;
      this.emit(CONNECTOR_EVENTS.READY);
    }
  }

  private async filterConnectors({
    projectConfig,
    disabledExternalWallets,
  }: {
    projectConfig: ProjectConfig;
    disabledExternalWallets: Set<string>;
  }): Promise<string[]> {
    // Auth connector config: merge code config with config from dashboard
    const loginMethods: LoginMethodConfig = {};
    for (const authConnectionConfig of projectConfig.embeddedWalletAuth || []) {
      const { isDefault, authConnectionId, groupedAuthConnectionId, authConnection } = authConnectionConfig;
      // for custom auth connections, authConnectionId or groupedAuthConnectionId are required.
      if (!isDefault && (!authConnectionId || !groupedAuthConnectionId)) return;

      loginMethods[authConnection] = {
        name: authConnection,
        ...authConnectionConfig,
        showOnModal: true,
        showOnDesktop: true,
        showOnMobile: true,
      };
    }
    const dashboardConnectorConfig: Record<WALLET_CONNECTOR_TYPE, ModalConfig> = {
      [WALLET_CONNECTORS.AUTH]: { label: WALLET_CONNECTORS.AUTH, loginMethods },
    };
    if (this.modalConfig?.connectors?.[WALLET_CONNECTORS.AUTH]) {
      if (!this.modalConfig.connectors[WALLET_CONNECTORS.AUTH].loginMethods) this.modalConfig.connectors[WALLET_CONNECTORS.AUTH].loginMethods = {};
    }
    this.modalConfig.connectors = deepmerge(dashboardConnectorConfig, cloneDeep(this.modalConfig.connectors || {}));
    // TODO: validate modal connector config here.!!

    if (this.modalConfig?.connectors?.[WALLET_CONNECTORS.AUTH]?.loginMethods) {
      const authProviders = new Set(AUTH_PROVIDERS);
      Object.keys(this.modalConfig.connectors[WALLET_CONNECTORS.AUTH].loginMethods).forEach((key) => {
        if (!authProviders.has(key as AUTH_CONNECTION_TYPE)) {
          throw WalletInitializationError.invalidParams(`Invalid auth connection: ${key}`);
        }
      });
    }

    // merge default connectors with the custom configured connectors.
    const allConnectorNames = [
      ...new Set([...Object.keys(this.modalConfig.connectors || {}), ...this.connectors.map((connector) => connector.name)]),
    ];
    const connectorNames = allConnectorNames.map((connectorName: string) => {
      // start with the default config of connector.
      const defaultConnectorConfig = {
        label: CONNECTOR_NAMES[connectorName] || connectorName.split("-").map(capitalizeFirstLetter).join(" "),
        showOnModal: true,
        showOnMobile: true,
        showOnDesktop: true,
      };

      this.modalConfig.connectors[connectorName] = {
        ...defaultConnectorConfig,
        ...(this.modalConfig?.connectors?.[connectorName] || {}),
      };

      // check if connector is configured/added by user and exist in connectors map.
      const connector = this.getConnector(connectorName);
      log.debug("connector config", connectorName, this.modalConfig.connectors?.[connectorName]?.showOnModal, connector);

      // check if connector is configured/added by user and exist in connectors map.
      const connectorConfig = this.modalConfig.connectors?.[connectorName];
      if (!connector) {
        if (connectorConfig.showOnModal) throw WalletInitializationError.invalidParams(`Connector ${connectorName} is not configured`);
        return;
      }

      // skip connector if it is hidden by user
      if (!connectorConfig.showOnModal) return;

      // skip external connector if external wallets are disabled except for MetaMask
      const isExternalWalletEnabled = Boolean(projectConfig.externalWalletAuth);
      if (connector.type === CONNECTOR_CATEGORY.EXTERNAL && connector.name !== WALLET_CONNECTORS.METAMASK) {
        if (!isExternalWalletEnabled) return;
        if (disabledExternalWallets.has(connectorName)) return;
      }

      // skip WC connector if external wallets are disabled or hideWalletDiscovery is true
      if (connectorName === WALLET_CONNECTORS.WALLET_CONNECT_V2) {
        if (!isExternalWalletEnabled) return;
        if (this.modalConfig?.hideWalletDiscovery) return;
      }

      this.modalConfig.connectors[connectorName] = connectorConfig;
      return connectorName;
    });
    // const connectorNames = await Promise.all(connectorConfigurationPromises);
    return connectorNames.filter((name) => name !== undefined);
  }

  private async checkConnectorAvailability(connectorNames: string[]): Promise<{ hasInAppConnectors: boolean; hasExternalConnectors: boolean }> {
    // currently all default in app and external wallets can be hidden or shown based on config.
    // check if in app connectors are available
    const hasInAppConnectors = this.connectors.some((connector) => {
      if (connector.type !== CONNECTOR_CATEGORY.IN_APP) return false;
      if (this.modalConfig.connectors?.[connector.name]?.showOnModal !== true) return false;
      if (!this.modalConfig.connectors?.[connector.name]?.loginMethods) return true;
      if (Object.values(this.modalConfig.connectors[connector.name].loginMethods).some((method) => method.showOnModal)) return true;
      return false;
    });
    log.debug(hasInAppConnectors, this.connectors, connectorNames, "hasInAppWallets");

    // check if external connectors are available
    const hasExternalConnectors = connectorNames.some((connectorName) => {
      if (connectorName === WALLET_CONNECTORS.WALLET_CONNECT_V2) return true;
      return this.getConnector(connectorName)?.type === CONNECTOR_CATEGORY.EXTERNAL && this.modalConfig.connectors?.[connectorName].showOnModal;
    });
    return { hasInAppConnectors, hasExternalConnectors };
  }

  private async initInAppAndCachedConnectors(connectors: IConnector<unknown>[]) {
    await Promise.all(
      connectors.map(async (connector) => {
        const connectorName = connector.name;
        try {
          // skip if connector is already initialized
          if (connector.status !== CONNECTOR_STATUS.NOT_READY) return;

          // only initialize a external connectors here if it is a cached connector.
          if (
            this.cachedConnector !== connectorName &&
            connectorName !== WALLET_CONNECTORS.METAMASK &&
            connector.type === CONNECTOR_CATEGORY.EXTERNAL
          )
            return;

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
            const loginMethods = this.modalConfig.connectors[connectorName]?.loginMethods || {};
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
    externalConnectors: IConnector<unknown>[],
    options: { externalWalletsInitialized: boolean; showExternalWalletsOnly?: boolean; externalWalletsVisibility?: boolean }
  ): Promise<void> {
    const connectorsConfig: Record<string, BaseConnectorConfig> = {};
    // we do it like this because we don't want one slow connector to delay the load of the entire external wallet section.
    externalConnectors.forEach(async (connector) => {
      const connectorName = connector.name;
      log.debug("init external wallet", this.cachedConnector, connectorName, connector.status);
      if (connector.status === CONNECTOR_STATUS.NOT_READY) {
        // we are not initializing cached connector here as it is already being initialized in initModal before.
        if (this.cachedConnector === connectorName) return;
        try {
          this.subscribeToConnectorEvents(connector);
          const initialChain = this.getInitialChainIdForConnector(connector);
          await connector.init({ autoConnect: this.cachedConnector === connectorName, chainId: initialChain.chainId });
          const connectorModalConfig = (this.modalConfig.connectors as Record<WALLET_CONNECTOR_TYPE, ModalConfig>)[connectorName];
          connectorsConfig[connectorName] = { ...connectorModalConfig, isInjected: connector.isInjected };
          this.loginModal.addWalletLogins(connectorsConfig, {
            showExternalWalletsOnly: !!options.showExternalWalletsOnly,
            externalWalletsVisibility: !!options.externalWalletsVisibility,
            externalWalletsInitialized: !!options.externalWalletsInitialized,
          });
        } catch (error) {
          log.error(error, "error while initializing connector", connectorName);
        }
      } else {
        if (connector.status === CONNECTOR_STATUS.READY || connector.status === CONNECTOR_STATUS.CONNECTING) {
          // we use connecting status for wallet connect
          const connectorModalConfig = (this.modalConfig.connectors as Record<WALLET_CONNECTOR_TYPE, ModalConfig>)[connectorName];
          connectorsConfig[connectorName] = { ...connectorModalConfig, isInjected: connector.isInjected };
          this.loginModal.addWalletLogins(connectorsConfig, {
            showExternalWalletsOnly: !!options.showExternalWalletsOnly,
            externalWalletsVisibility: !!options.externalWalletsVisibility,
            externalWalletsInitialized: !!options.externalWalletsInitialized,
          });
        }
      }
    });
  }

  private onInitExternalWallets = async (params: { externalWalletsInitialized: boolean }): Promise<void> => {
    if (params.externalWalletsInitialized) return;
    // initialize WC connector only as other external wallets are initialized in initModal
    await this.initExternalConnectors(
      this.connectors.filter((x) => x.name === WALLET_CONNECTORS.WALLET_CONNECT_V2),
      { externalWalletsInitialized: true, externalWalletsVisibility: true }
    );
  };

  private onSocialLogin = async (params: { connector: WALLET_CONNECTOR_TYPE; loginParams: AuthLoginParams }): Promise<void> => {
    try {
      await this.connectTo<AuthLoginParams>(params.connector, params.loginParams);
    } catch (error) {
      log.error(`Error while connecting to connector: ${params.connector}`, error);
    }
  };

  private onExternalWalletLogin = async (params: {
    connector: WALLET_CONNECTOR_TYPE;
    loginParams: { chainNamespace: ChainNamespaceType };
  }): Promise<void> => {
    try {
      await this.connectTo<unknown>(params.connector, params.loginParams);
    } catch (error) {
      log.error(`Error while connecting to connector: ${params.connector}`, error);
    }
  };

  private onModalVisibility = async (visibility: boolean): Promise<void> => {
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
  };
}
