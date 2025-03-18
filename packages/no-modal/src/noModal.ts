import { SafeEventEmitter, type SafeEventEmitterProvider } from "@web3auth/auth";

import { authConnector } from "@/core/auth-connector";
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
import { CommonJRPCProvider } from "@/core/base-provider";

const CONNECTOR_CACHE_KEY = "Web3Auth-cachedConnector";

const CURRENT_CHAIN_CACHE_KEY = "Web3Auth-currentChain";

export class Web3AuthNoModal extends SafeEventEmitter<Web3AuthNoModalEvents> implements IWeb3Auth {
  readonly coreOptions: IWeb3AuthCoreOptions;

  public connectedConnectorName: WALLET_CONNECTOR_TYPE | null = null;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  public cachedConnector: string | null = null;

  protected currentChainId: string;

  protected connectors: IConnector<unknown>[] = [];

  protected commonJRPCProvider: CommonJRPCProvider | null = null;

  private plugins: Record<string, IPlugin> = {};

  private storage: "sessionStorage" | "localStorage" = "localStorage";

  constructor(options: IWeb3AuthCoreOptions) {
    super();
    if (!options.clientId) throw WalletInitializationError.invalidParams("Please provide a valid clientId in constructor");
    if (options.enableLogging) log.enableAll();
    else log.setLevel("error");
    // TODO: This is fine. we get chains from project config. we can throw in init instead
    if (!options.chains || options.chains.length === 0) {
      throw WalletInitializationError.invalidParams("Please provide chains");
    }

    const { chains } = options;
    // validate chain namespace of each chain config
    for (const chain of chains) {
      if (!chain.chainNamespace || !Object.values(CHAIN_NAMESPACES).includes(chain.chainNamespace))
        throw WalletInitializationError.invalidParams("Please provide a valid chainNamespace in chains");
    }

    if (options.storageType === "session") this.storage = "sessionStorage";

    this.coreOptions = {
      ...options,
      chains: chains.map((chain) => ({
        ...(getChainConfig(chain?.chainNamespace, chain?.chainId, options.clientId) || {}),
        ...chain,
      })),
    };

    this.currentChainId = options.defaultChainId || chains[0].chainId;
  }

  get currentChain(): CustomChainConfig {
    return this.coreOptions.chains.find((chain) => chain.chainId === this.currentChainId);
  }

  get connected(): boolean {
    return Boolean(this.connectedConnector);
  }

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY && this.commonJRPCProvider) {
      return this.commonJRPCProvider;
    }
    return null;
  }

  get connectedConnector(): IConnector<unknown> | null {
    return this.connectors.find((connector) => connector.name === this.connectedConnectorName) || null;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  public async init(): Promise<void> {
    this.initCachedConnectorAndChainId();

    // get project config
    let projectConfig: PROJECT_CONFIG_RESPONSE;
    try {
      projectConfig = await fetchProjectConfig(
        this.coreOptions.clientId,
        this.coreOptions.web3AuthNetwork,
        this.coreOptions.accountAbstractionConfig?.smartAccountType
      );
    } catch (e) {
      log.error("Failed to fetch project configurations", e);
      throw WalletInitializationError.notReady("failed to fetch project configurations", e);
    }

    // setup common JRPC provider
    await this.setupCommonJRPCProvider();

    // initialize connectors
    this.on(CONNECTOR_EVENTS.CONNECTORS_UPDATED, async ({ connectors: newConnectors }) => {
      await Promise.all(newConnectors.map(this.setupConnector));

      // emit connector ready event
      if (this.status === CONNECTOR_STATUS.NOT_READY) {
        this.status = CONNECTOR_STATUS.READY;
        this.emit(CONNECTOR_EVENTS.READY);
      }
    });
    await this.loadConnectors({ projectConfig });
    await this.initPlugins();
  }

  public getConnector(connectorName: WALLET_CONNECTOR_TYPE): IConnector<unknown> | null {
    return this.connectors.find((connector) => connector.name === connectorName) || null;
  }

  public clearCache() {
    if (!storageAvailable(this.storage)) return;
    window[this.storage].removeItem(CONNECTOR_CACHE_KEY);
    window[this.storage].removeItem(CURRENT_CHAIN_CACHE_KEY);
    this.cachedConnector = null;
  }

  public async switchChain(params: { chainId: string }): Promise<void> {
    if (params.chainId === this.currentChain.chainId) return;
    const newChainConfig = this.coreOptions.chains.find((x) => x.chainId === params.chainId);
    if (!newChainConfig) throw WalletInitializationError.invalidParams("Invalid chainId");

    if (this.status === CONNECTOR_STATUS.CONNECTED && this.connectedConnector) {
      await this.connectedConnector.switchChain(params);
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
    if (!this.getConnector(connectorName) || !this.commonJRPCProvider)
      throw WalletInitializationError.notFound(`Please add wallet connector for ${connectorName} wallet, before connecting`);
    return new Promise((resolve, reject) => {
      this.once(CONNECTOR_EVENTS.CONNECTED, (_) => {
        resolve(this.provider);
      });
      this.once(CONNECTOR_EVENTS.ERRORED, (err) => {
        reject(err);
      });
      const connector = this.getConnector(connectorName);
      const initialChain = this.getInitialChainIdForConnector(connector);
      const finalLoginParams = { ...loginParams, chainId: initialChain.chainId };
      connector.connect(finalLoginParams);
      this.setCurrentChain(initialChain.chainId);
    });
  }

  async logout(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED || !this.connectedConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    await this.connectedConnector.disconnect(options);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    log.debug("Getting user info", this.status, this.connectedConnector?.name);
    if (this.status !== CONNECTOR_STATUS.CONNECTED || !this.connectedConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    return this.connectedConnector.getUserInfo();
  }

  async enableMFA<T>(loginParams?: T): Promise<void> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED || !this.connectedConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    if (this.connectedConnector.name !== WALLET_CONNECTORS.AUTH)
      throw WalletLoginError.unsupportedOperation(`EnableMFA is not supported for this connector.`);
    return this.connectedConnector.enableMFA(loginParams);
  }

  async manageMFA<T>(loginParams?: T): Promise<void> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED || !this.connectedConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    if (this.connectedConnector.name !== WALLET_CONNECTORS.AUTH)
      throw WalletLoginError.unsupportedOperation(`ManageMFA is not supported for this connector.`);
    return this.connectedConnector.manageMFA(loginParams);
  }

  async authenticateUser(): Promise<UserAuthInfo> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED || !this.connectedConnector) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    return this.connectedConnector.authenticateUser();
  }

  public getPlugin(name: string): IPlugin | null {
    return this.plugins[name] || null;
  }

  protected initCachedConnectorAndChainId() {
    this.cachedConnector = storageAvailable(this.storage) ? window[this.storage].getItem(CONNECTOR_CACHE_KEY) : null;
    // init chainId using cached chainId if it exists and is valid, otherwise use the defaultChainId or the first chain
    const cachedChainId = storageAvailable(this.storage) ? window[this.storage].getItem(CURRENT_CHAIN_CACHE_KEY) : null;
    const isCachedChainIdValid = cachedChainId && this.coreOptions.chains.some((chain) => chain.chainId === cachedChainId);
    this.currentChainId = isCachedChainIdValid ? cachedChainId : this.coreOptions.defaultChainId || this.coreOptions.chains[0].chainId;
  }

  protected async setupCommonJRPCProvider() {
    this.commonJRPCProvider = await CommonJRPCProvider.getProviderInstance({
      chain: this.currentChain,
      chains: this.coreOptions.chains,
    });

    // sync chainId
    this.commonJRPCProvider.on("chainChanged", (chainId) => this.setCurrentChain(chainId));
  }

  protected async setupConnector(connector: IConnector<unknown>): Promise<void> {
    this.subscribeToConnectorEvents(connector);
    try {
      const initialChain = this.getInitialChainIdForConnector(connector);
      await connector.init({ autoConnect: this.cachedConnector === connector.name, chainId: initialChain.chainId });
    } catch (e) {
      log.error(e, connector.name);
    }
  }

  protected async loadConnectors({ projectConfig }: { projectConfig: PROJECT_CONFIG_RESPONSE }) {
    // always add auth connector
    const connectorFns = [...(this.coreOptions.connectors || []), authConnector()];
    const config = {
      projectConfig,
      coreOptions: this.coreOptions,
    };

    // add injected connectors
    const isMipdEnabled = this.coreOptions.multiInjectedProviderDiscovery ?? true;
    const chainNamespaces = new Set(this.coreOptions.chains.map((chain) => chain.chainNamespace));
    if (isMipdEnabled) {
      // Solana chains
      if (chainNamespaces.has(CHAIN_NAMESPACES.SOLANA)) {
        const { createSolanaMipd, hasSolanaWalletStandardFeatures, walletStandardConnector } = await import("@/core/injected-solana-connector");
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
        const { createMipd, injectedEvmConnector } = await import("@/core/injected-evm-connector");
        const evmMipd = createMipd();
        // subscribe to new injected connectors
        evmMipd.subscribe((providerDetails) => {
          const newConnectors = providerDetails.map((providerDetail) => injectedEvmConnector(providerDetail)(config));
          this.setConnectors(newConnectors);
        });
        connectorFns.push(...evmMipd.getProviders().map(injectedEvmConnector));
      }
    }

    // add WalletConnectV2 connector if enabled
    if (
      projectConfig.wallet_connect_enabled &&
      projectConfig.wallet_connect_project_id &&
      (chainNamespaces.has(CHAIN_NAMESPACES.SOLANA) || chainNamespaces.has(CHAIN_NAMESPACES.EIP155))
    ) {
      const { walletConnectV2Connector } = await import("@/core/wallet-connect-v2-connector");
      connectorFns.push(walletConnectV2Connector());
    }

    const connectors = connectorFns.map((connectorFn) => connectorFn(config));
    this.setConnectors(connectors);
  }

  protected async initPlugins(): Promise<void> {
    const pluginFns = this.coreOptions.plugins || [];
    for (const pluginFn of pluginFns) {
      const plugin = pluginFn();
      if (!this.plugins[plugin.name]) this.plugins[plugin.name] = plugin;
    }
  }

  protected setConnectors(connectors: IConnector<unknown>[]): void {
    const connectorSet = new Set(this.connectors.map((connector) => connector.name));
    const newConnectors = connectors
      .map((connector) => {
        if (connectorSet.has(connector.name)) return null;
        connectorSet.add(connector.name);
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
      const { provider } = data;

      let finalProvider = (provider as IBaseProvider<unknown>).provider || (provider as SafeEventEmitterProvider);
      // setup aa provider for external wallets on EVM chains, for in app wallet, it uses WS provider which already supports AA
      const { accountAbstractionConfig } = this.coreOptions;
      if (
        this.currentChain.chainNamespace === CHAIN_NAMESPACES.EIP155 &&
        accountAbstractionConfig &&
        data.connector !== WALLET_CONNECTORS.AUTH &&
        this.coreOptions.useAAWithExternalWallet
      ) {
        const { accountAbstractionProvider } = await import("@/core/account-abstraction-provider");
        const aaProvider = await accountAbstractionProvider({
          accountAbstractionConfig,
          provider,
          chain: this.currentChain,
          chains: this.coreOptions.chains,
        });
        finalProvider = aaProvider;
        // TODO: when switching chains to Solana or other chains, we need to switch to the non-AA provider
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
        Object.values(this.plugins).map(async (plugin) => {
          if (!plugin.SUPPORTED_CONNECTORS.includes("all") && !plugin.SUPPORTED_CONNECTORS.includes(connector.name)) return;
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

  /**
   * Gets the initial chain configuration for a connector
   * @throws WalletInitializationError If no chain is found for the connector's namespace
   */
  protected getInitialChainIdForConnector(connector: IConnector<unknown>): CustomChainConfig {
    let initialChain = this.currentChain;
    if (initialChain.chainNamespace !== connector.connectorNamespace && connector.connectorNamespace !== CONNECTOR_NAMESPACES.MULTICHAIN) {
      initialChain = this.coreOptions.chains.find((x) => x.chainNamespace === connector.connectorNamespace);
      if (!initialChain) throw WalletInitializationError.invalidParams(`No chain found for ${connector.connectorNamespace}`);
    }
    return initialChain;
  }

  private cacheWallet(walletName: string) {
    if (!storageAvailable(this.storage)) return;
    // TODO: use the key from user + this
    window[this.storage].setItem(CONNECTOR_CACHE_KEY, walletName);
    this.cachedConnector = walletName;
  }

  private setCurrentChain(chainId: string) {
    if (chainId === this.currentChainId) return;
    const newChain = this.coreOptions.chains.find((chain) => chain.chainId === chainId);
    if (!newChain) throw WalletInitializationError.invalidParams(`Invalid chainId: ${chainId}`);
    this.currentChainId = chainId;
    this.cacheCurrentChain(chainId);
  }

  private cacheCurrentChain(chainId: string) {
    if (!storageAvailable(this.storage)) return;
    window[this.storage].setItem(CURRENT_CHAIN_CACHE_KEY, chainId);
  }

  private connectToPlugins(data: { connector: WALLET_CONNECTOR_TYPE }) {
    Object.values(this.plugins).map(async (plugin) => {
      try {
        // skip if it's not compatible with the connector
        if (!plugin.SUPPORTED_CONNECTORS.includes("all") && !plugin.SUPPORTED_CONNECTORS.includes(data.connector)) return;
        // skip if it's not compatible with the current chain
        if (plugin.pluginNamespace !== PLUGIN_NAMESPACES.MULTICHAIN && plugin.pluginNamespace !== this.currentChain.chainNamespace) return;
        // skip if it's already connected
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
