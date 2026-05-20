import { CaipAccountId } from "@metamask/connect-evm";
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

import { type LinkAccountParams, type LinkAccountResult, UnlinkAccountResult } from "./account-linking";
import {
  Analytics,
  ANALYTICS_EVENTS,
  ANALYTICS_INTEGRATION_TYPE,
  ANALYTICS_SDK_TYPE,
  AuthLoginParams,
  AUTHORIZED_EVENT_DATA,
  type AuthTokenInfo,
  CAN_AUTHORIZE_STATUSES,
  CAN_LOGOUT_STATUSES,
  CHAIN_NAMESPACES,
  type ChainNamespaceType,
  type CONNECTED_EVENT_DATA,
  CONNECTED_STATUSES,
  ConnectedAccountsWithProviders,
  type Connection,
  CONNECTOR_EVENTS,
  CONNECTOR_INITIAL_AUTHENTICATION_MODE,
  CONNECTOR_NAMESPACES,
  CONNECTOR_STATUS,
  type CONNECTOR_STATUS_TYPE,
  type ConnectorParams,
  type CustomChainConfig,
  DISCONNECTED_EVENT_DATA,
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
  LinkedAccountInfo,
  log,
  LOGIN_MODE,
  LoginModeType,
  type LoginParamMap,
  normalizeWalletName,
  parseChainNamespaceFromCitadelResponse,
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
import { AccountLinkingError } from "./base/errors";
import {
  assertAuthConnector,
  authConnector,
  type AuthConnectorSwitchAccountResult,
  type AuthConnectorType,
  isAuthConnector,
} from "./connectors/auth-connector";
import { metaMaskConnector } from "./connectors/metamask-connector";
import { walletServicesPlugin } from "./plugins/wallet-services-plugin";
import { type AccountAbstractionProvider } from "./providers/account-abstraction-provider";
import { CommonJRPCProvider } from "./providers/base-provider";

const PRIMARY_CONNECTED_WALLET_KEY = "__primary__";
type ConnectedWalletAccountRef = LinkedAccountInfo | Pick<LinkedAccountInfo, "id" | "isPrimary"> | null | undefined;

export class Web3AuthNoModal extends SafeEventEmitter<Web3AuthNoModalEvents> implements IWeb3Auth {
  readonly coreOptions: IWeb3AuthCoreOptions;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  public loginMode: LoginModeType = LOGIN_MODE.NO_MODAL;

  protected aaProvider: AccountAbstractionProvider | null = null;

  protected connectors: IConnector<unknown>[] = [];

  protected commonJRPCProvider: CommonJRPCProvider | null = null;

  protected analytics: Analytics;

  protected plugins: Record<string, IPlugin> = {};

  protected consentRequired = false;

  protected projectConfig: ProjectConfig | null = null;

  private storage: IStorageAdapter;

  private connectionReconnected = false;

  /** Connected wallet state keyed by linked account id; the primary session uses a reserved key. */
  private connectedWalletConnectorMap: Map<string, ConnectedAccountsWithProviders> = new Map();

  private activeWalletConnectorKey = PRIMARY_CONNECTED_WALLET_KEY;

  private state: IWeb3AuthState = {
    primaryConnectorName: null,
    cachedConnector: null,
    currentChainId: null,
    idToken: null,
    accessToken: null,
    refreshToken: null,
    activeAccount: null,
  };

  constructor(options: IWeb3AuthCoreOptions, initialState?: Partial<IWeb3AuthState>) {
    super();
    if (!options.clientId) throw WalletInitializationError.invalidParams("Please provide a valid clientId in constructor");
    if (options.enableLogging) log.enableAll();
    else log.setLevel("error");
    if (!options.initialAuthenticationMode) options.initialAuthenticationMode = CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN;

    this.coreOptions = options;
    this.storage = this.getStorageMethod();
    this.analytics = new Analytics();
    if (options.disableAnalytics) {
      this.analytics.disable();
    }
    this.analytics.setGlobalProperties({ integration_type: ANALYTICS_INTEGRATION_TYPE.NATIVE_SDK });

    this.loadState(initialState)
      .then((): undefined => {
        if (this.state.idToken && this.coreOptions.ssr && !this.consentRequired) {
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
    return Boolean(this.primaryConnector);
  }

  /**
   * Get Provider State Syncing status for the primary connector.
   */
  get isProviderStateSyncing(): boolean {
    const activeConnectedWallet = this.getConnectedWalletConnectorStateByKey(this.activeWalletConnectorKey);
    const connector =
      activeConnectedWallet?.connector ??
      (this.activeWalletConnectorKey === PRIMARY_CONNECTED_WALLET_KEY ? this.primaryConnector : null);

    // Only auth connectors expose provider state syncing.
    if (!isAuthConnector(connector)) {
      return false;
    }

    return connector.isProviderStateSyncing;
  }

  /**
   * Get Account Ready status for the primary connector.
   */
  get isAccountReady(): boolean {
    const activeConnectedWallet = this.getConnectedWalletConnectorStateByKey(this.activeWalletConnectorKey);
    const connector =
      activeConnectedWallet?.connector ??
      (this.activeWalletConnectorKey === PRIMARY_CONNECTED_WALLET_KEY ? this.primaryConnector : null);

    if (!CONNECTED_STATUSES.includes(this.status) || !connector) {
      return false;
    }

    const hasUsableConnection = Boolean(
      activeConnectedWallet?.signingProvider || activeConnectedWallet?.solanaWallet || connector.provider || connector.solanaWallet
    );
    if (!hasUsableConnection) {
      return false;
    }

    return isAuthConnector(connector) ? connector.isAccountReady : true;
  }

  get connection(): Connection | null {
    return this.getConnectedWalletConnectionByKey(this.activeWalletConnectorKey);
  }

  get primaryConnectorName(): WALLET_CONNECTOR_TYPE | null {
    return this.state.primaryConnectorName;
  }

  get cachedConnector(): string | null {
    return this.state.cachedConnector;
  }

  get currentChainId(): string | null {
    return this.state.currentChainId || this.coreOptions.defaultChainId || this.coreOptions.chains?.[0]?.chainId || null;
  }

  /**
   * This is always the primary connector that is connected to the user.
   */
  get primaryConnector(): IConnector<unknown> | null {
    return this.getConnector(this.primaryConnectorName, this.currentChain?.chainNamespace);
  }

  get accountAbstractionProvider(): AccountAbstractionProvider | null {
    return this.aaProvider;
  }

  get idToken(): string | null {
    return this.state.idToken || null;
  }

  get accessToken(): string | null {
    return this.state.accessToken || null;
  }

  get refreshToken(): string | null {
    return this.state.refreshToken || null;
  }

  protected get activeAccount(): LinkedAccountInfo | null {
    return this.state.activeAccount;
  }

  /**
   * This is the current active connector.
   */
  private get activeConnector(): IConnector<unknown> | null {
    const activeConnectedWallet = this.getConnectedWalletConnectorStateByKey(this.activeWalletConnectorKey);
    if (activeConnectedWallet) {
      return activeConnectedWallet.connector;
    }

    if (this.activeWalletConnectorKey !== PRIMARY_CONNECTED_WALLET_KEY) {
      throw new Error(`Signing connector not found for account "${this.activeWalletConnectorKey}".`);
    }

    return this.primaryConnector;
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
      this.projectConfig = projectConfig;
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
    this.connectedWalletConnectorMap.clear();
    this.activeWalletConnectorKey = PRIMARY_CONNECTED_WALLET_KEY;
    this.connectionReconnected = false;
    await this.setState({
      primaryConnectorName: null,
      cachedConnector: null,
      currentChainId: null,
      idToken: null,
      accessToken: null,
      refreshToken: null,
      activeAccount: null,
      hasUserConsent: undefined,
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

    if (CONNECTED_STATUSES.includes(this.status)) {
      const activeConnector = this.activeConnector;
      if (!activeConnector) throw WalletInitializationError.notReady("Active signing connector is not ready");

      // Single-namespace connectors cannot cross namespace boundaries — MULTICHAIN connectors
      // (Auth, WC) enforce their own switchChain policy internally.
      if (
        activeConnector.connectorNamespace !== CONNECTOR_NAMESPACES.MULTICHAIN &&
        activeConnector.connectorNamespace !== newChainConfig.chainNamespace
      ) {
        throw WalletLoginError.connectionError(
          `Cannot switch between chain namespaces with ${activeConnector.name}. Disconnect and reconnect with the target chain.`
        );
      }

      await activeConnector.switchChain(params);
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
        } else if (connectedEventCompleted) {
          await completeConnection();
        }
      };

      const completeConnection = async () => {
        try {
          // track connection completed event
          const userInfo = await this.getUserInfo();
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
    if (!CAN_LOGOUT_STATUSES.includes(this.status) || !this.primaryConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    if (this.primaryConnector.status === CONNECTOR_STATUS.DISCONNECTING) return;
    await this.primaryConnector.disconnect(options);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    log.debug("Getting user info", this.status, this.primaryConnector?.name);
    if (!CAN_AUTHORIZE_STATUSES.includes(this.status) || !this.primaryConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    const userInfo = await this.primaryConnector.getUserInfo();
    const linkedAccounts =
      userInfo.linkedAccounts?.map((account) => ({
        ...account,
        active: this.state.activeAccount ? account.id === this.state.activeAccount.id : account.isPrimary,
      })) ?? [];
    this.syncConnectedWalletLinkedAccounts(linkedAccounts);

    return {
      ...userInfo,
      linkedAccounts,
    };
  }

  async getLinkedAccounts(): Promise<LinkedAccountInfo[]> {
    if (!CAN_AUTHORIZE_STATUSES.includes(this.status) || !this.primaryConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);

    assertAuthConnector(this.primaryConnector, "Linked accounts can only be fetched when connected with the AUTH connector.");

    const linkedAccounts = await this.primaryConnector.getLinkedAccounts();
    const resolvedLinkedAccounts = linkedAccounts.map((account) => ({
      ...account,
      active: this.state.activeAccount ? account.id === this.state.activeAccount.id : account.isPrimary,
    }));
    this.syncConnectedWalletLinkedAccounts(resolvedLinkedAccounts);
    return resolvedLinkedAccounts;
  }

  getConnectedAccountsWithProviders(): ConnectedAccountsWithProviders[] {
    if (!CONNECTED_STATUSES.includes(this.status) || !this.primaryConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);

    if (this.status !== CONNECTOR_STATUS.AUTHORIZED) {
      // before the wallet is authorized, we don't have the user info, so we return an empty array
      return [];
    }

    const connectedAccounts: ConnectedAccountsWithProviders[] = [];
    for (const [, value] of this.connectedWalletConnectorMap.entries()) {
      const hasWalletProvider = Boolean(value.signingProvider || value.solanaWallet);
      if (hasWalletProvider && this.hasUsableConnectedSwitchConnector(value.connector)) {
        connectedAccounts.push(value);
      }
    }
    return connectedAccounts;
  }

  async enableMFA<T>(loginParams?: T): Promise<void> {
    if (!CONNECTED_STATUSES.includes(this.status) || !this.primaryConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    if (this.primaryConnector.name !== WALLET_CONNECTORS.AUTH)
      throw WalletLoginError.unsupportedOperation(`EnableMFA is not supported for this connector.`);

    const authConnector = this.primaryConnector as AuthConnectorType;
    const trackData = { connector: this.primaryConnector.name, auth_ux_mode: authConnector.authInstance?.options?.uxMode };
    try {
      this.analytics.track(ANALYTICS_EVENTS.MFA_ENABLEMENT_STARTED, trackData);
      await this.primaryConnector.enableMFA(loginParams);
    } catch (error) {
      this.analytics.track(ANALYTICS_EVENTS.MFA_ENABLEMENT_FAILED, {
        ...trackData,
        ...getErrorAnalyticsProperties(error),
      });
      throw error;
    }
  }

  async manageMFA<T>(loginParams?: T): Promise<void> {
    if (!CONNECTED_STATUSES.includes(this.status) || !this.primaryConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    if (this.primaryConnector.name !== WALLET_CONNECTORS.AUTH)
      throw WalletLoginError.unsupportedOperation(`ManageMFA is not supported for this connector.`);

    const authConnector = this.primaryConnector as AuthConnectorType;
    const trackData = { connector: this.primaryConnector.name, auth_ux_mode: authConnector.authInstance?.options?.uxMode };
    try {
      this.analytics.track(ANALYTICS_EVENTS.MFA_MANAGEMENT_SELECTED, trackData);
      await this.primaryConnector.manageMFA(loginParams);
    } catch (error) {
      this.analytics.track(ANALYTICS_EVENTS.MFA_MANAGEMENT_FAILED, {
        ...trackData,
        ...getErrorAnalyticsProperties(error),
      });
      throw error;
    }
  }

  async getAuthTokenInfo(): Promise<Pick<AuthTokenInfo, "idToken">> {
    if (!CAN_AUTHORIZE_STATUSES.includes(this.status) || !this.primaryConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);

    const trackData = { connector: this.primaryConnector.name };
    try {
      this.analytics.track(ANALYTICS_EVENTS.IDENTITY_TOKEN_STARTED, trackData);
      const authTokenInfo = await this.primaryConnector.getAuthTokenInfo();
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

  public async switchAccount(account: LinkedAccountInfo): Promise<void> {
    const authConnector = this.getMainAuthConnector();
    const switchResult = await authConnector.switchAccount(account, {
      activeAccount: this.state.activeAccount,
      currentChainId: this.currentChainId,
    });
    if (!switchResult) {
      return;
    }

    try {
      await this.processSwitchAccountResult(authConnector, switchResult, { projectConfig: this.projectConfig ?? undefined });
      await authConnector.trackSwitchAccountCompleted(switchResult.targetAccount);
    } catch (error) {
      await authConnector.trackSwitchAccountFailed(switchResult.targetAccount, error);
      throw error;
    }
  }

  public async linkAccount(params?: LinkAccountParams): Promise<LinkAccountResult> {
    if (!params?.connectorName) {
      throw WalletInitializationError.invalidParams("connectorName is required when calling linkAccount on the no-modal SDK");
    }
    const chainId = this.resolveLinkAccountChainId(params.chainId);
    const isolatedConnector = await this.createLinkingWalletConnector(params.connectorName, chainId);
    return this.linkAccountWithConnector(params.connectorName, chainId, isolatedConnector);
  }

  public async unlinkAccount(address: string): Promise<UnlinkAccountResult> {
    const authConnector = this.getMainAuthConnector();
    const linkedAccounts = (await authConnector.getUserInfo()).linkedAccounts ?? [];
    const targetAccount = this.findLinkedAccountByAddress(linkedAccounts, address);

    if (!targetAccount) {
      throw AccountLinkingError.accountNotLinked(`Account with address "${address}" is not linked`);
    }

    if (targetAccount.connector === WALLET_CONNECTORS.AUTH || targetAccount.isPrimary) {
      throw AccountLinkingError.cannotUnlinkPrimaryAccount();
    }

    if (this.state.activeAccount?.id === targetAccount.id) {
      throw AccountLinkingError.cannotUnlinkActiveAccount();
    }

    const result = await authConnector.unlinkAccount({
      address,
      authSessionTokens: {
        accessToken: this.accessToken,
        idToken: this.idToken,
      },
    });
    await this.setState({ idToken: result.idToken });

    // disconnect the connector for unlinked account
    const connectorToDisconnect = this.getConnectedWalletConnector(targetAccount);
    if (connectorToDisconnect) {
      try {
        if (connectorToDisconnect.connected) {
          await connectorToDisconnect.disconnect({ cleanup: true });
        }
      } catch (error) {
        log.debug(`Failed to disconnect linked account "${targetAccount.id}" during unlink`, error);
      } finally {
        this.deleteConnectedWalletConnector(targetAccount);
      }
    }
    return result;
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
      if (this.primaryConnectorName && this.primaryConnectorName !== data.connectorName) {
        // Ignore registered connectors that are not the active primary session connector.
        return;
      }

      if (!this.commonJRPCProvider) throw WalletInitializationError.notFound(`CommonJrpcProvider not found`);
      const { ethereumProvider, solanaWallet } = data;
      // Seed the primary connector synchronously so AUTHORIZED can resolve a connection
      // even while we are still restoring a previously active linked wallet.
      this.setConnectedWalletConnectorState(
        this.buildImmediateConnectedWalletConnectorState({
          connector,
          ethereumProvider,
          solanaWallet,
          usePrimaryProxy: true,
        })
      );
      this.setActiveWalletConnectorKey();
      this.connectionReconnected = data.reconnected;
      const connectedChainId = ethereumProvider?.chainId;

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
          this.deleteConnectedWalletConnector();
          this.setActiveWalletConnectorKey();
          this.status = CONNECTOR_STATUS.ERRORED;
          this.emit(CONNECTOR_EVENTS.ERRORED, error as Web3AuthError, this.loginMode);
          return;
        }
      }
      // The following block only hits during rehydration

      const { activeAccount } = this.state;
      // if the active account is not the primary account, i.e. not `null`, create an isolated connector and connect to the chain
      if (activeAccount && !activeAccount.isPrimary && activeAccount.connector !== WALLET_CONNECTORS.AUTH) {
        const accountLinkingConnector = isAuthConnector(connector) ? connector : this.getConnector(WALLET_CONNECTORS.AUTH);
        assertAuthConnector(accountLinkingConnector, "Account switching requires the AUTH connector to be available.");
        const targetChainId = accountLinkingConnector.getChainIdForLinkedAccount(activeAccount, connectedChainId);
        const walletConnector = await this.createIsolatedWalletConnector(activeAccount.connector as WALLET_CONNECTOR_TYPE, targetChainId);
        let linkedAccountConnection: Connection | null = null;

        if (!this.hasUsableConnectedSwitchConnector(walletConnector)) {
          linkedAccountConnection = await walletConnector.connect({ chainId: targetChainId });
          if (!linkedAccountConnection) {
            throw AccountLinkingError.requestFailed(`Failed to connect isolated connector "${activeAccount.connector}" for account switch.`);
          }
        }

        const connectedWalletState = await this.resolveConnectedWalletConnectorState({
          connector: walletConnector,
          ethereumProvider: walletConnector.provider ?? linkedAccountConnection?.ethereumProvider ?? null,
          solanaWallet: walletConnector.solanaWallet ?? linkedAccountConnection?.solanaWallet ?? null,
          usePrimaryProxy: false,
          account: activeAccount,
        });
        this.setConnectedWalletConnectorState(connectedWalletState, activeAccount);
        this.setActiveWalletConnectorKey(activeAccount);
      }

      if (ethereumProvider) {
        await this.bindPrimaryEthereumSigningProxy(ethereumProvider, data.connectorName);
      }

      const primaryConnectedWalletState = await this.resolveConnectedWalletConnectorState({
        connector,
        ethereumProvider,
        solanaWallet,
        usePrimaryProxy: true,
      });
      this.setConnectedWalletConnectorState(primaryConnectedWalletState);

      await this.setState({ primaryConnectorName: data.connectorName as WALLET_CONNECTOR_TYPE, currentChainId: connectedChainId });
      this.cacheWallet(data.connectorName);

      const isConnectAndSign = this.coreOptions.initialAuthenticationMode === CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN;
      if (this.consentRequired && !isConnectAndSign && !this.state.hasUserConsent) {
        this.status = CONNECTOR_STATUS.CONSENT_REQUIRING;
        this.emit(CONNECTOR_EVENTS.CONSENT_REQUIRING);
        log.debug("consent_requiring", this.status, this.primaryConnectorName);
      } else {
        this.status = CONNECTOR_STATUS.CONNECTED;
        log.debug("connected", this.status, this.primaryConnectorName);
        this.connectToPlugins({ ...data, connector: data.connectorName as WALLET_CONNECTOR_TYPE });
        this.emit(CONNECTOR_EVENTS.CONNECTED, { ...data, loginMode: this.loginMode });
      }
    });

    connector.on(CONNECTOR_EVENTS.DISCONNECTED, async (data?: DISCONNECTED_EVENT_DATA) => {
      if (this.shouldIgnoreInactiveConnectorEvent(connector, CONNECTOR_EVENTS.DISCONNECTED)) return;
      const disconnectedConnector = data?.connector;
      const { activeAccount } = this.state;
      if (!activeAccount || (activeAccount && activeAccount.isPrimary) || disconnectedConnector === WALLET_CONNECTORS.AUTH) {
        // If the primary session disconnects, tear down every other connected wallet connector
        // and clear the entire map.
        await Promise.all(
          Array.from(this.connectedWalletConnectorMap.entries()).map(async ([accountId, connectedWallet]) => {
            if (connectedWallet.connector === connector) {
              this.connectedWalletConnectorMap.delete(accountId);
              return;
            }

            try {
              if (connectedWallet.connected && connectedWallet.connector.connected) {
                await connectedWallet.connector.disconnect({ cleanup: true });
              }
            } catch (error) {
              log.debug("Connected wallet connector disconnect on primary disconnect", error);
            } finally {
              this.connectedWalletConnectorMap.delete(accountId);
            }
          })
        );
      }

      this.connectedWalletConnectorMap.clear();
      this.activeWalletConnectorKey = PRIMARY_CONNECTED_WALLET_KEY;
      this.connectionReconnected = false;
      // re-setup commonJRPCProvider
      this.commonJRPCProvider.removeAllListeners();
      this.setupCommonJRPCProvider();

      // get back to ready state for rehydrating.
      this.status = CONNECTOR_STATUS.READY;
      const cachedConnector = this.state.cachedConnector;
      if (this.primaryConnectorName === cachedConnector) {
        await this.clearCache();
      }

      log.debug("disconnected", this.status, this.primaryConnectorName);
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
      await this.setState({ primaryConnectorName: null, hasUserConsent: undefined, activeAccount: null });
      this.emit(CONNECTOR_EVENTS.DISCONNECTED);
    });
    connector.on(CONNECTOR_EVENTS.CONNECTING, (data) => {
      this.status = CONNECTOR_STATUS.CONNECTING;
      this.emit(CONNECTOR_EVENTS.CONNECTING, data);
      log.debug("connecting", this.status, this.primaryConnectorName);
    });
    connector.on(CONNECTOR_EVENTS.ERRORED, async (data) => {
      if (this.shouldIgnoreInactiveConnectorEvent(connector, CONNECTOR_EVENTS.ERRORED)) {
        log.error("Inactive connector emitted errored event", {
          connector: connector.name,
          error: data,
        });
        return;
      }
      this.status = CONNECTOR_STATUS.ERRORED;
      await this.clearCache();
      this.emit(CONNECTOR_EVENTS.ERRORED, data, this.loginMode);
      log.debug("errored", this.status, this.primaryConnectorName);
    });

    connector.on(CONNECTOR_EVENTS.REHYDRATION_ERROR, async (error: Web3AuthError) => {
      if (this.shouldIgnoreInactiveConnectorEvent(connector, CONNECTOR_EVENTS.REHYDRATION_ERROR)) {
        log.error("Inactive connector emitted rehydration error", {
          connector: connector.name,
          error,
        });
        return;
      }
      this.status = CONNECTOR_STATUS.READY;
      await this.clearCache();
      this.emit(CONNECTOR_EVENTS.REHYDRATION_ERROR, error);
    });

    connector.on(CONNECTOR_EVENTS.CONNECTOR_DATA_UPDATED, (data) => {
      log.debug("connector data updated", data);
      this.emit(CONNECTOR_EVENTS.CONNECTOR_DATA_UPDATED, data);
    });

    connector.on(CONNECTOR_EVENTS.CACHE_CLEAR, async (data) => {
      if (this.shouldIgnoreInactiveConnectorEvent(connector, CONNECTOR_EVENTS.CACHE_CLEAR)) return;
      log.debug("connector cache clear", data);
      await this.clearCache();
    });

    connector.on(CONNECTOR_EVENTS.MFA_ENABLED, (isMFAEnabled: boolean) => {
      log.debug("mfa enabled", isMFAEnabled);
      const authConnector = this.primaryConnector as AuthConnectorType;

      // mfa_enabled event is only emitted when using "popup" ux_mode
      // TODO: handle mfa_enabled event when using "redirect" ux_mode
      this.analytics.track(ANALYTICS_EVENTS.MFA_ENABLEMENT_COMPLETED, {
        connector: this.primaryConnector.name,
        auth_ux_mode: authConnector.authInstance?.options?.uxMode,
        is_mfa_enabled: isMFAEnabled,
      });
      this.emit(CONNECTOR_EVENTS.MFA_ENABLED, isMFAEnabled);
    });

    connector.on(CONNECTOR_EVENTS.AUTHORIZING, (data) => {
      this.status = CONNECTOR_STATUS.AUTHORIZING;
      this.emit(CONNECTOR_EVENTS.AUTHORIZING, data);
      log.debug("authorizing", this.status, this.primaryConnectorName);
    });
    connector.on(CONNECTOR_EVENTS.AUTHORIZED, async (data: AUTHORIZED_EVENT_DATA) => {
      await this.setState({
        idToken: data.authTokenInfo.idToken,
        accessToken: data.authTokenInfo.accessToken ?? null,
        refreshToken: data.authTokenInfo.refreshToken ?? null,
      });
      // if the user has not consented yet, we will ask for consent
      if (this.consentRequired && this.connection && !this.state.hasUserConsent) {
        this.status = CONNECTOR_STATUS.CONSENT_REQUIRING;
        this.emit(CONNECTOR_EVENTS.CONSENT_REQUIRING);
        log.debug("consent_requiring", this.status, this.primaryConnectorName);
      } else {
        this.status = CONNECTOR_STATUS.AUTHORIZED;
        this.emit(CONNECTOR_EVENTS.AUTHORIZED, data);
        log.debug("authorized", this.status, this.primaryConnectorName);
      }
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

  protected async completeConsentAcceptance(): Promise<void> {
    const connection = this.connection;
    if (!connection) {
      throw WalletLoginError.connectionError("Cannot accept consent: no active connection");
    }

    if (this.status !== CONNECTOR_STATUS.CONSENT_REQUIRING) {
      throw WalletLoginError.connectionError("Cannot accept consent: not in consent_requiring state");
    }

    await this.setState({ hasUserConsent: true });

    const isConnectAndSign = this.coreOptions.initialAuthenticationMode === CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN;
    if (isConnectAndSign && this.state.idToken) {
      this.status = CONNECTOR_STATUS.AUTHORIZED;
      log.debug("consent accepted, authorized", this.status, this.primaryConnectorName);
    } else {
      this.status = CONNECTOR_STATUS.CONNECTED;
      log.debug("consent accepted, connected", this.status, this.primaryConnectorName);
    }

    // connect to wallet-service plugin
    if (this.primaryConnectorName === WALLET_CONNECTORS.AUTH) {
      this.connectToPlugins({ connector: this.primaryConnectorName as WALLET_CONNECTOR_TYPE });
    }

    this.emit(CONNECTOR_EVENTS.CONSENT_ACCEPTED, { reconnected: this.connectionReconnected });
  }

  protected resolveLinkAccountChainId(chainId?: string | null): string {
    const finalChainId = chainId || this.state.currentChainId;
    if (!finalChainId) {
      throw AccountLinkingError.walletProofFailed(
        "No chainId is available. Please specify chainId in LinkAccountParams or ensure the SDK has an active chain."
      );
    }
    return finalChainId;
  }

  /**
   * Resolves the chain ID for a switch account operation.
   * If the account's chain namespace is the same as the current chain namespace, return the current chain ID.
   * If the account's chain namespace is different from the current chain namespace, return the chainId the account was linked in.
   *
   * @param account - The account to switch to.
   * @param activeChainId - The current active chain ID.
   * @returns The resolved chain ID.
   */
  protected resolveSwitchAccountChainId(account: Pick<LinkedAccountInfo, "chainNamespace">, activeChainId: string): string {
    const targetChainNamespace = account.chainNamespace ? parseChainNamespaceFromCitadelResponse(account.chainNamespace) : null;
    if (targetChainNamespace && this.currentChain.chainNamespace === targetChainNamespace) {
      return this.currentChain.chainId;
    }

    return activeChainId;
  }

  protected async createLinkingWalletConnector(
    connectorName: WALLET_CONNECTOR_TYPE | string,
    chainId: string,
    config?: ProjectConfig
  ): Promise<IConnector<unknown>> {
    return this.createIsolatedWalletConnector(connectorName, chainId, config);
  }

  protected async createSwitchingWalletConnector(
    connectorName: WALLET_CONNECTOR_TYPE | string,
    chainId: string,
    config?: ProjectConfig
  ): Promise<IConnector<unknown>> {
    return this.createIsolatedWalletConnector(connectorName, chainId, config);
  }

  protected getConnectedWalletConnector(account?: Pick<LinkedAccountInfo, "id" | "isPrimary"> | null): IConnector<unknown> | null {
    return this.getConnectedWalletConnectorState(account)?.connector ?? null;
  }

  protected getConnectedWalletConnectorState(account?: Pick<LinkedAccountInfo, "id" | "isPrimary"> | null): ConnectedAccountsWithProviders | null {
    return this.getConnectedWalletConnectorStateByKey(this.getConnectedWalletConnectorKey(account));
  }

  protected setConnectedWalletConnectorState(
    connectedWallet: ConnectedAccountsWithProviders,
    account?: Pick<LinkedAccountInfo, "id" | "isPrimary"> | null
  ): void {
    this.connectedWalletConnectorMap.set(this.getConnectedWalletConnectorKey(account), connectedWallet);
  }

  protected setConnectedWalletConnector(connector: IConnector<unknown>, account?: Pick<LinkedAccountInfo, "id" | "isPrimary"> | null): void {
    this.setConnectedWalletConnectorState(
      {
        ...this.getConnectedWalletLinkedAccountInfo(account),
        connector,
        signingProvider: connector.provider,
        solanaWallet: connector.solanaWallet ?? null,
        connected: connector.connected || connector.status === CONNECTOR_STATUS.CONNECTED,
      },
      account
    );
  }

  protected deleteConnectedWalletConnector(account?: Pick<LinkedAccountInfo, "id" | "isPrimary"> | null): void {
    this.connectedWalletConnectorMap.delete(this.getConnectedWalletConnectorKey(account));
  }

  protected getConnectedWalletConnection(account?: Pick<LinkedAccountInfo, "id" | "isPrimary"> | null): Connection | null {
    return this.getConnectedWalletConnectionByKey(this.getConnectedWalletConnectorKey(account));
  }

  protected hasUsableConnectedSwitchConnector(connector: IConnector<unknown> | null): boolean {
    if (!connector) return false;

    const isConnected = connector.connected || connector.status === CONNECTOR_STATUS.CONNECTED;
    return Boolean(isConnected && (connector.provider || connector.solanaWallet));
  }

  protected setActiveWalletConnectorKey(account?: Pick<LinkedAccountInfo, "id" | "isPrimary"> | null): void {
    this.activeWalletConnectorKey = this.getConnectedWalletConnectorKey(account);
  }

  protected getConnectedWalletConnectorKey(account?: Pick<LinkedAccountInfo, "id" | "isPrimary"> | null): string {
    return !account || account.isPrimary ? PRIMARY_CONNECTED_WALLET_KEY : account.id;
  }

  protected getConnectedWalletConnectorStateByKey(accountKey: string): ConnectedAccountsWithProviders | null {
    return this.connectedWalletConnectorMap.get(accountKey) ?? null;
  }

  protected isLinkedAccountInfo(account: ConnectedWalletAccountRef): account is LinkedAccountInfo {
    return Boolean(account && "connector" in account);
  }

  protected toConnectedWalletLinkedAccountInfo(account: Omit<LinkedAccountInfo, "connector">): Omit<LinkedAccountInfo, "connector"> {
    return {
      id: account.id,
      isPrimary: account.isPrimary,
      eoaAddress: account.eoaAddress,
      aaAddress: account.aaAddress,
      aaProvider: account.aaProvider,
      active: account.active,
      accountType: account.accountType,
      address: account.address,
      authConnectionId: account.authConnectionId,
      groupedAuthConnectionId: account.groupedAuthConnectionId,
      chainNamespace: account.chainNamespace,
    };
  }

  protected getConnectedWalletLinkedAccountInfo(account?: ConnectedWalletAccountRef): Omit<LinkedAccountInfo, "connector"> {
    const existingConnectedWallet = this.getConnectedWalletConnectorState(account);
    const resolvedAccount = this.isLinkedAccountInfo(account) ? account : existingConnectedWallet;

    if (resolvedAccount) {
      return this.toConnectedWalletLinkedAccountInfo(resolvedAccount);
    }

    const isPrimaryAccount = !account || account.isPrimary;
    const accountId = account && !account.isPrimary ? account.id : PRIMARY_CONNECTED_WALLET_KEY;

    return {
      id: accountId,
      isPrimary: isPrimaryAccount,
      eoaAddress: "",
      aaAddress: undefined,
      aaProvider: undefined,
      active: this.state.activeAccount ? this.state.activeAccount.id === accountId : isPrimaryAccount,
      accountType: "",
      address: null,
      authConnectionId: null,
      groupedAuthConnectionId: null,
      chainNamespace: null,
    };
  }

  protected syncConnectedWalletLinkedAccounts(linkedAccounts: LinkedAccountInfo[]): void {
    for (const linkedAccount of linkedAccounts) {
      const accountKey = this.getConnectedWalletConnectorKey(linkedAccount);
      const connectedWallet = this.connectedWalletConnectorMap.get(accountKey);

      if (!connectedWallet) {
        continue;
      }

      this.connectedWalletConnectorMap.set(accountKey, {
        ...connectedWallet,
        ...this.toConnectedWalletLinkedAccountInfo(linkedAccount),
      });
    }
  }

  protected refreshConnectedWalletActiveStates(activeAccount: LinkedAccountInfo | null): void {
    for (const [accountKey, connectedWallet] of this.connectedWalletConnectorMap.entries()) {
      const isPrimaryAccount = accountKey === PRIMARY_CONNECTED_WALLET_KEY || connectedWallet.isPrimary;
      this.connectedWalletConnectorMap.set(accountKey, {
        ...connectedWallet,
        active: activeAccount ? connectedWallet.id === activeAccount.id : isPrimaryAccount,
      });
    }
  }

  protected getConnectedWalletConnectionByKey(accountKey: string): Connection | null {
    const connectedWallet = this.getConnectedWalletConnectorStateByKey(accountKey);
    if (!connectedWallet) {
      return null;
    }

    if (!connectedWallet.signingProvider && !connectedWallet.solanaWallet) {
      throw new Error(`Connected connector "${connectedWallet.connector.name}" is not ready.`);
    }

    return this.buildConnectionFromConnectedWalletConnectorState(connectedWallet);
  }

  protected buildConnectionFromConnectedWalletConnectorState(connectedWallet: ConnectedAccountsWithProviders): Connection {
    return {
      ethereumProvider: connectedWallet.signingProvider,
      solanaWallet: connectedWallet.solanaWallet ?? null,
      connectorName: connectedWallet.connector.name,
    };
  }

  protected buildImmediateConnectedWalletConnectorState(params: {
    connector: IConnector<unknown>;
    ethereumProvider: IProvider | null;
    solanaWallet: Connection["solanaWallet"];
    usePrimaryProxy: boolean;
    account?: ConnectedWalletAccountRef;
  }): ConnectedAccountsWithProviders {
    const { connector, ethereumProvider, solanaWallet, usePrimaryProxy, account } = params;
    const isSolanaOnly = connector.connectorNamespace === CHAIN_NAMESPACES.SOLANA;

    const connectedWallet: ConnectedAccountsWithProviders = {
      ...this.getConnectedWalletLinkedAccountInfo(account),
      connector,
      signingProvider: isSolanaOnly
        ? null
        : ethereumProvider
          ? usePrimaryProxy
            ? (this.commonJRPCProvider ?? ethereumProvider)
            : ethereumProvider
          : null,
      solanaWallet: solanaWallet ?? null,
      connected: connector.connected || connector.status === CONNECTOR_STATUS.CONNECTED || connector.status === CONNECTOR_STATUS.AUTHORIZED,
    };
    return connectedWallet;
  }

  protected async resolveConnectedWalletConnectorState(params: {
    connector: IConnector<unknown>;
    ethereumProvider: IProvider | null;
    solanaWallet: Connection["solanaWallet"];
    usePrimaryProxy: boolean;
    account?: ConnectedWalletAccountRef;
  }): Promise<ConnectedAccountsWithProviders> {
    const { connector, ethereumProvider, solanaWallet, usePrimaryProxy, account } = params;
    return this.buildImmediateConnectedWalletConnectorState({
      connector,
      ethereumProvider,
      solanaWallet,
      usePrimaryProxy,
      account,
    });
  }

  protected async linkAccountWithConnector(
    connectorName: WALLET_CONNECTOR_TYPE | string,
    chainId: string,
    walletConnector: IConnector<unknown>
  ): Promise<LinkAccountResult> {
    const authConnector = this.getMainAuthConnector();
    const result = await authConnector.linkAccount({
      connectorName,
      chainId,
      walletConnector,
      authSessionTokens: { accessToken: this.accessToken, idToken: this.idToken },
    });
    await this.setState({ idToken: result.idToken });
    await this.cacheConnectedLinkedWalletConnector(authConnector, walletConnector);
    return result;
  }

  protected getMainAuthConnector(): AuthConnectorType {
    if (!CONNECTED_STATUSES.includes(this.status) || !this.primaryConnector) {
      throw WalletLoginError.notConnectedError("No wallet is connected. Connect with AUTH before unlinking an account.");
    }

    const mainConnector = this.primaryConnector;
    assertAuthConnector(mainConnector, "Account linking is only supported when connected with the AUTH connector.");
    return mainConnector;
  }

  /**
   * Processes the result of a switch account operation.
   *
   * - If the target account is a primary account, we will switch back to the primary account.
   * - If the target account is an external account and already connected (i.e. connector is available with connected state), we will just switch to it without re-connecting again.
   * - If the target account is an external account and not connected (i.e. connector is not available with connected state), we will create a new isolated connector and connect to it.
   * @param authConnector - The main auth connector to use.
   * @param switchResult - The result of the switch account operation.
   * @param options - The options for the switch account operation.
   * @returns A promise that resolves when the switch account operation is complete.
   */
  protected async processSwitchAccountResult(
    authConnector: AuthConnectorType,
    switchResult: AuthConnectorSwitchAccountResult,
    options: { walletConnector?: IConnector<unknown>; projectConfig?: ProjectConfig } = {}
  ): Promise<void> {
    const resolvedSwitchChainId = this.resolveSwitchAccountChainId(switchResult.targetAccount, switchResult.activeChainId);

    if (switchResult.kind === "primary") {
      const existingPrimaryConnectedWalletState = this.getConnectedWalletConnectorState();
      const primaryConnectedWalletState =
        existingPrimaryConnectedWalletState ??
        (await this.resolveConnectedWalletConnectorState({
          connector: authConnector,
          ethereumProvider: switchResult.ethereumProvider,
          solanaWallet: switchResult.solanaWallet,
          usePrimaryProxy: true,
          account: switchResult.targetAccount,
        }));
      this.setConnectedWalletConnectorState({
        ...primaryConnectedWalletState,
        connector: authConnector,
        signingProvider:
          primaryConnectedWalletState.signingProvider ??
          (switchResult.ethereumProvider ? (this.commonJRPCProvider ?? switchResult.ethereumProvider) : null),
        solanaWallet: switchResult.solanaWallet ?? primaryConnectedWalletState.solanaWallet,
        connected: authConnector.connected || authConnector.status === CONNECTOR_STATUS.CONNECTED,
      });
      this.setActiveWalletConnectorKey();
    } else {
      const walletConnector =
        options.walletConnector ??
        this.getConnectedWalletConnector(switchResult.targetAccount) ??
        (await this.createSwitchingWalletConnector(switchResult.targetAccount.connector, resolvedSwitchChainId, options.projectConfig));
      let linkedAccountConnection: Connection | null = null;
      try {
        if (!this.hasUsableConnectedSwitchConnector(walletConnector)) {
          const switchChainConfig = this.coreOptions.chains.find((c) => c.chainId === resolvedSwitchChainId);
          if (!switchChainConfig) {
            throw WalletLoginError.connectionError(`Chain config is not available for chain ${resolvedSwitchChainId}`);
          }
          const caipChainId = getCaipChainId(switchChainConfig);
          const caipAccountId = `${caipChainId}:${switchResult.targetAccount.eoaAddress}` as CaipAccountId;
          linkedAccountConnection = await walletConnector.connect({ chainId: resolvedSwitchChainId, caipAccountIds: [caipAccountId] });
          if (!linkedAccountConnection) {
            throw AccountLinkingError.requestFailed(
              `Failed to connect isolated connector "${switchResult.targetAccount.connector}" for account switch.`
            );
          }
        }

        await authConnector.assertSwitchAccountConnectorMatchesTarget(walletConnector, switchResult.targetAccount);
        const connectedWalletState = await this.resolveConnectedWalletConnectorState({
          connector: walletConnector,
          ethereumProvider: walletConnector.provider ?? linkedAccountConnection?.ethereumProvider ?? null,
          solanaWallet: walletConnector.solanaWallet ?? linkedAccountConnection?.solanaWallet ?? null,
          usePrimaryProxy: false,
          account: switchResult.targetAccount,
        });
        this.setConnectedWalletConnectorState(connectedWalletState, switchResult.targetAccount);
        this.setActiveWalletConnectorKey(switchResult.targetAccount);
      } catch (error) {
        throw authConnector.toSwitchAccountConnectorError(switchResult.targetAccount, error);
      }
    }

    await this.setCurrentChain(resolvedSwitchChainId);
    await this.setState({ activeAccount: switchResult.activeAccount });
    this.syncConnectedWalletLinkedAccounts([switchResult.targetAccount]);
    this.refreshConnectedWalletActiveStates(switchResult.activeAccount);
    const connection = this.connection;
    if (!connection) {
      throw WalletLoginError.connectionError("Failed to resolve the active connection after switching accounts.");
    }
    this.emit(CONNECTOR_EVENTS.CONNECTION_UPDATED, {
      ethereumProvider: connection.ethereumProvider,
      solanaWallet: connection.solanaWallet,
      connectorName: connection.connectorName,
    });
  }

  private isActiveConnectorEventSource(connector: IConnector<unknown>): boolean {
    if (!this.primaryConnectorName) return true;
    const activeConnector = this.primaryConnector;
    if (activeConnector) return activeConnector === connector;
    return connector.name === this.primaryConnectorName;
  }

  private shouldIgnoreInactiveConnectorEvent(connector: IConnector<unknown>, event: string): boolean {
    if (this.isActiveConnectorEventSource(connector)) return false;
    log.debug("Ignoring connector lifecycle event from inactive connector", {
      event,
      sourceConnector: connector.name,
      activeConnector: this.primaryConnectorName,
    });
    return true;
  }

  private findLinkedAccountByAddress(linkedAccounts: LinkedAccountInfo[], address: string): LinkedAccountInfo | null {
    const normalizedAddress = address.toLowerCase();
    return (
      linkedAccounts.find((account) => {
        if (!account.chainNamespace || parseChainNamespaceFromCitadelResponse(account.chainNamespace) !== CHAIN_NAMESPACES.EIP155) {
          return false;
        }
        return account.address?.toLowerCase() === normalizedAddress || account.eoaAddress?.toLowerCase() === normalizedAddress;
      }) ?? null
    );
  }

  private findLinkedAccountByWalletAddress(linkedAccounts: LinkedAccountInfo[], address: string): LinkedAccountInfo | null {
    return (
      linkedAccounts.find((account) => {
        if (!account.chainNamespace) {
          return false;
        }

        const chainNamespace = parseChainNamespaceFromCitadelResponse(account.chainNamespace);
        if (chainNamespace === CHAIN_NAMESPACES.EIP155) {
          const normalizedAddress = address.toLowerCase();
          return account.address?.toLowerCase() === normalizedAddress || account.eoaAddress?.toLowerCase() === normalizedAddress;
        }

        if (chainNamespace === CHAIN_NAMESPACES.SOLANA) {
          return account.address === address || account.eoaAddress === address;
        }

        return false;
      }) ?? null
    );
  }

  private async getConnectedWalletAddress(connector: IConnector<unknown>): Promise<string | null> {
    const solanaAddress = connector.solanaWallet?.accounts?.[0]?.address;
    if (solanaAddress) {
      return solanaAddress;
    }

    if (!connector.provider) {
      return null;
    }

    const accounts = await connector.provider.request<never, string[]>({ method: "eth_accounts" });
    return accounts?.[0] ?? null;
  }

  private async cacheConnectedLinkedWalletConnector(authConnector: AuthConnectorType, walletConnector: IConnector<unknown>): Promise<void> {
    try {
      const connectedWalletAddress = await this.getConnectedWalletAddress(walletConnector);
      if (!connectedWalletAddress) {
        return;
      }

      const linkedAccounts = (await authConnector.getLinkedAccounts()) ?? [];
      const linkedAccount = this.findLinkedAccountByWalletAddress(linkedAccounts, connectedWalletAddress);
      if (linkedAccount && !linkedAccount.isPrimary) {
        const connectedWalletState = await this.resolveConnectedWalletConnectorState({
          connector: walletConnector,
          ethereumProvider: walletConnector.provider,
          solanaWallet: walletConnector.solanaWallet,
          usePrimaryProxy: false,
          account: linkedAccount,
        });
        this.setConnectedWalletConnectorState(connectedWalletState, linkedAccount);
      }
    } catch (error) {
      log.debug("Failed to cache connected linked wallet connector", error);
    }
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
    await this.setState({ currentChainId: chainId });
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

  private async bindPrimaryEthereumSigningProxy(ethereumProvider: IProvider, connectorName: WALLET_CONNECTOR_TYPE | string): Promise<void> {
    if (!this.commonJRPCProvider) throw WalletInitializationError.notFound(`CommonJrpcProvider not found`);
    let finalProvider = (ethereumProvider as IBaseProvider<unknown>)?.provider || (ethereumProvider as SafeEventEmitterProvider);
    const { accountAbstractionConfig } = this.coreOptions;
    const is7702 = accountAbstractionConfig?.smartAccountEipStandard === SMART_ACCOUNT_EIP_STANDARD["EIP_7702"];
    const isAaSupportedForCurrentChain =
      this.currentChain?.chainNamespace === CHAIN_NAMESPACES.EIP155 &&
      accountAbstractionConfig?.chains?.some((chain) => chain.chainId === this.currentChain?.chainId);

    // setup AA provider if AA is enabled (skip for EIP-7702; 7702 uses EOA + 5792/7702 RPC only)
    if (!is7702 && isAaSupportedForCurrentChain && (connectorName === WALLET_CONNECTORS.AUTH || this.coreOptions.useAAWithExternalWallet)) {
      const { accountAbstractionProvider, toEoaProvider } = await import("./providers/account-abstraction-provider");
      const eoaProvider: IProvider = connectorName === WALLET_CONNECTORS.AUTH ? await toEoaProvider(ethereumProvider) : ethereumProvider;
      const aaChainIds = new Set(accountAbstractionConfig?.chains?.map((chain) => chain.chainId) || []);
      const aaProvider = await accountAbstractionProvider({
        accountAbstractionConfig,
        provider: eoaProvider,
        chain: this.currentChain,
        chains: this.coreOptions.chains.filter((chain) => aaChainIds.has(chain.chainId)),
        useProviderAsTransport: connectorName === WALLET_CONNECTORS.AUTH,
      });
      this.aaProvider = aaProvider;

      if (connectorName !== WALLET_CONNECTORS.AUTH && this.coreOptions.useAAWithExternalWallet) {
        finalProvider = this.aaProvider;
      }
    }
    this.commonJRPCProvider.updateProviderEngineProxy(finalProvider);
  }

  private getChainConfigForIsolatedConnector(chainId: string): CustomChainConfig {
    const chainConfig = this.coreOptions.chains.find((chain) => chain.chainId === chainId);
    if (!chainConfig) {
      throw WalletInitializationError.invalidParams(`Chain config is not available for chain ${chainId}`);
    }
    return chainConfig;
  }

  private async resolveInstalledDiscoveredWalletConnector(params: {
    connectorName: string;
    chainConfig: CustomChainConfig;
    config: ConnectorParams;
    isMipdEnabled: boolean;
  }): Promise<IConnector<unknown> | null> {
    const { connectorName, chainConfig, config, isMipdEnabled } = params;

    if (!isBrowser() || !isMipdEnabled) return null;

    if (chainConfig.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      const { createMipd, injectedEvmConnector } = await import("./connectors/injected-evm-connector");
      const providerDetail = createMipd()
        .getProviders()
        .find((detail) => normalizeWalletName(detail.info.name) === connectorName);

      if (providerDetail) {
        return injectedEvmConnector(providerDetail)(config);
      }
      return null;
    }

    if (chainConfig.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      const { createSolanaMipd, hasSolanaWalletStandardFeatures, walletStandardConnector } = await import("./connectors/injected-solana-connector");
      const wallet = createSolanaMipd()
        .get()
        .find((candidate) => hasSolanaWalletStandardFeatures(candidate) && normalizeWalletName(candidate.name) === connectorName);

      if (wallet) {
        return walletStandardConnector(wallet)(config);
      }
    }

    return null;
  }

  private async resolveDiscoveredWalletConnector(
    connectorName: string,
    chainId: string,
    config: ConnectorParams,
    effectiveProjectConfig?: ProjectConfig
  ): Promise<IConnector<unknown>> {
    const chainConfig = this.getChainConfigForIsolatedConnector(chainId);
    const isExternalWalletEnabled = Boolean(effectiveProjectConfig?.externalWalletAuth);
    const isMipdEnabled = isExternalWalletEnabled && (this.coreOptions.multiInjectedProviderDiscovery ?? true);
    const installedConnector = await this.resolveInstalledDiscoveredWalletConnector({
      connectorName,
      chainConfig,
      config,
      isMipdEnabled,
    });

    if (installedConnector) {
      return installedConnector;
    }

    const isBuiltInConnectorName = (Object.values(WALLET_CONNECTORS) as string[]).includes(connectorName);
    const supportsWalletConnectFallback =
      chainConfig.chainNamespace === CHAIN_NAMESPACES.EIP155 || chainConfig.chainNamespace === CHAIN_NAMESPACES.SOLANA;

    // Named discovered wallets (for example Phantom) can reuse WalletConnect as a transport fallback
    // when an injected connector for the target chain namespace is unavailable.
    if (!isBuiltInConnectorName && isExternalWalletEnabled && supportsWalletConnectFallback) {
      const { walletConnectV2Connector } = await import("./connectors/wallet-connect-v2-connector");
      return walletConnectV2Connector()(config);
    }

    throw AccountLinkingError.unsupportedConnector(
      `Connector "${connectorName}" does not support automatic wallet linking. ` +
        `Use ${WALLET_CONNECTORS.METAMASK}, ${WALLET_CONNECTORS.WALLET_CONNECT_V2}, or an installed compatible wallet.`
    );
  }

  /**
   * Create a new connector instance that is NOT registered in this.connectors and NOT
   * subscribed to the main SDK event loop. Its lifecycle events are therefore isolated
   * and will not mutate any global SDK state (connectedConnectorName, connection, idToken).
   */
  private async createIsolatedWalletConnector(
    connectorName: WALLET_CONNECTOR_TYPE | string,
    chainId: string,
    projectConfig?: ProjectConfig
  ): Promise<IConnector<unknown>> {
    const effectiveProjectConfig = projectConfig ?? this.projectConfig ?? undefined;
    const config: ConnectorParams = {
      projectConfig: effectiveProjectConfig,
      coreOptions: this.coreOptions,
      analytics: this.analytics,
    };

    let connector: IConnector<unknown>;

    switch (connectorName) {
      case WALLET_CONNECTORS.METAMASK:
        connector = metaMaskConnector()(config);
        break;
      case WALLET_CONNECTORS.WALLET_CONNECT_V2: {
        const { walletConnectV2Connector } = await import("./connectors/wallet-connect-v2-connector");
        connector = walletConnectV2Connector()(config);
        break;
      }
      case WALLET_CONNECTORS.AUTH:
        throw AccountLinkingError.unsupportedConnector(`Connector "${connectorName}" does not support automatic wallet linking.`);
      default: {
        connector = await this.resolveDiscoveredWalletConnector(connectorName, chainId, config, effectiveProjectConfig);
        break;
      }
    }

    // Init the isolated connector WITHOUT subscribing to the main event loop.
    // This is the key difference from setupConnector(), which calls subscribeToConnectorEvents().
    // autoConnect: false ensures the connector does not attempt to rehydrate a previous session.
    await connector.init({ chainId, autoConnect: false });
    return connector;
  }

  private async setState(newState: Partial<IWeb3AuthState>): Promise<void> {
    this.state = { ...this.state, ...newState };
    await this.storage.set(WEB3AUTH_STATE_STORAGE_KEY, JSON.stringify(this.state));
  }

  private async loadState(initialState?: Partial<IWeb3AuthState>): Promise<void> {
    if (initialState) {
      this.state = { ...this.state, ...initialState };
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
