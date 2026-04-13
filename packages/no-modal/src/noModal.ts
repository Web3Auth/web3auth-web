import { BUTTON_POSITION, CONFIRMATION_STRATEGY } from "@toruslabs/base-controllers";
import {
  type AccountAbstractionMultiChainConfig,
  EIP7702_SUPPORTED_SMART_ACCOUNT_TYPES,
  SMART_ACCOUNT_EIP_STANDARD,
} from "@toruslabs/ethereum-controllers";
import {
  cloneDeep,
  CookieStorage,
  type IStorageAdapter,
  LocalStorageAdapter,
  MemoryStorage,
  SafeEventEmitter,
  type SafeEventEmitterProvider,
  serializeError,
  UX_MODE,
} from "@web3auth/auth";
import { WsEmbedParams } from "@web3auth/ws-embed";
import deepmerge from "deepmerge";

import {
  Analytics,
  ANALYTICS_EVENTS,
  ANALYTICS_INTEGRATION_TYPE,
  ANALYTICS_SDK_TYPE,
  AuthLoginParams,
  AUTHORIZED_EVENT_DATA,
  type AuthTokenInfo,
  CAN_AUTHORIZE_STATUSES,
  CHAIN_NAMESPACES,
  type ChainNamespaceType,
  type CONNECTED_EVENT_DATA,
  CONNECTED_STATUSES,
  type Connection,
  CONNECTOR_EVENTS,
  CONNECTOR_INITIAL_AUTHENTICATION_MODE,
  CONNECTOR_NAMESPACES,
  CONNECTOR_STATUS,
  type CONNECTOR_STATUS_TYPE,
  type CustomChainConfig,
  fetchProjectConfig,
  getAaAnalyticsProperties,
  getCaipChainId,
  getErrorAnalyticsProperties,
  getHostname,
  getWalletServicesAnalyticsProperties,
  getWhitelabelAnalyticsProperties,
  type IBaseProvider,
  type IConnector,
  type IPlugin,
  type IProvider,
  isBrowser,
  isHexStrict,
  type IWeb3Auth,
  type IWeb3AuthCoreOptions,
  IWeb3AuthState,
  log,
  LOGIN_MODE,
  LoginModeType,
  type LoginParamMap,
  PLUGIN_NAMESPACES,
  PLUGIN_STATUS,
  type ProjectConfig,
  sdkVersion,
  SMART_ACCOUNT_WALLET_SCOPE,
  type SmartAccountsConfig,
  storageAvailable,
  type UserInfo,
  type WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletInitializationError,
  WalletLoginError,
  WEB3AUTH_STATE_STORAGE_KEY,
  Web3AuthError,
  type Web3AuthNoModalEvents,
  withAbort,
} from "./base";
import { deserialize } from "./base/deserialize";
import { authConnector, type AuthConnectorType } from "./connectors/auth-connector";
import { metaMaskConnector } from "./connectors/metamask-connector";
import { walletServicesPlugin } from "./plugins/wallet-services-plugin";
import { type AccountAbstractionProvider } from "./providers/account-abstraction-provider";
import { CommonJRPCProvider } from "./providers/base-provider";
export class Web3AuthNoModal extends SafeEventEmitter<Web3AuthNoModalEvents> implements IWeb3Auth {
  readonly coreOptions: IWeb3AuthCoreOptions;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  protected aaProvider: AccountAbstractionProvider | null = null;

  protected connectors: IConnector<unknown>[] = [];

  protected commonJRPCProvider: CommonJRPCProvider | null = null;

  protected analytics: Analytics;

  protected plugins: Record<string, IPlugin> = {};

  private storage: IStorageAdapter;

  private currentConnection: Connection | null = null;

  private state: IWeb3AuthState = {
    connectedConnectorName: null,
    cachedConnector: null,
    currentChainId: null,
    idToken: null,
    accessToken: null,
    refreshToken: null,
  };

  private loginMode: LoginModeType = LOGIN_MODE.NO_MODAL;

  constructor(options: IWeb3AuthCoreOptions, initialState?: IWeb3AuthState) {
    super();
    if (!options.clientId) throw WalletInitializationError.invalidParams("Please provide a valid clientId in constructor");
    if (options.enableLogging) log.enableAll();
    else log.setLevel("error");
    if (!options.initialAuthenticationMode) options.initialAuthenticationMode = CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN;

    this.coreOptions = options;
    this.storage = this.getStorageMethod();
    this.analytics = new Analytics();
    this.analytics.setGlobalProperties({ integration_type: ANALYTICS_INTEGRATION_TYPE.NATIVE_SDK });

    this.loadState(initialState)
      .then((): undefined => {
        if (this.state.idToken && this.coreOptions.ssr) {
          // connect-only is the default authentication mode, so we need to set the status to connected if the idToken is present and ssr is enabled
          this.status =
            this.coreOptions.initialAuthenticationMode === CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN
              ? CONNECTOR_STATUS.AUTHORIZED
              : CONNECTOR_STATUS.CONNECTED;
        }
        return undefined;
      })
      .catch(() => {});
  }

  get currentChain(): CustomChainConfig | undefined {
    if (!this.currentChainId) return undefined;
    return this.coreOptions.chains?.find((chain) => chain.chainId === this.currentChainId);
  }

  get connected(): boolean {
    return Boolean(this.connectedConnector);
  }

  get connection(): Connection | null {
    return this.currentConnection;
  }

  get connectedConnectorName(): WALLET_CONNECTOR_TYPE | null {
    return this.state.connectedConnectorName;
  }

  get cachedConnector(): string | null {
    return this.state.cachedConnector;
  }

  get currentChainId(): string | null {
    return this.state.currentChainId || this.coreOptions.defaultChainId || this.coreOptions.chains?.[0]?.chainId || null;
  }

  get connectedConnector(): IConnector<unknown> | null {
    return this.getConnector(this.connectedConnectorName, this.currentChain?.chainNamespace);
  }

  get accountAbstractionProvider(): AccountAbstractionProvider | null {
    return this.aaProvider;
  }

  get idToken(): string | null {
    return this.state.idToken || null;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  public async init(options?: { signal?: AbortSignal }): Promise<void> {
    // init analytics
    const startTime = Date.now();
    this.analytics.init();
    this.analytics.identify(this.coreOptions.clientId, {
      web3auth_client_id: this.coreOptions.clientId,
      web3auth_network: this.coreOptions.web3AuthNetwork,
    });
    this.analytics.setGlobalProperties({
      dapp_url: window.location.origin,
      sdk_name: ANALYTICS_SDK_TYPE.WEB_NO_MODAL,
      sdk_version: sdkVersion,
      // Required for organization analytics
      web3auth_client_id: this.coreOptions.clientId,
      web3auth_network: this.coreOptions.web3AuthNetwork,
    });
    let trackData: Record<string, unknown> = {};

    try {
      const { signal } = options || {};
      // get project config
      let projectConfig: ProjectConfig;
      try {
        projectConfig = await fetchProjectConfig({
          clientId: this.coreOptions.clientId,
          web3AuthNetwork: this.coreOptions.web3AuthNetwork,
          aaProvider: this.coreOptions.accountAbstractionConfig?.smartAccountType,
          authBuildEnv: this.coreOptions.authBuildEnv,
        });
      } catch (e) {
        const error = await serializeError(e);
        log.error("Failed to fetch project configurations", error);
        throw WalletInitializationError.notReady("failed to fetch project configurations", error);
      }

      // init config
      this.initAccountAbstractionConfig(projectConfig);
      this.initChainsConfig(projectConfig);
      await this.initCachedConnectorAndChainId();
      this.initUIConfig(projectConfig);
      this.initWalletServicesConfig(projectConfig);
      this.initSessionTimeConfig(projectConfig);
      this.analytics.setGlobalProperties({ team_id: projectConfig.teamId });
      trackData = this.getInitializationTrackData();

      // setup common JRPC provider
      await withAbort(() => this.setupCommonJRPCProvider(), signal);

      // initialize connectors
      this.on(CONNECTOR_EVENTS.CONNECTORS_UPDATED, async ({ connectors: newConnectors }) => {
        const onAbortHandler = () => {
          if (this.connectors?.length > 0) {
            this.cleanup();
          }
        };

        await withAbort(() => Promise.all(newConnectors.map(this.setupConnector.bind(this))), signal, onAbortHandler);

        // emit connector ready event
        if (this.status === CONNECTOR_STATUS.NOT_READY) {
          this.status = CONNECTOR_STATUS.READY;
          this.emit(CONNECTOR_EVENTS.READY);
        }
      });

      await withAbort(() => this.loadConnectors({ projectConfig }), signal);
      await withAbort(() => this.initPlugins(), signal);

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

  // we need to take into account the chainNamespace as for external connectors, same connector name can be used for multiple chain namespaces
  public getConnector(connectorName: WALLET_CONNECTOR_TYPE, chainNamespace?: ChainNamespaceType): IConnector<unknown> | null {
    return (
      this.connectors.find((connector) => {
        if (connector.name !== connectorName) return false;
        if (chainNamespace) {
          if (connector.connectorNamespace === CONNECTOR_NAMESPACES.MULTICHAIN) return true;
          return connector.connectorNamespace === chainNamespace;
        }
        return true;
      }) || null
    );
  }

  public async clearCache(): Promise<void> {
    await this.setState({
      connectedConnectorName: null,
      cachedConnector: null,
      currentChainId: null,
      idToken: null,
      accessToken: null,
      refreshToken: null,
    });
  }

  public async cleanup(): Promise<void> {
    for (const connector of this.connectors) {
      if (connector.cleanup) await connector.cleanup();
    }
  }

  public async switchChain(params: { chainId: string }): Promise<void> {
    if (params.chainId === this.currentChain?.chainId) return;
    const newChainConfig = this.coreOptions.chains.find((x) => x.chainId === params.chainId);
    if (!newChainConfig) throw WalletInitializationError.invalidParams("Invalid chainId");

    if (CONNECTED_STATUSES.includes(this.status) && this.connectedConnector) {
      // Single-namespace connectors cannot cross namespace boundaries — MULTICHAIN connectors
      // (Auth, WC) enforce their own switchChain policy internally.
      if (
        this.connectedConnector.connectorNamespace !== CONNECTOR_NAMESPACES.MULTICHAIN &&
        this.currentChain?.chainNamespace !== newChainConfig.chainNamespace
      ) {
        throw WalletLoginError.connectionError(
          `Cannot switch between chain namespaces with ${this.connectedConnector.name}. Disconnect and reconnect with the target chain.`
        );
      }

      await this.connectedConnector.switchChain(params);
      return;
    }

    if (this.commonJRPCProvider) {
      await this.commonJRPCProvider.switchChain(params);
      return;
    }
    throw WalletInitializationError.notReady(`No wallet is ready`);
  }

  /**
   * Connect to a specific wallet connector
   * @param connectorName - Key of the wallet connector to use.
   */
  async connectTo<T extends WALLET_CONNECTOR_TYPE>(
    connectorName: T,
    loginParams?: LoginParamMap[T],
    loginMode?: LoginModeType
  ): Promise<Connection | null> {
    this.loginMode = loginMode || "no-modal";
    const connector = this.getConnector(connectorName, (loginParams as { chainNamespace?: ChainNamespaceType })?.chainNamespace);
    if (!connector || !this.commonJRPCProvider)
      throw WalletInitializationError.notFound(`Please add wallet connector for ${connectorName} wallet, before connecting`);

    const initialChain = this.getInitialChainIdForConnector(connector);
    const finalLoginParams = {
      ...loginParams,
      chainId: initialChain.chainId,
      getAuthTokenInfo: this.coreOptions.initialAuthenticationMode === CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN,
    };

    // track connection started event
    const startTime = Date.now();
    let eventData: Record<string, unknown>;
    if (connectorName === WALLET_CONNECTORS.AUTH) {
      const authLoginParams = loginParams as Partial<AuthLoginParams>;
      const authConnectionConfig = (connector as AuthConnectorType).getOAuthProviderConfig({
        authConnection: authLoginParams.authConnection,
        authConnectionId: authLoginParams.authConnectionId,
        groupedAuthConnectionId: authLoginParams.groupedAuthConnectionId,
      });
      eventData = {
        connector: connectorName,
        connector_type: connector.type,
        chain_id: getCaipChainId(initialChain),
        chain_name: initialChain.displayName,
        chain_namespace: initialChain.chainNamespace,
        auth_connection: authLoginParams.authConnection,
        auth_connection_id: authLoginParams.authConnectionId,
        group_auth_connection_id: authLoginParams.groupedAuthConnectionId,
        mfa_level: authLoginParams.mfaLevel,
        wallet_key_enabled: authLoginParams.getWalletKey,
        extra_login_options_enabled: Boolean(authLoginParams.extraLoginOptions),
        dapp_share_enabled: Boolean(authLoginParams.dappShare),
        curve: authLoginParams.curve,
        auth_dapp_url: authLoginParams.dappUrl,
        is_sfa: Boolean(authLoginParams.idToken),
        is_default_auth_connection: authConnectionConfig?.isDefault,
        auth_ux_mode: (connector as AuthConnectorType).authInstance?.options?.uxMode,
      };
    } else {
      eventData = {
        connector: connectorName,
        connector_type: connector.type,
        is_injected: connector.isInjected,
        chain_id: getCaipChainId(initialChain),
        chain_name: initialChain.displayName,
        chain_namespace: initialChain.chainNamespace,
      };
    }

    // track connection started event
    this.analytics.track(ANALYTICS_EVENTS.CONNECTION_STARTED, eventData);

    return new Promise((resolve, reject) => {
      let connectedEventCompleted = false;
      let authorizedEventReceived = false;

      const cleanup = () => {
        this.removeListener(CONNECTOR_EVENTS.CONNECTED, onConnected);
        this.removeListener(CONNECTOR_EVENTS.ERRORED, onErrored);
        this.removeListener(CONNECTOR_EVENTS.AUTHORIZED, onAuthorized);
      };

      const checkCompletion = async () => {
        // In CONNECT_AND_SIGN mode, wait for both connected event and authorized event
        if (finalLoginParams.getAuthTokenInfo) {
          if (connectedEventCompleted && authorizedEventReceived) {
            await completeConnection();
          }
        } else {
          // In CONNECT_ONLY mode, just wait for connected event
          if (connectedEventCompleted) {
            await completeConnection();
          }
        }
      };

      const completeConnection = async () => {
        try {
          // track connection completed event
          const userInfo = await connector.getUserInfo();
          this.analytics.track(ANALYTICS_EVENTS.CONNECTION_COMPLETED, {
            ...eventData,
            is_mfa_enabled: userInfo?.isMfaEnabled,
            duration: Date.now() - startTime,
          });
          cleanup();
          resolve(this.connection);
        } catch (error) {
          cleanup();
          reject(error);
        }
      };

      const onConnected = async () => {
        connectedEventCompleted = true;
        await checkCompletion();
      };

      const onAuthorized = async () => {
        authorizedEventReceived = true;
        await checkCompletion();
      };

      const onErrored = async (err: Web3AuthError) => {
        // track connection failed event
        this.analytics.track(ANALYTICS_EVENTS.CONNECTION_FAILED, {
          ...eventData,
          ...getErrorAnalyticsProperties(err),
          duration: Date.now() - startTime,
        });
        cleanup();
        reject(err);
      };

      this.once(CONNECTOR_EVENTS.CONNECTED, onConnected);
      if (finalLoginParams.getAuthTokenInfo) {
        this.once(CONNECTOR_EVENTS.AUTHORIZED, onAuthorized);
      }
      this.once(CONNECTOR_EVENTS.ERRORED, onErrored);
      connector.connect(finalLoginParams);
      this.setCurrentChain(initialChain.chainId);
    });
  }

  async logout(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    if (!CONNECTED_STATUSES.includes(this.status) || !this.connectedConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    if (this.connectedConnector.status === CONNECTOR_STATUS.DISCONNECTING) return;
    await this.connectedConnector.disconnect(options);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    log.debug("Getting user info", this.status, this.connectedConnector?.name);
    if (!CAN_AUTHORIZE_STATUSES.includes(this.status) || !this.connectedConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    return this.connectedConnector.getUserInfo();
  }

  async enableMFA<T>(loginParams?: T): Promise<void> {
    if (!CONNECTED_STATUSES.includes(this.status) || !this.connectedConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    if (this.connectedConnector.name !== WALLET_CONNECTORS.AUTH)
      throw WalletLoginError.unsupportedOperation(`EnableMFA is not supported for this connector.`);

    const authConnector = this.connectedConnector as AuthConnectorType;
    const trackData = { connector: this.connectedConnector.name, auth_ux_mode: authConnector.authInstance?.options?.uxMode };
    try {
      this.analytics.track(ANALYTICS_EVENTS.MFA_ENABLEMENT_STARTED, trackData);
      await this.connectedConnector.enableMFA(loginParams);
    } catch (error) {
      this.analytics.track(ANALYTICS_EVENTS.MFA_ENABLEMENT_FAILED, {
        ...trackData,
        ...getErrorAnalyticsProperties(error),
      });
      throw error;
    }
  }

  async manageMFA<T>(loginParams?: T): Promise<void> {
    if (!CONNECTED_STATUSES.includes(this.status) || !this.connectedConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    if (this.connectedConnector.name !== WALLET_CONNECTORS.AUTH)
      throw WalletLoginError.unsupportedOperation(`ManageMFA is not supported for this connector.`);

    const authConnector = this.connectedConnector as AuthConnectorType;
    const trackData = { connector: this.connectedConnector.name, auth_ux_mode: authConnector.authInstance?.options?.uxMode };
    try {
      this.analytics.track(ANALYTICS_EVENTS.MFA_MANAGEMENT_SELECTED, trackData);
      await this.connectedConnector.manageMFA(loginParams);
    } catch (error) {
      this.analytics.track(ANALYTICS_EVENTS.MFA_MANAGEMENT_FAILED, {
        ...trackData,
        ...getErrorAnalyticsProperties(error),
      });
      throw error;
    }
  }

  async getAuthTokenInfo(): Promise<Pick<AuthTokenInfo, "idToken">> {
    if (!CAN_AUTHORIZE_STATUSES.includes(this.status) || !this.connectedConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);

    const trackData = { connector: this.connectedConnector.name };
    try {
      this.analytics.track(ANALYTICS_EVENTS.IDENTITY_TOKEN_STARTED, trackData);
      const authTokenInfo = await this.connectedConnector.getAuthTokenInfo();
      this.analytics.track(ANALYTICS_EVENTS.IDENTITY_TOKEN_COMPLETED, trackData);
      return { idToken: authTokenInfo.idToken };
    } catch (error) {
      this.analytics.track(ANALYTICS_EVENTS.IDENTITY_TOKEN_FAILED, {
        ...trackData,
        ...getErrorAnalyticsProperties(error),
      });
      throw error;
    }
  }

  public getPlugin(name: string): IPlugin | null {
    return this.plugins[name] || null;
  }

  public setAnalyticsProperties(properties: Record<string, unknown>) {
    this.analytics.setGlobalProperties(properties);
  }

  protected initChainsConfig(projectConfig: ProjectConfig) {
    // merge chains from project config with core options, core options chains will take precedence over project config chains
    const chainMap = new Map<string, CustomChainConfig>();
    const allChains = [...(projectConfig.chains || []), ...(this.coreOptions.chains || [])];
    for (const chain of allChains) {
      const existingChain = chainMap.get(chain.chainId);
      if (!existingChain) chainMap.set(chain.chainId, chain);
      else chainMap.set(chain.chainId, { ...existingChain, ...chain });
    }
    this.coreOptions.chains = Array.from(chainMap.values());

    // validate chains and namespaces
    if (this.coreOptions.chains.length === 0) {
      log.error("chain info not found. Please configure chains on dashboard at https://dashboard.web3auth.io");
      throw WalletInitializationError.invalidParams("Please configure chains on dashboard at https://dashboard.web3auth.io");
    }
    const validChainNamespaces = new Set(Object.values(CHAIN_NAMESPACES));
    for (const chain of this.coreOptions.chains) {
      if (!chain.chainNamespace || !validChainNamespaces.has(chain.chainNamespace)) {
        log.error(`Please provide a valid chainNamespace in chains for chain ${chain.chainId}`);
        throw WalletInitializationError.invalidParams(`Please provide a valid chainNamespace in chains for chain ${chain.chainId}`);
      }
      if (chain.chainNamespace !== CHAIN_NAMESPACES.OTHER && !isHexStrict(chain.chainId)) {
        log.error(`Please provide a valid chainId in chains for chain ${chain.chainId}`);
        throw WalletInitializationError.invalidParams(`Please provide a valid chainId as hex string in chains for chain ${chain.chainId}`);
      }
      if (chain.chainNamespace !== CHAIN_NAMESPACES.OTHER) {
        try {
          new URL(chain.rpcTarget);
        } catch (error) {
          // TODO: add support for chain.wsTarget
          log.error(`Please provide a valid rpcTarget in chains for chain ${chain.chainId}`, error);
          throw WalletInitializationError.invalidParams(`Please provide a valid rpcTarget in chains for chain ${chain.chainId}`);
        }
      }
    }

    // if AA is enabled and smart account is not 7702, filter out chains that are not AA-supported
    const is7702SmartAccount = this.coreOptions.accountAbstractionConfig?.smartAccountEipStandard === SMART_ACCOUNT_EIP_STANDARD.EIP_7702;
    if (this.coreOptions.accountAbstractionConfig && !is7702SmartAccount) {
      // write a for loop over accountAbstractionConfig.chains and check if the chainId is valid
      if (this.coreOptions.accountAbstractionConfig.chains.length === 0) {
        log.error("Please configure chains for smart accounts on dashboard at https://dashboard.web3auth.io");
        throw WalletInitializationError.invalidParams("Please configure chains for smart accounts on dashboard at https://dashboard.web3auth.io");
      }
      for (const chain of this.coreOptions.accountAbstractionConfig.chains) {
        if (!isHexStrict(chain.chainId)) {
          log.error(`Please provide a valid chainId in accountAbstractionConfig.chains for chain ${chain.chainId}`);
          throw WalletInitializationError.invalidParams(
            `Please provide a valid chainId in accountAbstractionConfig.chains for chain ${chain.chainId}`
          );
        }
        try {
          new URL(chain.bundlerConfig?.url);
        } catch (error) {
          log.error(`Please provide a valid bundlerConfig.url in accountAbstractionConfig.chains for chain ${chain.chainId}`, error);
          throw WalletInitializationError.invalidParams(
            `Please provide a valid bundlerConfig.url in accountAbstractionConfig.chains for chain ${chain.chainId}`
          );
        }
        if (!chainMap.has(chain.chainId)) {
          log.error(`Please provide chain config for AA chain in accountAbstractionConfig.chains for chain ${chain.chainId}`);
          throw WalletInitializationError.invalidParams(
            `Please provide chain config for AA chain in accountAbstractionConfig.chains for chain ${chain.chainId}`
          );
        }
      }
      // const aaSupportedChainIds = new Set(
      //   this.coreOptions.accountAbstractionConfig?.chains
      //     ?.filter((chain) => chain.chainId && chain.bundlerConfig?.url)
      //     .map((chain) => chain.chainId) || []
      // );
      // this.coreOptions.chains = this.coreOptions.chains.filter(
      //   (chain) => chain.chainNamespace !== CHAIN_NAMESPACES.EIP155 || aaSupportedChainIds.has(chain.chainId)
      // );
      // if (this.coreOptions.chains.length === 0) {
      //   log.error("Account Abstraction is enabled but no supported chains found");
      //   throw WalletInitializationError.invalidParams("Account Abstraction is enabled but no supported chains found");
      // }
    }
  }

  protected initAccountAbstractionConfig(projectConfig?: ProjectConfig) {
    const isAAEnabled = Boolean(this.coreOptions.accountAbstractionConfig || projectConfig?.smartAccounts);
    if (!isAAEnabled) return;

    // merge smart account config from project config with core options, core options will take precedence over project config
    const { walletScope, eipStandard, ...configWithoutWalletScope } = (projectConfig?.smartAccounts || {}) as SmartAccountsConfig;
    const aaChainMap = new Map<string, AccountAbstractionMultiChainConfig["chains"][number]>();
    const allAaChains = [...(configWithoutWalletScope?.chains || []), ...(this.coreOptions.accountAbstractionConfig?.chains || [])];
    for (const chain of allAaChains) {
      const existingChain = aaChainMap.get(chain.chainId);
      if (!existingChain) aaChainMap.set(chain.chainId, chain);
      else aaChainMap.set(chain.chainId, { ...existingChain, ...chain });
    }

    this.coreOptions.accountAbstractionConfig = {
      smartAccountEipStandard: eipStandard,
      ...deepmerge(configWithoutWalletScope || {}, this.coreOptions.accountAbstractionConfig || {}),
      chains: Array.from(aaChainMap.values()),
    };

    // if eipStandard is 7702, validate smart account type
    const { smartAccountEipStandard, smartAccountType } = this.coreOptions.accountAbstractionConfig as {
      smartAccountEipStandard?: string;
      smartAccountType?: string;
    };
    const is7702SmartAccount = smartAccountEipStandard === SMART_ACCOUNT_EIP_STANDARD.EIP_7702;
    if (is7702SmartAccount && smartAccountType && !(EIP7702_SUPPORTED_SMART_ACCOUNT_TYPES as readonly string[]).includes(smartAccountType)) {
      throw WalletInitializationError.invalidParams(
        `Smart account type "${smartAccountType}" does not support EIP-7702. Supported: ${EIP7702_SUPPORTED_SMART_ACCOUNT_TYPES.join(", ")}`
      );
    }

    // determine if we should use AA with external wallet
    if (this.coreOptions.useAAWithExternalWallet === undefined) {
      this.coreOptions.useAAWithExternalWallet = walletScope === SMART_ACCOUNT_WALLET_SCOPE.ALL;
    }
  }

  protected initUIConfig(projectConfig: ProjectConfig) {
    this.coreOptions.uiConfig = deepmerge.all([
      { mode: "light", uxMode: UX_MODE.POPUP },
      cloneDeep(projectConfig.whitelabel || {}),
      this.coreOptions.uiConfig || {},
    ]);
  }

  protected initSessionTimeConfig(projectConfig: ProjectConfig) {
    if (this.coreOptions.sessionTime) return;
    if (projectConfig.sessionTime) this.coreOptions.sessionTime = projectConfig.sessionTime;
  }

  protected async initCachedConnectorAndChainId(): Promise<void> {
    // init chainId using cached chainId if it exists and is valid, otherwise use the defaultChainId or the first chain
    const cachedChainId = this.state.currentChainId;
    const isCachedChainIdValid = cachedChainId && this.coreOptions.chains.some((chain) => chain.chainId === cachedChainId);
    if (this.coreOptions.defaultChainId && !isHexStrict(this.coreOptions.defaultChainId))
      throw WalletInitializationError.invalidParams("Please provide a valid defaultChainId in constructor");
    const currentChainId = isCachedChainIdValid ? cachedChainId : this.coreOptions.defaultChainId || this.coreOptions.chains[0].chainId;
    await this.setState({ currentChainId });
  }

  protected initWalletServicesConfig(projectConfig: ProjectConfig) {
    const { enableKeyExport, walletUi } = projectConfig;
    const {
      enablePortfolioWidget = false,
      enableTokenDisplay = true,
      enableNftDisplay = true,
      enableWalletConnect = true,
      enableBuyButton = true,
      enableSendButton = true,
      enableSwapButton = true,
      enableReceiveButton = true,
      enableShowAllTokensButton = true,
      enableConfirmationModal = false,
      enableDefiPositionsDisplay = true,
      portfolioWidgetPosition = BUTTON_POSITION.BOTTOM_LEFT,
      defaultPortfolio = "token",
    } = walletUi || {};
    const projectConfigWhiteLabel: WsEmbedParams["whiteLabel"] = {
      showWidgetButton: enablePortfolioWidget,
      hideNftDisplay: !enableNftDisplay,
      hideTokenDisplay: !enableTokenDisplay,
      hideTransfers: !enableSendButton,
      hideTopup: !enableBuyButton,
      hideReceive: !enableReceiveButton,
      hideSwap: !enableSwapButton,
      hideShowAllTokens: !enableShowAllTokensButton,
      hideWalletConnect: !enableWalletConnect,
      hideDefiPositionsDisplay: !enableDefiPositionsDisplay,
      buttonPosition: portfolioWidgetPosition,
      defaultPortfolio,
    };
    const whiteLabel = deepmerge.all([projectConfigWhiteLabel, this.coreOptions.walletServicesConfig?.whiteLabel || {}]);

    const confirmationStrategy =
      this.coreOptions.walletServicesConfig?.confirmationStrategy ??
      (enableConfirmationModal ? CONFIRMATION_STRATEGY.MODAL : CONFIRMATION_STRATEGY.AUTO_APPROVE);
    const isKeyExportEnabled = this.coreOptions.walletServicesConfig?.enableKeyExport ?? enableKeyExport ?? true;
    this.coreOptions.walletServicesConfig = {
      ...this.coreOptions.walletServicesConfig,
      confirmationStrategy,
      whiteLabel,
      enableKeyExport: isKeyExportEnabled,
    };
  }

  protected getInitializationTrackData() {
    try {
      const defaultChain = this.coreOptions.chains?.find((chain) => chain.chainId === this.coreOptions.defaultChainId);
      const rpcHostnames = Array.from(new Set(this.coreOptions.chains?.map((chain) => getHostname(chain.rpcTarget)))).filter(Boolean);
      return {
        chain_ids: this.coreOptions.chains?.map((chain) => getCaipChainId(chain)),
        chain_names: this.coreOptions.chains?.map((chain) => chain.displayName),
        chain_rpc_targets: rpcHostnames,
        default_chain_id: defaultChain ? getCaipChainId(defaultChain) : undefined,
        default_chain_name: defaultChain?.displayName,
        logging_enabled: this.coreOptions.enableLogging,
        custom_storage: Boolean(this.coreOptions.storage),
        session_time: this.coreOptions.sessionTime,
        sfa_key_enabled: this.coreOptions.useSFAKey,
        mipd_enabled: this.coreOptions.multiInjectedProviderDiscovery,
        private_key_provider_enabled: Boolean(this.coreOptions.privateKeyProvider),
        ssr_enabled: this.coreOptions.ssr,
        auth_build_env: this.coreOptions.authBuildEnv,
        auth_ux_mode: this.coreOptions.uiConfig?.uxMode,
        auth_mfa_level: this.coreOptions.mfaLevel,
        auth_mfa_settings: Object.keys(this.coreOptions.mfaSettings || {}),
        aa_enabled_for_external_wallets: this.coreOptions.accountAbstractionConfig ? this.coreOptions.useAAWithExternalWallet : undefined,
        ...getWhitelabelAnalyticsProperties(this.coreOptions.uiConfig),
        ...getAaAnalyticsProperties(this.coreOptions.accountAbstractionConfig),
        ...getWalletServicesAnalyticsProperties(this.coreOptions.walletServicesConfig),
      };
    } catch (error) {
      log.error("Failed to get initialization track data", error);
      return {};
    }
  }

  protected async setupCommonJRPCProvider() {
    this.commonJRPCProvider = await CommonJRPCProvider.getProviderInstance({
      chain: this.currentChain,
      chains: this.coreOptions.chains,
    });

    // sync chainId
    this.commonJRPCProvider.on("chainChanged", async (chainId) => this.setCurrentChain(chainId));
  }

  protected async setupConnector(connector: IConnector<unknown>): Promise<void> {
    this.subscribeToConnectorEvents(connector);
    try {
      const initialChain = this.getInitialChainIdForConnector(connector);
      const autoConnect = this.checkIfAutoConnect(connector);
      await connector.init({
        autoConnect,
        chainId: initialChain.chainId,
        getAuthTokenInfo: this.coreOptions.initialAuthenticationMode === CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN,
      });
    } catch (e) {
      log.error(e, connector.name);
    }
  }

  protected async loadConnectors({ projectConfig, modalMode }: { projectConfig: ProjectConfig; modalMode?: boolean }) {
    // always add auth connector
    const connectorFns = [...(this.coreOptions.connectors || []), authConnector()];
    const config = {
      projectConfig,
      coreOptions: this.coreOptions,
      analytics: this.analytics,
    };

    // add injected connectors
    const isExternalWalletEnabled = Boolean(projectConfig.externalWalletAuth);
    const isMipdEnabled = isExternalWalletEnabled && (this.coreOptions.multiInjectedProviderDiscovery ?? true);
    const chainNamespaces = new Set(this.coreOptions.chains.map((chain) => chain.chainNamespace));

    // prioritize using MM connector over injected connector for EVM chains
    if (isBrowser() && chainNamespaces.has(CHAIN_NAMESPACES.EIP155)) {
      // only set headless to true if modal SDK is used, otherwise just use the modal from native Metamask SDK
      connectorFns.push(metaMaskConnector(modalMode ? { ui: { headless: true } } : undefined));
    }

    if (isMipdEnabled && isBrowser()) {
      // Solana chains
      if (chainNamespaces.has(CHAIN_NAMESPACES.SOLANA)) {
        const { createSolanaMipd, hasSolanaWalletStandardFeatures, walletStandardConnector } = await import("./connectors/injected-solana-connector");
        const solanaMipd = createSolanaMipd();
        // subscribe to new injected connectors
        solanaMipd.on("register", async (...wallets) => {
          const newConnectors = wallets.filter(hasSolanaWalletStandardFeatures).map((wallet) => walletStandardConnector(wallet)(config));
          this.setConnectors(newConnectors);
        });
        connectorFns.push(
          ...solanaMipd
            .get()
            .filter((wallet) => hasSolanaWalletStandardFeatures(wallet))
            .map(walletStandardConnector)
        );
      }
      // EVM chains
      if (chainNamespaces.has(CHAIN_NAMESPACES.EIP155)) {
        const { createMipd, injectedEvmConnector } = await import("./connectors/injected-evm-connector");
        const evmMipd = createMipd();
        // subscribe to new injected connectors
        evmMipd.subscribe((providerDetails) => {
          const newConnectors = providerDetails.map((providerDetail) => injectedEvmConnector(providerDetail)(config));
          this.setConnectors(newConnectors);
        });
        connectorFns.push(...evmMipd.getProviders().map(injectedEvmConnector));
      }
    }

    // add WalletConnectV2 connector if external wallets are enabled
    if (isBrowser() && isExternalWalletEnabled && (chainNamespaces.has(CHAIN_NAMESPACES.SOLANA) || chainNamespaces.has(CHAIN_NAMESPACES.EIP155))) {
      const { walletConnectV2Connector } = await import("./connectors/wallet-connect-v2-connector");
      connectorFns.push(walletConnectV2Connector());
    }

    const connectors = connectorFns.map((connectorFn) => connectorFn(config));
    this.setConnectors(connectors);
  }

  protected async initPlugins(): Promise<void> {
    const { chains, plugins } = this.coreOptions;
    const pluginFns = plugins || [];
    const isWsSupportedChain = chains.some((x) => x.chainNamespace === CHAIN_NAMESPACES.EIP155 || x.chainNamespace === CHAIN_NAMESPACES.SOLANA);
    if (isWsSupportedChain) {
      pluginFns.push(walletServicesPlugin());
    }
    for (const pluginFn of pluginFns) {
      const plugin = pluginFn();
      if (!this.plugins[plugin.name]) this.plugins[plugin.name] = plugin;
    }
  }

  protected setConnectors(connectors: IConnector<unknown>[]): void {
    const getConnectorKey = (connector: IConnector<unknown>) => `${connector.connectorNamespace}-${connector.name}`;
    const connectorSet = new Set(this.connectors.map(getConnectorKey));
    const newConnectors = connectors
      .map((connector) => {
        const key = getConnectorKey(connector);
        if (connectorSet.has(key)) return null;
        connectorSet.add(key);
        return connector;
      })
      .filter((connector) => connector !== null);
    if (newConnectors.length > 0) {
      this.connectors = [...this.connectors, ...newConnectors];
      // only emit new connectors
      this.emit(CONNECTOR_EVENTS.CONNECTORS_UPDATED, { connectors: newConnectors });
    }
  }

  protected subscribeToConnectorEvents(connector: IConnector<unknown>): void {
    connector.on(CONNECTOR_EVENTS.CONNECTED, async (data: CONNECTED_EVENT_DATA) => {
      if (!this.commonJRPCProvider) throw WalletInitializationError.notFound(`CommonJrpcProvider not found`);
      const { ethereumProvider, solanaWallet } = data;

      // when ssr is enabled, we need to get the idToken from the connector.
      if (this.coreOptions.ssr) {
        try {
          const data = await connector.getAuthTokenInfo();
          if (!data.idToken) throw WalletLoginError.connectionError("No idToken found");
          await this.setState({
            idToken: data.idToken,
            accessToken: data.accessToken ?? null,
            refreshToken: data.refreshToken ?? null,
          });
        } catch (error) {
          log.error(error);
          this.status = CONNECTOR_STATUS.ERRORED;
          this.emit(CONNECTOR_EVENTS.ERRORED, error as Web3AuthError, this.loginMode);
          return;
        }
      }

      // setup AA provider if AA is enabled (skip for EIP-7702; 7702 uses EOA + 5792/7702 RPC only)
      if (ethereumProvider) {
        let finalProvider = (ethereumProvider as IBaseProvider<unknown>)?.provider || (ethereumProvider as SafeEventEmitterProvider);
        const { accountAbstractionConfig } = this.coreOptions;
        const is7702 = accountAbstractionConfig?.smartAccountEipStandard === SMART_ACCOUNT_EIP_STANDARD["EIP_7702"];
        const isAaSupportedForCurrentChain =
          this.currentChain?.chainNamespace === CHAIN_NAMESPACES.EIP155 &&
          accountAbstractionConfig?.chains?.some((chain) => chain.chainId === this.currentChain?.chainId);
        if (!is7702 && isAaSupportedForCurrentChain && (data.connectorName === WALLET_CONNECTORS.AUTH || this.coreOptions.useAAWithExternalWallet)) {
          const { accountAbstractionProvider, toEoaProvider } = await import("./providers/account-abstraction-provider");
          // for embedded wallets, we use ws-embed provider which is AA provider, need to derive EOA provider
          const eoaProvider: IProvider = data.connectorName === WALLET_CONNECTORS.AUTH ? await toEoaProvider(ethereumProvider) : ethereumProvider;
          const aaChainIds = new Set(accountAbstractionConfig?.chains?.map((chain) => chain.chainId) || []);
          const aaProvider = await accountAbstractionProvider({
            accountAbstractionConfig,
            provider: eoaProvider,
            chain: this.currentChain,
            chains: this.coreOptions.chains.filter((chain) => aaChainIds.has(chain.chainId)),
            useProviderAsTransport: data.connectorName === WALLET_CONNECTORS.AUTH,
          });
          this.aaProvider = aaProvider;

          // if external wallet is used and AA is enabled for external wallets, use AA provider
          // for embedded wallets, we use ws-embed provider which already supports AA
          if (data.connectorName !== WALLET_CONNECTORS.AUTH && this.coreOptions.useAAWithExternalWallet) {
            finalProvider = this.aaProvider;
          }
        }
        this.commonJRPCProvider.updateProviderEngineProxy(finalProvider);
      }

      this.setState({ connectedConnectorName: data.connectorName as WALLET_CONNECTOR_TYPE });
      this.cacheWallet(data.connectorName);

      const isSolanaOnly = connector.connectorNamespace === CHAIN_NAMESPACES.SOLANA;
      this.currentConnection = {
        ethereumProvider: isSolanaOnly ? null : ethereumProvider ? this.commonJRPCProvider : null,
        solanaWallet: solanaWallet ?? null,
        connectorName: data.connectorName,
      };

      this.status = CONNECTOR_STATUS.CONNECTED;
      log.debug("connected", this.status, this.connectedConnectorName);
      this.connectToPlugins({ ...data, connector: data.connectorName as WALLET_CONNECTOR_TYPE });
      this.emit(CONNECTOR_EVENTS.CONNECTED, { ...data, loginMode: this.loginMode });
    });

    connector.on(CONNECTOR_EVENTS.DISCONNECTED, async () => {
      this.currentConnection = null;
      // re-setup commonJRPCProvider
      this.commonJRPCProvider.removeAllListeners();
      this.setupCommonJRPCProvider();

      // get back to ready state for rehydrating.
      this.status = CONNECTOR_STATUS.READY;
      const cachedConnector = this.state.cachedConnector;
      if (this.connectedConnectorName === cachedConnector) {
        await this.clearCache();
      }

      log.debug("disconnected", this.status, this.connectedConnectorName);
      await Promise.all(
        Object.values(this.plugins).map(async (plugin) => {
          if (!plugin.SUPPORTED_CONNECTORS.includes(connector.name as WALLET_CONNECTOR_TYPE)) return;
          if (plugin.status !== PLUGIN_STATUS.CONNECTED) return;
          return plugin.disconnect().catch((error: Web3AuthError) => {
            // swallow error if connector doesn't supports this plugin.
            if (error.code === 5211) {
              return;
            }
            // throw error;
            log.error(error);
          });
        })
      );
      await this.setState({ connectedConnectorName: null });
      this.emit(CONNECTOR_EVENTS.DISCONNECTED);
    });
    connector.on(CONNECTOR_EVENTS.CONNECTING, (data) => {
      this.status = CONNECTOR_STATUS.CONNECTING;
      this.emit(CONNECTOR_EVENTS.CONNECTING, data);
      log.debug("connecting", this.status, this.connectedConnectorName);
    });
    connector.on(CONNECTOR_EVENTS.ERRORED, async (data) => {
      this.status = CONNECTOR_STATUS.ERRORED;
      await this.clearCache();
      this.emit(CONNECTOR_EVENTS.ERRORED, data, this.loginMode);
      log.debug("errored", this.status, this.connectedConnectorName);
    });

    connector.on(CONNECTOR_EVENTS.REHYDRATION_ERROR, async (error: Web3AuthError) => {
      this.status = CONNECTOR_STATUS.READY;
      await this.clearCache();
      this.emit(CONNECTOR_EVENTS.REHYDRATION_ERROR, error);
    });

    connector.on(CONNECTOR_EVENTS.CONNECTOR_DATA_UPDATED, (data) => {
      log.debug("connector data updated", data);
      this.emit(CONNECTOR_EVENTS.CONNECTOR_DATA_UPDATED, data);
    });

    connector.on(CONNECTOR_EVENTS.CACHE_CLEAR, async (data) => {
      log.debug("connector cache clear", data);
      await this.clearCache();
    });

    connector.on(CONNECTOR_EVENTS.MFA_ENABLED, (isMFAEnabled: boolean) => {
      log.debug("mfa enabled", isMFAEnabled);
      const authConnector = this.connectedConnector as AuthConnectorType;

      // mfa_enabled event is only emitted when using "popup" ux_mode
      // TODO: handle mfa_enabled event when using "redirect" ux_mode
      this.analytics.track(ANALYTICS_EVENTS.MFA_ENABLEMENT_COMPLETED, {
        connector: this.connectedConnector.name,
        auth_ux_mode: authConnector.authInstance?.options?.uxMode,
        is_mfa_enabled: isMFAEnabled,
      });
      this.emit(CONNECTOR_EVENTS.MFA_ENABLED, isMFAEnabled);
    });

    connector.on(CONNECTOR_EVENTS.AUTHORIZING, (data) => {
      this.status = CONNECTOR_STATUS.AUTHORIZING;
      this.emit(CONNECTOR_EVENTS.AUTHORIZING, data);
      log.debug("authorizing", this.status, this.connectedConnectorName);
    });
    connector.on(CONNECTOR_EVENTS.AUTHORIZED, async (data: AUTHORIZED_EVENT_DATA) => {
      this.status = CONNECTOR_STATUS.AUTHORIZED;
      await this.setState({
        idToken: data.authTokenInfo.idToken,
        accessToken: data.authTokenInfo.accessToken ?? null,
        refreshToken: data.authTokenInfo.refreshToken ?? null,
      });
      this.emit(CONNECTOR_EVENTS.AUTHORIZED, data);
      log.debug("authorized", this.status, this.connectedConnectorName);
    });
  }

  protected checkInitRequirements(): void {
    if (this.status === CONNECTOR_STATUS.READY) throw WalletInitializationError.notReady("Connector is already initialized");
  }

  protected checkIfAutoConnect(connector: IConnector<unknown>): boolean {
    let autoConnect = this.cachedConnector === connector.name;
    if (autoConnect && this.currentChain?.chainNamespace) {
      if (connector.connectorNamespace === CONNECTOR_NAMESPACES.MULTICHAIN) autoConnect = true;
      else autoConnect = connector.connectorNamespace === this.currentChain.chainNamespace;
    }
    return autoConnect;
  }

  /**
   * Gets the initial chain configuration for a connector
   * @throws WalletInitializationError If no chain is found for the connector's namespace
   */
  protected getInitialChainIdForConnector(connector: IConnector<unknown>): CustomChainConfig {
    let initialChain = this.currentChain;
    if (initialChain?.chainNamespace !== connector.connectorNamespace && connector.connectorNamespace !== CONNECTOR_NAMESPACES.MULTICHAIN) {
      initialChain = this.coreOptions.chains.find((x) => x.chainNamespace === connector.connectorNamespace);
      if (!initialChain) throw WalletInitializationError.invalidParams(`No chain found for ${connector.connectorNamespace}`);
    }
    return initialChain;
  }

  private async cacheWallet(walletName: string): Promise<void> {
    await this.setState({
      cachedConnector: walletName,
    });
  }

  private async setCurrentChain(chainId: string): Promise<void> {
    if (chainId === this.currentChainId) return;
    const newChain = this.coreOptions.chains.find((chain) => chain.chainId === chainId);
    if (!newChain) throw WalletInitializationError.invalidParams(`Invalid chainId: ${chainId}`);
    this.setState({ currentChainId: chainId });
  }

  private connectToPlugins(data: { connector: WALLET_CONNECTOR_TYPE }) {
    Object.values(this.plugins).map(async (plugin) => {
      try {
        // skip if it's not compatible with the connector
        if (!plugin.SUPPORTED_CONNECTORS.includes(data.connector)) return;
        // skip if it's not compatible with the current chain
        if (plugin.pluginNamespace !== PLUGIN_NAMESPACES.MULTICHAIN && plugin.pluginNamespace !== this.currentChain?.chainNamespace) return;
        // skip if it's already connected
        if (plugin.status === PLUGIN_STATUS.CONNECTED) return;

        await plugin.initWithWeb3Auth(this, this.coreOptions.uiConfig, this.analytics);
        await plugin.connect();
      } catch (error: unknown) {
        // swallow error if connector connector doesn't supports this plugin.
        if ((error as Web3AuthError).code === 5211) {
          return;
        }
        log.error(error);
      }
    });
  }

  private async setState(newState: Partial<IWeb3AuthState>): Promise<void> {
    this.state = { ...this.state, ...newState };
    await this.storage.set(WEB3AUTH_STATE_STORAGE_KEY, JSON.stringify(this.state));
  }

  private async loadState(initialState?: IWeb3AuthState): Promise<void> {
    if (initialState) {
      this.state = initialState;
      return;
    }
    const state = await this.storage.get(WEB3AUTH_STATE_STORAGE_KEY);
    if (!state) return;
    this.state = deserialize<IWeb3AuthState>(state);
  }

  private getStorageMethod(): IStorageAdapter {
    if (this.coreOptions.storage?.sessionId) return this.coreOptions.storage.sessionId;
    if (this.coreOptions.ssr) return new CookieStorage({ maxAge: this.coreOptions.sessionTime });
    if (storageAvailable("localStorage")) return new LocalStorageAdapter();
    return new MemoryStorage();
  }
}
