import { SafeEventEmitter, type SafeEventEmitterProvider } from "@web3auth/auth";

import { authConnector } from "@/core/auth-connector";
import {
  CHAIN_NAMESPACES,
  CONNECTED_EVENT_DATA,
  CONNECTOR_EVENTS,
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

// Utility to check if code is running in a browser environment
const isBrowser = (): boolean => {
  return typeof window !== "undefined" && typeof document !== "undefined";
};

// Cookie utilities
const getCookie = (name: string): string | null => {
  if (!isBrowser()) return null;
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
};

const setCookie = (name: string, value: string, days = 30): void => {
  if (!isBrowser()) return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Strict`;
};

const removeCookie = (name: string): void => {
  if (!isBrowser()) return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
};

// Safe storage access function
const getStorageItem = (storageType: "localStorage" | "sessionStorage" | "cookie", key: string): string | null => {
  if (storageType === "cookie") {
    return getCookie(key);
  }

  if (!isBrowser() || !storageAvailable(storageType)) return null;
  return window[storageType].getItem(key);
};

// Safe storage set function
const setStorageItem = (storageType: "localStorage" | "sessionStorage" | "cookie", key: string, value: string): void => {
  if (storageType === "cookie") {
    setCookie(key, value);
    return;
  }

  if (!isBrowser() || !storageAvailable(storageType)) return;
  window[storageType].setItem(key, value);
};

// Safe storage remove function
const removeStorageItem = (storageType: "localStorage" | "sessionStorage" | "cookie", key: string): void => {
  if (storageType === "cookie") {
    removeCookie(key);
    return;
  }

  if (!isBrowser() || !storageAvailable(storageType)) return;
  window[storageType].removeItem(key);
};

export class Web3AuthNoModal extends SafeEventEmitter<Web3AuthNoModalEvents> implements IWeb3Auth {
  readonly coreOptions: IWeb3AuthCoreOptions;

  public connectedConnectorName: WALLET_CONNECTOR_TYPE | null = null;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  public cachedConnector: string | null = null;

  public cachedCurrentChainId: string | null = null;

  public currentChain: CustomChainConfig;

  protected connectors: IConnector<unknown>[] = [];

  protected commonJRPCProvider: CommonJRPCProvider | null = null;

  private plugins: Record<string, IPlugin> = {};

  private storage: "sessionStorage" | "localStorage" | "cookie" = "localStorage";

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
    if (options.storageKey === "cookie") this.storage = "cookie";

    this.cachedConnector = getStorageItem(this.storage, CONNECTOR_CACHE_KEY);

    this.coreOptions = {
      ...options,
      chains: chains.map((chain) => ({
        ...(getChainConfig(chain?.chainNamespace, chain?.chainId) || {}),
        ...chain,
      })),
    };

    // handle cached current chain
    this.cachedCurrentChainId = getStorageItem(this.storage, CURRENT_CHAIN_CACHE_KEY);
    // use corrected chains from coreOptions
    const cachedChain = this.cachedCurrentChainId ? this.coreOptions.chains.find((chain) => chain.chainId === this.cachedCurrentChainId) : null;
    this.currentChain = cachedChain || this.coreOptions.chains[0]; // use first chain in list as default chain config
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
    // setup common JRPC provider
    this.commonJRPCProvider = await CommonJRPCProvider.getProviderInstance({
      chain: this.getCurrentChain(),
      chains: this.getChains(),
    });

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

    // initialize connectors
    this.on(CONNECTOR_EVENTS.CONNECTORS_UPDATED, async () => {
      await Promise.all(this.connectors.map(this.setupConnector));

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
    removeStorageItem(this.storage, CONNECTOR_CACHE_KEY);
    removeStorageItem(this.storage, CURRENT_CHAIN_CACHE_KEY);
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
      const finalLoginParams = { ...loginParams, chainId: this.currentChain.chainId };
      this.getConnector(connectorName)?.connect(finalLoginParams);
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

  public getCurrentChain(): CustomChainConfig {
    return this.currentChain;
  }

  public getChain(chainId: string): CustomChainConfig | undefined {
    return this.coreOptions.chains.find((chain) => chain.chainId === chainId);
  }

  public getChains(): CustomChainConfig[] {
    return this.coreOptions.chains;
  }

  public getPlugin(name: string): IPlugin | null {
    return this.plugins[name] || null;
  }

  protected async setupConnector(connector: IConnector<unknown>): Promise<void> {
    this.subscribeToConnectorEvents(connector);
    await connector
      .init({ autoConnect: this.cachedConnector === connector.name, chainId: this.currentChain.chainId })
      .catch((e) => log.error(e, connector.name));
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
    if (isMipdEnabled && isBrowser()) {
      const chainNamespaces = new Set(this.coreOptions.chains.map((chain) => chain.chainNamespace));
      // Solana chains
      if (chainNamespaces.has(CHAIN_NAMESPACES.SOLANA)) {
        const { createSolanaMipd, hasSolanaWalletStandardFeatures, walletStandardConnector } = await import("@/core/default-solana-connector");
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
        const { createMipd, injectedEvmConnector } = await import("@/core/default-evm-connector");
        const evmMipd = createMipd();
        // subscribe to new injected connectors
        evmMipd.subscribe((providerDetails) => {
          const newConnectors = providerDetails.map((providerDetail) => injectedEvmConnector(providerDetail)(config));
          this.setConnectors(newConnectors);
        });
        connectorFns.push(...evmMipd.getProviders().map(injectedEvmConnector));
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
    }

    const connectors = connectorFns.map((connectorFn) => connectorFn(config));
    this.setConnectors(connectors);
  }

  protected async initPlugins(): Promise<void> {
    const pluginFns = this.coreOptions.plugins || [];
    for (const pluginFn of pluginFns) {
      const plugin = pluginFn();
      if (this.plugins[plugin.name]) continue;
      // TODO: handle when switching chains to different namespace
      // don't initialize plugin if it's not compatible with the current chain
      if (plugin.pluginNamespace !== PLUGIN_NAMESPACES.MULTICHAIN && plugin.pluginNamespace !== this.currentChain.chainNamespace) continue;

      this.plugins[plugin.name] = plugin;
      if (this.status === CONNECTOR_STATUS.CONNECTED && this.connectedConnector) {
        // web3auth is already connected. can initialize plugins
        this.connectToPlugins({ connector: this.connectedConnector.name });
      }
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
    this.connectors = [...this.connectors, ...newConnectors];
    this.emit(CONNECTOR_EVENTS.CONNECTORS_UPDATED, { connectors: this.connectors });
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
          chain: this.getCurrentChain(),
          chains: this.getChains(),
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
      const cachedConnector = getStorageItem(this.storage, CONNECTOR_CACHE_KEY);
      if (this.connectedConnectorName === cachedConnector) {
        this.clearCache();
      }

      log.debug("disconnected", this.status, this.connectedConnectorName);
      await Promise.all(
        Object.values(this.plugins).map(async (plugin) => {
          if (!plugin.SUPPORTED_CONNECTORS.includes("all") && !plugin.SUPPORTED_CONNECTORS.includes(connector.name)) return;
          if (plugin.status === PLUGIN_STATUS.CONNECTED) return;
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
      this.clearCache();
    });
  }

  protected checkInitRequirements(): void {
    if (this.status === CONNECTOR_STATUS.CONNECTING) throw WalletInitializationError.notReady("Already pending connection");
    if (this.status === CONNECTOR_STATUS.CONNECTED) throw WalletInitializationError.notReady("Already connected");
    if (this.status === CONNECTOR_STATUS.READY) throw WalletInitializationError.notReady("Connector is already initialized");
  }

  private cacheWallet(walletName: string) {
    setStorageItem(this.storage, CONNECTOR_CACHE_KEY, walletName);
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
    setStorageItem(this.storage, CURRENT_CHAIN_CACHE_KEY, chainId);
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
