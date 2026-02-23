import { AuthConnectionConfigItem, serializeError } from "@web3auth/auth";
import {
  ANALYTICS_EVENTS,
  ANALYTICS_SDK_TYPE,
  type AUTH_CONNECTION_TYPE,
  type AuthConnectorType,
  type AuthLoginParams,
  type BaseConnectorConfig,
  type ChainNamespaceType,
  cloneDeep,
  CONNECTED_STATUSES,
  CONNECTOR_CATEGORY,
  CONNECTOR_EVENTS,
  CONNECTOR_INITIAL_AUTHENTICATION_MODE,
  CONNECTOR_NAMES,
  CONNECTOR_NAMESPACES,
  CONNECTOR_STATUS,
  CONNECTOR_STATUS_TYPE,
  fetchProjectConfig,
  fetchWalletRegistry,
  getErrorAnalyticsProperties,
  type IConnector,
  type IProvider,
  type IWeb3AuthCoreOptions,
  IWeb3AuthState,
  log,
  LOGIN_MODE,
  type LoginMethodConfig,
  type ProjectConfig,
  sdkVersion,
  type WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WALLET_REGISTRY_URL,
  WalletInitializationError,
  type WalletRegistry,
  Web3AuthNoModal,
  withAbort,
} from "@web3auth/no-modal";
import deepmerge from "deepmerge";

import { defaultConnectorsModalConfig } from "./config";
import { type ConnectorsModalConfig, type IWeb3AuthModal, type ModalConfig } from "./interface";
import { AUTH_PROVIDERS, AUTH_PROVIDERS_NAMES, capitalizeFirstLetter, getUserLanguage, LOGIN_MODAL_EVENTS, LoginModal, type UIConfig } from "./ui";

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

  constructor(options: Web3AuthOptions, initialState?: IWeb3AuthState) {
    super(options, initialState);
    this.options = { ...options };

    if (!this.options.uiConfig) this.options.uiConfig = {};
    if (this.options.modalConfig) this.modalConfig = this.options.modalConfig;

    log.info("modalConfig", this.modalConfig);
  }

  public async init(options?: { signal?: AbortSignal }): Promise<void> {
    // init analytics
    const startTime = Date.now();
    this.analytics.init();
    this.analytics.identify(this.options.clientId, {
      web3auth_client_id: this.options.clientId,
      web3auth_network: this.options.web3AuthNetwork,
    });
    this.analytics.setGlobalProperties({
      dapp_url: window.location.origin,
      sdk_name: ANALYTICS_SDK_TYPE.WEB_MODAL,
      sdk_version: sdkVersion,
      // Required for organization analytics
      web3auth_client_id: this.options.clientId,
      web3auth_network: this.options.web3AuthNetwork,
    });
    let trackData: Record<string, unknown> = {};

    try {
      const { signal } = options || {};

      super.checkInitRequirements();
      // get project config and wallet registry
      const { projectConfig, walletRegistry } = await this.getProjectAndWalletConfig();

      // init config
      this.initUIConfig(projectConfig);
      super.initAccountAbstractionConfig(projectConfig);
      super.initChainsConfig(projectConfig);
      super.initCachedConnectorAndChainId();
      super.initWalletServicesConfig(projectConfig);
      super.initSessionTimeConfig(projectConfig);
      this.analytics.setGlobalProperties({ team_id: projectConfig.teamId });
      trackData = this.getInitializationTrackData();

      // init login modal
      const { filteredWalletRegistry, disabledExternalWallets } = this.filterWalletRegistry(walletRegistry, projectConfig);
      this.loginModal = new LoginModal(
        {
          ...this.options.uiConfig,
          connectorListener: this,
          web3authClientId: this.options.clientId,
          web3authNetwork: this.options.web3AuthNetwork,
          authBuildEnv: this.options.authBuildEnv,
          chainNamespaces: this.getChainNamespaces(),
          walletRegistry: filteredWalletRegistry,
          analytics: this.analytics,
          initialAuthenticationMode: this.options.initialAuthenticationMode,
        },
        {
          onInitExternalWallets: this.onInitExternalWallets,
          onSocialLogin: this.onSocialLogin,
          onExternalWalletLogin: this.onExternalWalletLogin,
          onModalVisibility: this.onModalVisibility,
          onMobileVerifyConnect: this.onMobileVerifyConnect,
        }
      );
      await withAbort(() => this.loginModal.initModal(), signal);

      // setup common JRPC provider
      await withAbort(() => this.setupCommonJRPCProvider(), signal);

      // initialize connectors
      this.on(CONNECTOR_EVENTS.CONNECTORS_UPDATED, ({ connectors: newConnectors }) => {
        const onAbortHandler = () => {
          log.debug("init aborted");
          if (this.connectors?.length > 0) {
            super.cleanup();
          }
        };
        withAbort(() => this.initConnectors({ connectors: newConnectors, projectConfig, disabledExternalWallets }), signal, onAbortHandler);
      });

      await withAbort(() => super.loadConnectors({ projectConfig, modalMode: true }), signal);

      // initialize plugins
      await withAbort(() => super.initPlugins(), signal);

      // track completion event
      const authConnector = this.getConnector(WALLET_CONNECTORS.AUTH) as AuthConnectorType;
      trackData = {
        ...trackData,
        connectors: this.connectors.map((connector) => connector.name),
        plugins: Object.keys(this.plugins),
        auth_ux_mode: authConnector?.authInstance?.options?.uxMode || this.coreOptions.uiConfig?.uxMode,
      };
      this.analytics.track(ANALYTICS_EVENTS.SDK_INITIALIZATION_COMPLETED, {
        ...trackData,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      // track failure event
      this.analytics.track(ANALYTICS_EVENTS.SDK_INITIALIZATION_FAILED, {
        ...trackData,
        ...getErrorAnalyticsProperties(error),
        duration: Date.now() - startTime,
      });
      log.error("Failed to initialize modal", error);
      throw error;
    }
  }

  public async connect(): Promise<IProvider | null> {
    if (!this.loginModal) throw WalletInitializationError.notReady("Login modal is not initialized");
    // if already connected return provider
    if (this.connectedConnectorName && CONNECTED_STATUSES.includes(this.status) && this.provider) return this.provider;
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
        this.removeListener(CONNECTOR_EVENTS.AUTHORIZED, handleConnected);
        this.removeListener(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, handleVisibility);
        return reject(err);
      };

      const handleVisibility = (visibility: boolean) => {
        // modal is closed but user is not connected to any wallet.
        if (!visibility && !CONNECTED_STATUSES.includes(this.status)) {
          this.removeListener(CONNECTOR_EVENTS.CONNECTED, handleConnected);
          this.removeListener(CONNECTOR_EVENTS.ERRORED, handleError);
          this.removeListener(CONNECTOR_EVENTS.AUTHORIZED, handleConnected);
          return reject(new Error("User closed the modal"));
        }
      };

      if (this.coreOptions.initialAuthenticationMode === CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN) {
        this.once(CONNECTOR_EVENTS.AUTHORIZED, handleConnected);
      } else {
        this.once(CONNECTOR_EVENTS.CONNECTED, handleConnected);
      }

      this.once(CONNECTOR_EVENTS.ERRORED, handleError);
      this.once(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, handleVisibility);
    });
  }

  protected initUIConfig(projectConfig: ProjectConfig) {
    super.initUIConfig(projectConfig);
    this.options.uiConfig = deepmerge(cloneDeep(projectConfig.whitelabel || {}), this.options.uiConfig || {});
    if (!this.options.uiConfig.defaultLanguage) this.options.uiConfig.defaultLanguage = getUserLanguage(this.options.uiConfig.defaultLanguage);
    if (!this.options.uiConfig.mode) this.options.uiConfig.mode = "light";
    this.options.uiConfig = deepmerge(projectConfig.loginModal || {}, this.options.uiConfig, {
      arrayMerge: (_, sourceArray) => sourceArray,
    });

    // merge login methods order from project config and user config, with user config taking precedence
    const defaultAuthConnections = projectConfig.embeddedWalletAuth.filter((x) => x.isDefault).map((x) => x.authConnection);
    const mergedAuthConnections = [...(this.options.uiConfig.loginMethodsOrder || []), ...defaultAuthConnections];
    const loginMethodsOrder = [];
    const authConnectionSet = new Set();
    for (const authConnection of mergedAuthConnections) {
      if (authConnectionSet.has(authConnection)) continue;
      authConnectionSet.add(authConnection);
      loginMethodsOrder.push(authConnection);
    }
    this.options.uiConfig.loginMethodsOrder = loginMethodsOrder;
  }

  protected getInitializationTrackData(): Record<string, unknown> {
    return {
      ...super.getInitializationTrackData(),
      modal_hide_wallet_discovery: this.modalConfig?.hideWalletDiscovery,
      modal_connectors: Object.keys(this.modalConfig?.connectors || {}),
      modal_auth_connector_login_methods: Object.keys(this.modalConfig?.connectors?.[WALLET_CONNECTORS.AUTH]?.loginMethods || {}),
      // UI config
      ui_login_methods_order: this.options.uiConfig?.loginMethodsOrder,
      ui_modal_z_index: this.options.uiConfig?.modalZIndex,
      ui_display_errors_on_modal: this.options.uiConfig?.displayErrorsOnModal,
      ui_login_grid_col: this.options.uiConfig?.loginGridCol,
      ui_primary_button: this.options.uiConfig?.primaryButton,
      ui_modal_widget_type: this.options.uiConfig?.widgetType,
      ui_modal_target_id_used: Boolean(this.options.uiConfig?.targetId),
      ui_modal_logo_alignment: this.options.uiConfig?.logoAlignment,
      ui_modal_border_radius_type: this.options.uiConfig?.borderRadiusType,
      ui_modal_button_radius_type: this.options.uiConfig?.buttonRadiusType,
      ui_modal_sign_in_methods: this.options.uiConfig?.signInMethods,
      ui_modal_add_previous_login_hint: this.options.uiConfig?.addPreviousLoginHint,
      ui_modal_display_installed_external_wallets: this.options.uiConfig?.displayInstalledExternalWallets,
      ui_modal_display_external_wallets_count: this.options.uiConfig?.displayExternalWalletsCount,
    };
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
    const [projectConfigResult, walletRegistryResult] = await Promise.allSettled([
      fetchProjectConfig({
        clientId: this.options.clientId,
        web3AuthNetwork: this.options.web3AuthNetwork,
        aaProvider: this.options.accountAbstractionConfig?.smartAccountType,
        authBuildEnv: this.options.authBuildEnv,
      }),
      fetchWalletRegistry(WALLET_REGISTRY_URL),
    ]);

    // handle project config result
    if (projectConfigResult.status === "rejected") {
      const error = await serializeError(projectConfigResult.reason);
      log.error("Failed to fetch project configurations", error);
      throw WalletInitializationError.notReady("failed to fetch project configurations", error);
    }
    const projectConfig = projectConfigResult.value;

    // handle wallet registry result
    let walletRegistry: WalletRegistry = { others: {}, default: {} };
    const isExternalWalletEnabled = Boolean(projectConfig.externalWalletAuth);
    if (isExternalWalletEnabled && !this.modalConfig?.hideWalletDiscovery) {
      if (walletRegistryResult.status === "fulfilled") {
        walletRegistry = walletRegistryResult.value;
      } else {
        log.error("Failed to fetch wallet registry", walletRegistryResult.reason);
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
    const filteredConnectors = connectors.filter((x) => filteredConnectorNames.includes(x.name as WALLET_CONNECTOR_TYPE));

    // initialize in-app and cached connector (if there are only external connectors enabled)
    await this.initInAppAndCachedConnectors(filteredConnectors);

    if (hasExternalConnectors) {
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
  }): Promise<WALLET_CONNECTOR_TYPE[]> {
    // Auth connector config: populate this with the default config for auth connectors.
    const loginMethods: LoginMethodConfig = {};
    const embedWalletConfigMap: Map<string, AuthConnectionConfigItem & { isDefault?: boolean }> = new Map();
    for (const authConnectionConfig of projectConfig.embeddedWalletAuth || []) {
      const { isDefault, authConnection, groupedAuthConnectionId, authConnectionId } = authConnectionConfig;
      if (isDefault) {
        loginMethods[authConnection] = {
          name: AUTH_PROVIDERS_NAMES[authConnection],
          authConnection: authConnection as AUTH_CONNECTION_TYPE,
          authConnectionId: authConnectionId,
          groupedAuthConnectionId: groupedAuthConnectionId,
          extraLoginOptions: authConnectionConfig.jwtParameters,
          isDefault: true,
          showOnModal: true,
        };
      }
      const id = this.getCombinedConnectionId(authConnectionId, groupedAuthConnectionId);
      embedWalletConfigMap.set(id, authConnectionConfig);
    }

    const dashboardConnectorConfig = {
      [WALLET_CONNECTORS.AUTH]: { label: WALLET_CONNECTORS.AUTH, loginMethods },
    } as Record<WALLET_CONNECTOR_TYPE, ModalConfig>;

    // populate the user config data with the dashboard config.
    if (this.modalConfig?.connectors?.[WALLET_CONNECTORS.AUTH]) {
      if (!this.modalConfig.connectors[WALLET_CONNECTORS.AUTH].loginMethods) this.modalConfig.connectors[WALLET_CONNECTORS.AUTH].loginMethods = {};
    }

    const authProviders = new Set(AUTH_PROVIDERS);
    Object.keys(this.modalConfig.connectors[WALLET_CONNECTORS.AUTH].loginMethods).forEach((key) => {
      const userConfig = this.modalConfig.connectors[WALLET_CONNECTORS.AUTH].loginMethods[key as AUTH_CONNECTION_TYPE];
      const { authConnectionId, groupedAuthConnectionId } = userConfig;
      if (!authProviders.has(key as AUTH_CONNECTION_TYPE)) {
        throw WalletInitializationError.invalidParams(`Invalid auth connection: ${key}`);
      }

      // only throw error if one of them is defined in the config.
      if (groupedAuthConnectionId || authConnectionId) {
        const id = this.getCombinedConnectionId(authConnectionId, groupedAuthConnectionId);
        if (!embedWalletConfigMap.has(id))
          throw WalletInitializationError.invalidParams(
            `Invalid auth connection config, authConnection: ${key}. Missing AuthConnectionConfig from the dashboard.`
          );

        const configFromDashboard = embedWalletConfigMap.get(id);
        this.modalConfig.connectors[WALLET_CONNECTORS.AUTH].loginMethods[key as AUTH_CONNECTION_TYPE] = {
          ...userConfig,
          authConnection: configFromDashboard.authConnection,
          authConnectionId: configFromDashboard.authConnectionId,
          groupedAuthConnectionId: configFromDashboard.groupedAuthConnectionId,
          isDefault: configFromDashboard.isDefault || false,
          extraLoginOptions: {
            ...configFromDashboard.jwtParameters,
            ...userConfig.extraLoginOptions,
          },
        };
      }
    });

    this.modalConfig.connectors = deepmerge(dashboardConnectorConfig, cloneDeep(this.modalConfig.connectors || {}));

    // merge default connectors with the custom configured connectors.
    const allConnectorNames = [
      ...new Set([...Object.keys(this.modalConfig.connectors || {}), ...this.connectors.map((connector) => connector.name)]),
    ] as WALLET_CONNECTOR_TYPE[];

    const connectorNames = allConnectorNames.map((connectorName: WALLET_CONNECTOR_TYPE) => {
      // start with the default config of connector.
      const defaultConnectorConfig = {
        label: CONNECTOR_NAMES[connectorName] || connectorName.split("-").map(capitalizeFirstLetter).join(" "),
        showOnModal: true,
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

  private async checkConnectorAvailability(
    connectorNames: WALLET_CONNECTOR_TYPE[]
  ): Promise<{ hasInAppConnectors: boolean; hasExternalConnectors: boolean }> {
    // currently all default in app and external wallets can be hidden or shown based on config.
    // check if in app connectors are available
    const hasInAppConnectors = this.connectors.some((connector) => {
      if (connector.type !== CONNECTOR_CATEGORY.IN_APP) return false;
      if (this.modalConfig.connectors?.[connector.name as WALLET_CONNECTOR_TYPE]?.showOnModal !== true) return false;
      if (!this.modalConfig.connectors?.[connector.name as WALLET_CONNECTOR_TYPE]?.loginMethods) return true;
      if (Object.values(this.modalConfig.connectors[connector.name as WALLET_CONNECTOR_TYPE].loginMethods).some((method) => method.showOnModal))
        return true;
      return false;
    });
    log.debug(hasInAppConnectors, this.connectors, connectorNames, "hasInAppWallets");

    // check if external connectors are available
    const hasExternalConnectors = connectorNames.some((connectorName) => {
      if (connectorName === WALLET_CONNECTORS.WALLET_CONNECT_V2) return true;
      return (
        this.getConnector(connectorName)?.type === CONNECTOR_CATEGORY.EXTERNAL &&
        this.modalConfig.connectors?.[connectorName as WALLET_CONNECTOR_TYPE]?.showOnModal
      );
    });
    return { hasInAppConnectors, hasExternalConnectors };
  }

  private async initInAppAndCachedConnectors(connectors: IConnector<unknown>[]) {
    await Promise.all(
      connectors.map(async (connector) => {
        const connectorName = connector.name as WALLET_CONNECTOR_TYPE;
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
          const autoConnect = super.checkIfAutoConnect(connector);
          await connector.init({
            autoConnect,
            chainId: initialChain.chainId,
            getIdentityToken: this.options.initialAuthenticationMode === CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN,
          });

          // note: not adding cachedWallet to modal if it is external wallet.
          // adding it later if no in-app wallets are available.
          if (connector.type === CONNECTOR_CATEGORY.IN_APP) {
            log.info("connectorInitResults", connectorName);
            const loginMethods = this.modalConfig.connectors[connectorName]?.loginMethods || {};
            this.loginModal.addSocialLogins(loginMethods, this.options.uiConfig?.loginMethodsOrder || AUTH_PROVIDERS, {
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
    const connectorChainNamespaceMap: Record<string, Set<ChainNamespaceType>> = {};

    // we do it like this because we don't want one slow connector to delay the load of the entire external wallet section.
    externalConnectors.forEach(async (connector) => {
      const connectorName = connector.name as WALLET_CONNECTOR_TYPE;
      log.debug("init external wallet", this.cachedConnector, connectorName, connector.status);

      // a wallet can support multiple chain namespaces e.g. Phantom has EvmInjected connector and WalletStandard connector.
      if (!connectorChainNamespaceMap[connectorName]) connectorChainNamespaceMap[connectorName] = new Set();
      if (connector.connectorNamespace === CONNECTOR_NAMESPACES.MULTICHAIN) {
        this.getChainNamespaces().forEach((x) => connectorChainNamespaceMap[connectorName].add(x));
      } else {
        connectorChainNamespaceMap[connectorName].add(connector.connectorNamespace as ChainNamespaceType);
      }

      // initialize connectors
      // skip initializing cached connector here as it is already being initialized in initModal before.
      if (connector.status === CONNECTOR_STATUS.NOT_READY && this.cachedConnector !== connectorName) {
        try {
          this.subscribeToConnectorEvents(connector);
          const initialChain = this.getInitialChainIdForConnector(connector);
          await connector.init({
            autoConnect: this.cachedConnector === connectorName,
            chainId: initialChain.chainId,
            getIdentityToken: this.options.initialAuthenticationMode === CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN,
          });
        } catch (error) {
          log.error(error, "error while initializing connector", connectorName);
        }
      }

      // update connector config
      if (
        (
          [
            CONNECTOR_STATUS.NOT_READY,
            CONNECTOR_STATUS.READY,
            CONNECTOR_STATUS.CONNECTING,
            CONNECTOR_STATUS.CONNECTED,
            CONNECTOR_STATUS.AUTHORIZING,
            CONNECTOR_STATUS.AUTHORIZED,
          ] as CONNECTOR_STATUS_TYPE[]
        ).includes(connector.status)
      ) {
        const connectorModalConfig = this.modalConfig.connectors[connectorName];
        connectorsConfig[connectorName] = {
          ...connectorModalConfig,
          isInjected: connector.isInjected,
          icon: connector.icon,
          chainNamespaces: Array.from(connectorChainNamespaceMap[connectorName]),
        };
        this.loginModal.addWalletLogins(connectorsConfig, {
          showExternalWalletsOnly: !!options.showExternalWalletsOnly,
          externalWalletsVisibility: !!options.externalWalletsVisibility,
          externalWalletsInitialized: !!options.externalWalletsInitialized,
        });
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

  private onSocialLogin = async (params: { loginParams: AuthLoginParams }): Promise<void> => {
    try {
      await this.connectTo(WALLET_CONNECTORS.AUTH, params.loginParams, LOGIN_MODE.MODAL);
    } catch (error) {
      log.error("Error while connecting via social login (AUTH)", error);
    }
  };

  private onExternalWalletLogin = async (params: {
    connector: WALLET_CONNECTOR_TYPE | string;
    loginParams: { chainNamespace: ChainNamespaceType };
  }): Promise<void> => {
    try {
      const connector = this.getConnector(params.connector as WALLET_CONNECTOR_TYPE, params.loginParams?.chainNamespace);
      // auto-connect WalletConnect in background to generate QR code URI without interfering with user's selected connection
      const shouldStartConnectionInBackground = connector.name === WALLET_CONNECTORS.WALLET_CONNECT_V2;
      if (shouldStartConnectionInBackground) {
        const initialChain = this.getInitialChainIdForConnector(connector);
        await connector.connect({ chainId: initialChain.chainId });
      } else {
        await this.connectTo(params.connector as WALLET_CONNECTOR_TYPE, params.loginParams, LOGIN_MODE.MODAL);
      }
    } catch (error) {
      log.error(`Error while connecting to connector: ${params.connector}`, error);
    }
  };

  private onModalVisibility = async (visibility: boolean): Promise<void> => {
    log.debug("is login modal visible", visibility);
    this.emit(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, visibility);

    // handle WC session refresh
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
        CONNECTED_STATUSES.includes(this.status) &&
        (walletConnectStatus === CONNECTOR_STATUS.READY || walletConnectStatus === CONNECTOR_STATUS.CONNECTING)
      ) {
        log.debug("this stops wc connector from trying to reconnect once proposal expires");
        wcConnector.status = CONNECTOR_STATUS.READY;
      }
    }
  };

  private onMobileVerifyConnect = async (params: { connector: WALLET_CONNECTOR_TYPE }): Promise<void> => {
    try {
      const connector = this.getConnector(params.connector);
      await connector.getIdentityToken();
    } catch (error) {
      log.error(`Error while connecting to connector: ${params.connector}`, error);
    }
  };

  private getChainNamespaces = (): ChainNamespaceType[] => {
    return [...new Set(this.coreOptions.chains?.map((x) => x.chainNamespace) || [])];
  };

  private getCombinedConnectionId(authConnectionId: string, groupedAuthConnectionId: string): string {
    let id = authConnectionId;
    if (groupedAuthConnectionId) {
      id = `${groupedAuthConnectionId}_${authConnectionId}`;
    }
    return id;
  }
}
