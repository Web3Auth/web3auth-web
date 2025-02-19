import { SafeEventEmitter, type SafeEventEmitterProvider } from "@web3auth/auth";

import type { AccountAbstractionProvider } from "@/core/account-abstraction-provider";
import { authConnector } from "@/core/auth-adapter";
import {
  CHAIN_NAMESPACES,
  CONNECTED_EVENT_DATA,
  CONNECTOR_EVENTS,
  CONNECTOR_STATUS,
  CONNECTOR_STATUS_TYPE,
  ConnectorFn,
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
  PLUGIN_STATUS,
  PROJECT_CONFIG_RESPONSE,
  storageAvailable,
  UserAuthInfo,
  UserInfo,
  WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
  Web3AuthNoModalEvents,
} from "@/core/base";

import { walletConnectV2Connector } from "./adapters";
import { CommonJRPCProvider } from "./providers";

const CONNECTOR_CACHE_KEY = "Web3Auth-cachedConnector";

const CURRENT_CHAIN_CACHE_KEY = "Web3Auth-currentChain";

export class Web3AuthNoModal extends SafeEventEmitter<Web3AuthNoModalEvents> implements IWeb3Auth {
  readonly coreOptions: IWeb3AuthCoreOptions;

  public connectedConnectorName: WALLET_CONNECTOR_TYPE | null = null;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  public cachedConnector: string | null = null;

  public cachedCurrentChainId: string | null = null;

  public currentChain: CustomChainConfig;

  protected connectors: Record<string, IConnector<unknown>> = {};

  protected commonJRPCProvider: CommonJRPCProvider | null = null;

  protected multiInjectedProviderDiscovery: boolean = true;

  private plugins: Record<string, IPlugin> = {};

  private storage: "sessionStorage" | "localStorage" = "localStorage";

  constructor(options: IWeb3AuthCoreOptions) {
    super();
    if (!options.clientId) throw WalletInitializationError.invalidParams("Please provide a valid clientId in constructor");
    if (options.enableLogging) log.enableAll();
    else log.setLevel("error");
    if (!options.chains || options.chains.length === 0) {
      throw WalletInitializationError.invalidParams("Please provide chains");
    }

    const { chains } = options;
    // validate chain namespace of each chain config
    for (const chain of chains) {
      if (!chain.chainNamespace || !Object.values(CHAIN_NAMESPACES).includes(chain.chainNamespace))
        throw WalletInitializationError.invalidParams("Please provide a valid chainNamespace in chains");
    }

    if (options.storageKey === "session") this.storage = "sessionStorage";
    this.cachedConnector = storageAvailable(this.storage) ? window[this.storage].getItem(CONNECTOR_CACHE_KEY) : null;

    this.coreOptions = {
      ...options,
      chains: chains.map((chain) => ({
        ...(getChainConfig(chain?.chainNamespace, chain?.chainId) || {}),
        ...chain,
      })),
    };
    this.multiInjectedProviderDiscovery = options.multiInjectedProviderDiscovery ?? true;

    // handle cached current chain
    this.cachedCurrentChainId = storageAvailable(this.storage) ? window[this.storage].getItem(CURRENT_CHAIN_CACHE_KEY) : null;
    // use corrected chains from coreOptions
    const cachedChain = this.cachedCurrentChainId ? this.coreOptions.chains.find((chain) => chain.chainId === this.cachedCurrentChainId) : null;
    this.currentChain = cachedChain || this.coreOptions.chains[0]; // use first chain in list as default chain config

    // TODO: do we need this ?
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
    this.commonJRPCProvider = await CommonJRPCProvider.getProviderInstance({ chainConfig: this.currentChain });

    let projectConfig: PROJECT_CONFIG_RESPONSE;
    try {
      projectConfig = await fetchProjectConfig(
        this.coreOptions.clientId,
        this.coreOptions.web3AuthNetwork,
        (this.coreOptions.accountAbstractionProvider as AccountAbstractionProvider)?.config.smartAccountInit.name
      );
    } catch (e) {
      log.error("Failed to fetch project configurations", e);
      throw WalletInitializationError.notReady("failed to fetch project configurations", e);
    }

    const connectorFns = await this.loadDefaultConnectors({ projectConfig });
    await Promise.all(
      connectorFns.map(async (connectorFn) => {
        const connector = connectorFn({ projectConfig, coreOptions: this.coreOptions });
        if (this.connectors[connector.name]) return;
        this.connectors[connector.name] = connector;
        this.subscribeToConnectorEvents(connector);
        return connector
          .init({ autoConnect: this.cachedConnector === connector.name, chainId: this.currentChain.chainId })
          .catch((e) => log.error(e, connector.name));
      })
    );
    if (this.status === CONNECTOR_STATUS.NOT_READY) {
      this.status = CONNECTOR_STATUS.READY;
      this.emit(CONNECTOR_EVENTS.READY);
    }
  }

  public getConnector(connectorName: WALLET_CONNECTOR_TYPE): IConnector<unknown> | null {
    return this.connectors[connectorName] || null;
  }

  public clearCache() {
    if (!storageAvailable(this.storage)) return;
    window[this.storage].removeItem(CONNECTOR_CACHE_KEY);
    this.cachedConnector = null;
  }

  public async switchChain(params: { chainId: string }): Promise<void> {
    if (this.status === CONNECTOR_STATUS.CONNECTED && this.connectedConnectorName) {
      await this.connectors[this.connectedConnectorName].switchChain(params);
      this.setCurrentChain(params.chainId);
      return;
    }
    if (this.commonJRPCProvider) {
      await this.commonJRPCProvider.switchChain(params);
      this.setCurrentChain(params.chainId);
      return;
    }
    throw WalletInitializationError.notReady(`No wallet is ready`);
  }

  /**
   * Connect to a specific wallet connector
   * @param connectorName - Key of the wallet connector to use.
   */
  async connectTo<T>(connectorName: WALLET_CONNECTOR_TYPE, loginParams?: T): Promise<IProvider | null> {
    if (!this.connectors[connectorName] || !this.commonJRPCProvider)
      throw WalletInitializationError.notFound(`Please add wallet connector for ${connectorName} wallet, before connecting`);
    return new Promise((resolve, reject) => {
      this.once(CONNECTOR_EVENTS.CONNECTED, (_) => {
        resolve(this.provider);
      });
      this.once(CONNECTOR_EVENTS.ERRORED, (err) => {
        reject(err);
      });
      const finalLoginParams = { ...loginParams, chainId: this.currentChain.chainId };
      this.connectors[connectorName]?.connect(finalLoginParams);
    });
  }

  async logout(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED || !this.connectedConnectorName)
      throw WalletLoginError.notConnectedError(`No wallet is connected`);
    await this.connectors[this.connectedConnectorName]?.disconnect(options);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    log.debug("Getting user info", this.status, this.connectedConnectorName);
    if (this.status !== CONNECTOR_STATUS.CONNECTED || !this.connectedConnectorName)
      throw WalletLoginError.notConnectedError(`No wallet is connected`);
    return this.connectors[this.connectedConnectorName]?.getUserInfo();
  }

  async enableMFA<T>(loginParams?: T): Promise<void> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED || !this.connectedConnectorName)
      throw WalletLoginError.notConnectedError(`No wallet is connected`);
    if (this.connectedConnectorName !== WALLET_CONNECTORS.AUTH)
      throw WalletLoginError.unsupportedOperation(`EnableMFA is not supported for this connector.`);
    return this.connectors[this.connectedConnectorName]?.enableMFA(loginParams);
  }

  async manageMFA<T>(loginParams?: T): Promise<void> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED || !this.connectedConnectorName)
      throw WalletLoginError.notConnectedError(`No wallet is connected`);
    if (this.connectedConnectorName !== WALLET_CONNECTORS.AUTH)
      throw WalletLoginError.unsupportedOperation(`ManageMFA is not supported for this connector.`);
    return this.connectors[this.connectedConnectorName]?.manageMFA(loginParams);
  }

  async authenticateUser(): Promise<UserAuthInfo> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED || !this.connectedConnectorName)
      throw WalletLoginError.notConnectedError(`No wallet is connected`);
    return this.connectors[this.connectedConnectorName]?.authenticateUser();
  }

  public addPlugin(plugin: IPlugin): IWeb3Auth {
    if (this.plugins[plugin.name]) throw WalletInitializationError.duplicateConnectorError(`Plugin ${plugin.name} already exist`);
    if (plugin.pluginNamespace !== PLUGIN_NAMESPACES.MULTICHAIN && plugin.pluginNamespace !== this.currentChain.chainNamespace)
      throw WalletInitializationError.incompatibleChainNameSpace(
        `This plugin belongs to ${plugin.pluginNamespace} namespace which is incompatible with currently used namespace: ${this.currentChain.chainNamespace}`
      );

    this.plugins[plugin.name] = plugin;
    if (this.status === CONNECTOR_STATUS.CONNECTED && this.connectedConnectorName) {
      // web3auth is already connected. can initialize plugins
      this.connectToPlugins({ connector: this.connectedConnectorName });
    }
    return this;
  }

  public getCurrentChain(): CustomChainConfig {
    return this.currentChain;
  }

  public getPlugin(name: string): IPlugin | null {
    return this.plugins[name] || null;
  }

  protected async loadDefaultConnectors({ projectConfig }: { projectConfig: PROJECT_CONFIG_RESPONSE }): Promise<ConnectorFn[]> {
    const connectorFns = this.coreOptions.connectors || [];

    // always add auth connector
    connectorFns.push(authConnector());

    // add injected wallets if multi injected provider discovery is enabled
    if (this.multiInjectedProviderDiscovery) {
      const chainNamespaces = new Set(this.coreOptions.chains.map((chain) => chain.chainNamespace));
      if (chainNamespaces.has(CHAIN_NAMESPACES.SOLANA)) {
        const { getSolanaInjectedConnectors } = await import("@/core/default-solana-adapter");
        connectorFns.push(...getSolanaInjectedConnectors());
      }
      if (chainNamespaces.has(CHAIN_NAMESPACES.EIP155)) {
        const { getEvmInjectedConnectors } = await import("@/core/default-evm-adapter");
        connectorFns.push(...getEvmInjectedConnectors());
      }

      // add wallet connect v2 connector if enabled
      const { wallet_connect_enabled: walletConnectEnabled } = projectConfig;
      if (walletConnectEnabled && (chainNamespaces.has(CHAIN_NAMESPACES.SOLANA) || chainNamespaces.has(CHAIN_NAMESPACES.EIP155))) {
        connectorFns.push(walletConnectV2Connector());
      }
    }
    return connectorFns;
  }

  protected subscribeToConnectorEvents(connector: IConnector<unknown>): void {
    connector.on(CONNECTOR_EVENTS.CONNECTED, async (data: CONNECTED_EVENT_DATA) => {
      if (!this.commonJRPCProvider) throw WalletInitializationError.notFound(`CommonJrpcProvider not found`);
      const { provider } = data;

      let finalProvider = (provider as IBaseProvider<unknown>).provider || (provider as SafeEventEmitterProvider);
      // setup aa provider after connector is connected and private key provider is setup
      if (
        this.coreOptions.accountAbstractionProvider &&
        (data.connector === WALLET_CONNECTORS.AUTH || (data.connector !== WALLET_CONNECTORS.AUTH && this.coreOptions.useAAWithExternalWallet))
      ) {
        await this.coreOptions.accountAbstractionProvider.setupProvider(provider); // Don't change this to finalProvider
        finalProvider = this.coreOptions.accountAbstractionProvider;
      }

      this.commonJRPCProvider.updateProviderEngineProxy(finalProvider);
      this.connectedConnectorName = data.connector;
      this.status = CONNECTOR_STATUS.CONNECTED;
      this.cacheWallet(data.connector);
      log.debug("connected", this.status, this.connectedConnectorName);
      this.connectToPlugins(data);
      this.emit(CONNECTOR_EVENTS.CONNECTED, { ...data });
    });

    connector.on(CONNECTOR_EVENTS.DISCONNECTED, async () => {
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
      this.emit(CONNECTOR_EVENTS.DISCONNECTED);
    });
    connector.on(CONNECTOR_EVENTS.CONNECTING, (data) => {
      this.status = CONNECTOR_STATUS.CONNECTING;
      this.emit(CONNECTOR_EVENTS.CONNECTING, data);
      log.debug("connecting", this.status, this.connectedConnectorName);
    });
    connector.on(CONNECTOR_EVENTS.ERRORED, (data) => {
      this.status = CONNECTOR_STATUS.ERRORED;
      this.clearCache();
      this.emit(CONNECTOR_EVENTS.ERRORED, data);
      log.debug("errored", this.status, this.connectedConnectorName);
    });

    connector.on(CONNECTOR_EVENTS.CONNECTOR_DATA_UPDATED, (data) => {
      log.debug("connector data updated", data);
      this.emit(CONNECTOR_EVENTS.CONNECTOR_DATA_UPDATED, data);
    });

    connector.on(CONNECTOR_EVENTS.CACHE_CLEAR, (data) => {
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

  private setCurrentChain(chainId: string) {
    if (chainId === this.currentChain.chainId) return;
    const newChain = this.coreOptions.chains.find((chain) => chain.chainId === chainId);
    if (!newChain) throw WalletInitializationError.invalidParams("Invalid chainId");
    this.currentChain = newChain;
    this.cacheCurrentChain(chainId);
  }

  private cacheCurrentChain(chainId: string) {
    if (!storageAvailable(this.storage)) return;
    window[this.storage].setItem(CURRENT_CHAIN_CACHE_KEY, chainId);
    this.cachedCurrentChainId = chainId;
  }

  private connectToPlugins(data: { connector: WALLET_CONNECTOR_TYPE }) {
    Object.values(this.plugins).map(async (plugin) => {
      try {
        if (!plugin.SUPPORTED_CONNECTORS.includes("all") && !plugin.SUPPORTED_CONNECTORS.includes(data.connector)) {
          return;
        }
        if (plugin.status === PLUGIN_STATUS.CONNECTED) return;
        await plugin.initWithWeb3Auth(this, this.coreOptions.uiConfig);
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
}
