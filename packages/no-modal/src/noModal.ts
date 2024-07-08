import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import {
  CHAIN_NAMESPACES,
  CONNECTED_EVENT_DATA,
  CONNECTOR_EVENTS,
  CONNECTOR_NAMESPACES,
  CONNECTOR_STATUS,
  CONNECTOR_STATUS_TYPE,
  CustomChainConfig,
  fetchProjectConfig,
  getChainConfig,
  IBaseProvider,
  IConnector,
  IPlugin,
  IProvider,
  IWeb3Auth,
  IWeb3AuthCoreOptions,
  log,
  PLUGIN_NAMESPACES,
  PROJECT_CONFIG_RESPONSE,
  storageAvailable,
  UserAuthInfo,
  UserInfo,
  WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import { CommonJRPCProvider } from "@web3auth/base-provider";
import { LOGIN_PROVIDER, LoginConfig, SocialConnector } from "@web3auth/social-connector";
import { WalletConnectConnector } from "@web3auth/wallet-connect-connector";
import clonedeep from "lodash.clonedeep";
import merge from "lodash.merge";

const CONNECTOR_CACHE_KEY = "Web3Auth-cachedConnector";
export class Web3AuthNoModal extends SafeEventEmitter implements IWeb3Auth {
  readonly coreOptions: IWeb3AuthCoreOptions;

  public connectedConnectorName: WALLET_CONNECTOR_TYPE | null = null;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  public cachedConnector: string | null = null;

  public walletConnectors: Record<string, IConnector<unknown>> = {};

  protected commonJRPCProvider: CommonJRPCProvider | null = null;

  private plugins: Record<string, IPlugin> = {};

  private storage: "sessionStorage" | "localStorage" = "localStorage";

  constructor(options: IWeb3AuthCoreOptions) {
    super();
    if (!options.clientId) throw WalletInitializationError.invalidParams("Please provide a valid clientId in constructor");
    if (options.enableLogging) log.enableAll();
    else log.setLevel("error");
    if (!options.privateKeyProvider && !options.chainConfig) {
      throw WalletInitializationError.invalidParams("Please provide chainConfig or privateKeyProvider");
    }
    options.chainConfig = options.chainConfig || options.privateKeyProvider.currentChainConfig;
    if (!options.chainConfig?.chainNamespace || !Object.values(CHAIN_NAMESPACES).includes(options.chainConfig?.chainNamespace))
      throw WalletInitializationError.invalidParams("Please provide a valid chainNamespace in chainConfig");
    if (options.storageKey === "session") this.storage = "sessionStorage";
    this.cachedConnector = storageAvailable(this.storage) ? window[this.storage].getItem(CONNECTOR_CACHE_KEY) : null;

    this.coreOptions = {
      ...options,
      chainConfig: {
        ...(getChainConfig(options.chainConfig?.chainNamespace, options.chainConfig?.id) || {}),
        ...options.chainConfig,
      },
    };
    this.subscribeToConnectorEvents = this.subscribeToConnectorEvents.bind(this);
  }

  get connected(): boolean {
    return Boolean(this.connectedConnectorName);
  }

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY && this.commonJRPCProvider) {
      return this.commonJRPCProvider;
    }
    return null;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  public async init(): Promise<void> {
    this.commonJRPCProvider = await CommonJRPCProvider.getProviderInstance({ chainConfig: this.coreOptions.chainConfig as CustomChainConfig });

    let projectConfig: PROJECT_CONFIG_RESPONSE;
    try {
      projectConfig = await fetchProjectConfig(this.coreOptions.clientId, this.coreOptions.web3AuthNetwork);
    } catch (e) {
      log.error("Failed to fetch project configurations", e);
      throw WalletInitializationError.notReady("failed to fetch project configurations");
    }

    const initPromises = Object.keys(this.walletConnectors).map(async (connectorName: string) => {
      this.subscribeToConnectorEvents(this.walletConnectors[connectorName]);
      // if connector doesn't have any chain config yet then set it based on provided namespace and chainId.
      // if no chainNamespace or chainId is being provided, it will connect with mainnet.
      if (!this.walletConnectors[connectorName].chainConfigProxy) {
        const providedChainConfig = this.coreOptions.chainConfig;
        if (!providedChainConfig.chainNamespace) throw WalletInitializationError.invalidParams("Please provide chainNamespace in chainConfig");
        this.walletConnectors[connectorName].setConnectorSettings({
          chainConfig: providedChainConfig,
          sessionTime: this.coreOptions.sessionTime,
          clientId: this.coreOptions.clientId,
          web3AuthNetwork: this.coreOptions.web3AuthNetwork,
          useCoreKitKey: this.coreOptions.useCoreKitKey,
        });
      } else {
        this.walletConnectors[connectorName].setConnectorSettings({
          sessionTime: this.coreOptions.sessionTime,
          clientId: this.coreOptions.clientId,
          web3AuthNetwork: this.coreOptions.web3AuthNetwork,
          useCoreKitKey: this.coreOptions.useCoreKitKey,
        });
      }
      if (connectorName === WALLET_CONNECTORS.SOCIAL) {
        const socialConnector = this.walletConnectors[connectorName] as SocialConnector;

        const { whitelabel } = projectConfig;
        this.coreOptions.uiConfig = merge(clonedeep(whitelabel), this.coreOptions.uiConfig);
        if (!this.coreOptions.uiConfig.mode) this.coreOptions.uiConfig.mode = "light";

        const { sms_otp_enabled: smsOtpEnabled, whitelist } = projectConfig;
        if (smsOtpEnabled !== undefined) {
          socialConnector.setConnectorSettings({
            loginConfig: {
              [LOGIN_PROVIDER.SMS_PASSWORDLESS]: {
                showOnModal: smsOtpEnabled,
                showOnDesktop: smsOtpEnabled,
                showOnMobile: smsOtpEnabled,
                showOnSocialBackupFactor: smsOtpEnabled,
              } as LoginConfig[keyof LoginConfig],
            },
          });
        }
        if (whitelist) {
          socialConnector.setConnectorSettings({ originData: whitelist.signed_urls });
        }

        if (this.coreOptions.privateKeyProvider) {
          if (socialConnector.currentChainNamespace !== this.coreOptions.privateKeyProvider.currentChainConfig.chainNamespace) {
            throw WalletInitializationError.incompatibleChainNameSpace(
              "private key provider is not compatible with provided chainNamespace for social connector"
            );
          }
          socialConnector.setConnectorSettings({ privateKeyProvider: this.coreOptions.privateKeyProvider });
        }
        socialConnector.setConnectorSettings({ whiteLabel: this.coreOptions.uiConfig });
        if (!socialConnector.privateKeyProvider) {
          throw WalletInitializationError.invalidParams("privateKeyProvider is required for social connector");
        }
      } else if (connectorName === WALLET_CONNECTORS.WALLET_CONNECT_V2) {
        const walletConnectConnector = this.walletConnectors[connectorName] as WalletConnectConnector;
        const { wallet_connect_enabled: walletConnectEnabled, wallet_connect_project_id: walletConnectProjectId } = projectConfig;

        if (walletConnectEnabled === false) {
          throw WalletInitializationError.invalidParams("Please enable wallet connect v2 addon on dashboard");
        }
        if (!walletConnectProjectId)
          throw WalletInitializationError.invalidParams("Invalid wallet connect project id. Please configure it on the dashboard");

        walletConnectConnector.setConnectorSettings({
          connectorSettings: {
            walletConnectInitOptions: {
              projectId: walletConnectProjectId,
            },
          },
        });
      }

      return this.walletConnectors[connectorName].init({ autoConnect: this.cachedConnector === connectorName }).catch((e) => log.error(e));
    });
    await Promise.all(initPromises);
    if (this.status === CONNECTOR_STATUS.NOT_READY) {
      this.status = CONNECTOR_STATUS.READY;
      this.emit(CONNECTOR_EVENTS.READY);
    }
  }

  public getConnector(connectorName: WALLET_CONNECTOR_TYPE): IConnector<unknown> | null {
    return this.walletConnectors[connectorName] || null;
  }

  public configureConnector(connector: IConnector<unknown>): Web3AuthNoModal {
    this.checkInitRequirements();
    const providedChainConfig = this.coreOptions.chainConfig;

    if (!providedChainConfig.chainNamespace) throw WalletInitializationError.invalidParams("Please provide chainNamespace in chainConfig");

    const connectorAlreadyExists = this.walletConnectors[connector.name];
    if (connectorAlreadyExists) throw WalletInitializationError.duplicateConnectorError(`Wallet connector for ${connector.name} already exists`);
    if (connector.connectorNamespace !== CONNECTOR_NAMESPACES.MULTICHAIN && connector.connectorNamespace !== providedChainConfig.chainNamespace)
      throw WalletInitializationError.incompatibleChainNameSpace(
        `This wallet connector belongs to ${connector.connectorNamespace} which is incompatible with currently used namespace: ${providedChainConfig.chainNamespace}`
      );

    if (
      connector.connectorNamespace === CONNECTOR_NAMESPACES.MULTICHAIN &&
      connector.currentChainNamespace &&
      providedChainConfig.chainNamespace !== connector.currentChainNamespace
    ) {
      // chainConfig checks are already validated in constructor so using typecast is safe here.
      connector.setConnectorSettings({ chainConfig: providedChainConfig as CustomChainConfig });
    }

    this.walletConnectors[connector.name] = connector;
    return this;
  }

  public clearCache() {
    if (!storageAvailable(this.storage)) return;
    window[this.storage].removeItem(CONNECTOR_CACHE_KEY);
    this.cachedConnector = null;
  }

  public async addChain(chainConfig: CustomChainConfig): Promise<void> {
    if (this.status === CONNECTOR_STATUS.CONNECTED && this.connectedConnectorName)
      return this.walletConnectors[this.connectedConnectorName].addChain(chainConfig);
    if (this.commonJRPCProvider) {
      return this.commonJRPCProvider.addChain(chainConfig);
    }
    throw WalletInitializationError.notReady(`No wallet is ready`);
  }

  public async switchChain(params: { chainId: number }): Promise<void> {
    if (this.status === CONNECTOR_STATUS.CONNECTED && this.connectedConnectorName)
      return this.walletConnectors[this.connectedConnectorName].switchChain(params);
    if (this.commonJRPCProvider) {
      return this.commonJRPCProvider.switchChain(params);
    }
    throw WalletInitializationError.notReady(`No wallet is ready`);
  }

  /**
   * Connect to a specific wallet connector
   * @param walletName - Key of the walletConnector to use.
   */
  async connectTo<T>(walletName: WALLET_CONNECTOR_TYPE, loginParams?: T): Promise<IProvider | null> {
    if (!this.walletConnectors[walletName] || !this.commonJRPCProvider)
      throw WalletInitializationError.notFound(`Please add wallet connector for ${walletName} wallet, before connecting`);
    const provider = await this.walletConnectors[walletName].connect(loginParams);
    this.commonJRPCProvider.updateProviderEngineProxy((provider as IBaseProvider<unknown>).provider || provider);
    return this.provider;
  }

  async logout(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED || !this.connectedConnectorName)
      throw WalletLoginError.notConnectedError(`No wallet is connected`);
    await this.walletConnectors[this.connectedConnectorName].disconnect(options);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    log.debug("Getting user info", this.status, this.connectedConnectorName);
    if (this.status !== CONNECTOR_STATUS.CONNECTED || !this.connectedConnectorName)
      throw WalletLoginError.notConnectedError(`No wallet is connected`);
    return this.walletConnectors[this.connectedConnectorName].getUserInfo();
  }

  async enableMFA<T>(loginParams?: T): Promise<void> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED || !this.connectedConnectorName)
      throw WalletLoginError.notConnectedError(`No wallet is connected`);
    if (this.connectedConnectorName !== WALLET_CONNECTORS.SOCIAL)
      throw WalletLoginError.unsupportedOperation(`EnableMFA is not supported for this connector.`);
    return this.walletConnectors[this.connectedConnectorName].enableMFA(loginParams);
  }

  async authenticateUser(): Promise<UserAuthInfo> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED || !this.connectedConnectorName)
      throw WalletLoginError.notConnectedError(`No wallet is connected`);
    return this.walletConnectors[this.connectedConnectorName].authenticateUser();
  }

  public addPlugin(plugin: IPlugin): IWeb3Auth {
    if (this.plugins[plugin.name]) throw new Error(`Plugin ${plugin.name} already exist`);
    if (plugin.pluginNamespace !== PLUGIN_NAMESPACES.MULTICHAIN && plugin.pluginNamespace !== this.coreOptions.chainConfig.chainNamespace)
      throw new Error(
        `This plugin belongs to ${plugin.pluginNamespace} namespace which is incompatible with currently used namespace: ${this.coreOptions.chainConfig.chainNamespace}`
      );

    this.plugins[plugin.name] = plugin;
    return this;
  }

  public getPlugin(name: string): IPlugin | null {
    return this.plugins[name] || null;
  }

  protected subscribeToConnectorEvents(walletConnectors: IConnector<unknown>): void {
    walletConnectors.on(CONNECTOR_EVENTS.CONNECTED, async (data: CONNECTED_EVENT_DATA) => {
      if (!this.commonJRPCProvider) throw WalletInitializationError.notFound(`CommonJrpcProvider not found`);
      const { provider } = data;
      this.commonJRPCProvider.updateProviderEngineProxy((provider as IBaseProvider<unknown>).provider || provider);
      this.status = CONNECTOR_STATUS.CONNECTED;
      this.connectedConnectorName = data.connector;
      this.cacheWallet(data.connector);
      log.debug("connected", this.status, this.connectedConnectorName);
      Object.values(this.plugins).map(async (plugin) => {
        try {
          if (!plugin.SUPPORTED_CONNECTORS.includes(data.connector)) {
            return;
          }
          const { socialConnectorInstance } = this.walletConnectors[this.connectedConnectorName] as SocialConnector;
          const { options, sessionId, sessionNamespace } = socialConnectorInstance || {};
          await plugin.initWithWeb3Auth(this, options.whiteLabel);
          await plugin.connect({ sessionId, sessionNamespace });
        } catch (error: unknown) {
          // swallow error if connector connector doesn't supports this plugin.
          if ((error as Web3AuthError).code === 5211) {
            return;
          }
          log.error(error);
        }
      });

      this.emit(CONNECTOR_EVENTS.CONNECTED, { ...data } as CONNECTED_EVENT_DATA);
    });

    walletConnectors.on(CONNECTOR_EVENTS.DISCONNECTED, async (data) => {
      // get back to ready state for rehydrating.
      this.status = CONNECTOR_STATUS.READY;
      if (storageAvailable(this.storage)) {
        const cachedConnector = window[this.storage].getItem(CONNECTOR_CACHE_KEY);
        if (this.connectedConnectorName === cachedConnector) {
          this.clearCache();
        }
      }

      log.debug("disconnected", this.status, this.connectedConnectorName);
      await Promise.all(
        Object.values(this.plugins).map((plugin) => {
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
      this.connectedConnectorName = null;
      this.emit(CONNECTOR_EVENTS.DISCONNECTED, data);
    });
    walletConnectors.on(CONNECTOR_EVENTS.CONNECTING, (data) => {
      this.status = CONNECTOR_STATUS.CONNECTING;
      this.emit(CONNECTOR_EVENTS.CONNECTING, data);
      log.debug("connecting", this.status, this.connectedConnectorName);
    });
    walletConnectors.on(CONNECTOR_EVENTS.ERRORED, (data) => {
      this.status = CONNECTOR_STATUS.ERRORED;
      this.clearCache();
      this.emit(CONNECTOR_EVENTS.ERRORED, data);
      log.debug("errored", this.status, this.connectedConnectorName);
    });

    walletConnectors.on(CONNECTOR_EVENTS.CONNECTOR_DATA_UPDATED, (data) => {
      log.debug("connector data updated", data);
      this.emit(CONNECTOR_EVENTS.CONNECTOR_DATA_UPDATED, data);
    });

    walletConnectors.on(CONNECTOR_EVENTS.CACHE_CLEAR, (data) => {
      log.debug("connector cache clear", data);
      if (storageAvailable(this.storage)) {
        this.clearCache();
      }
    });
  }

  protected checkInitRequirements(): void {
    if (this.status === CONNECTOR_STATUS.CONNECTING) throw WalletInitializationError.notReady("Already pending connection");
    if (this.status === CONNECTOR_STATUS.CONNECTED) throw WalletInitializationError.notReady("Already connected");
    if (this.status === CONNECTOR_STATUS.READY) throw WalletInitializationError.notReady("Connector is already initialized");
  }

  private cacheWallet(walletName: string) {
    if (!storageAvailable(this.storage)) return;
    window[this.storage].setItem(CONNECTOR_CACHE_KEY, walletName);
    this.cachedConnector = walletName;
  }
}
