import { SafeEventEmitter, type SafeEventEmitterProvider } from "@web3auth/auth";

import type { AccountAbstractionProvider } from "@/core/account-abstraction-provider";
import { type AuthAdapter, authAdapter } from "@/core/auth-adapter";
import {
  ADAPTER_EVENTS,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  AdapterFn,
  CHAIN_NAMESPACES,
  CONNECTED_EVENT_DATA,
  CustomChainConfig,
  fetchProjectConfig,
  getChainConfig,
  IAdapter,
  IBaseProvider,
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
  WALLET_ADAPTER_TYPE,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
  Web3AuthNoModalEvents,
} from "@/core/base";

import { CommonJRPCProvider } from "./providers";

const ADAPTER_CACHE_KEY = "Web3Auth-cachedAdapter";
export class Web3AuthNoModal extends SafeEventEmitter<Web3AuthNoModalEvents> implements IWeb3Auth {
  readonly coreOptions: IWeb3AuthCoreOptions;

  public connectedAdapterName: WALLET_ADAPTER_TYPE | null = null;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public cachedAdapter: string | null = null;

  protected walletAdapters: Record<string, IAdapter<unknown>> = {};

  protected commonJRPCProvider: CommonJRPCProvider | null = null;

  protected multiInjectedProviderDiscovery: boolean = true;

  private plugins: Record<string, IPlugin> = {};

  private storage: "sessionStorage" | "localStorage" = "localStorage";

  constructor(options: IWeb3AuthCoreOptions) {
    super();
    if (!options.clientId) throw WalletInitializationError.invalidParams("Please provide a valid clientId in constructor");
    if (options.enableLogging) log.enableAll();
    else log.setLevel("error");
    if (!options.chainConfig) {
      throw WalletInitializationError.invalidParams("Please provide chainConfig");
    }
    if (!options.chainConfig?.chainNamespace || !Object.values(CHAIN_NAMESPACES).includes(options.chainConfig?.chainNamespace))
      throw WalletInitializationError.invalidParams("Please provide a valid chainNamespace in chainConfig");
    if (options.storageKey === "session") this.storage = "sessionStorage";
    this.cachedAdapter = storageAvailable(this.storage) ? window[this.storage].getItem(ADAPTER_CACHE_KEY) : null;

    this.coreOptions = {
      ...options,
      chainConfig: {
        ...(getChainConfig(options.chainConfig?.chainNamespace, options.chainConfig?.chainId) || {}),
        ...options.chainConfig,
      },
    };
    this.multiInjectedProviderDiscovery = options.multiInjectedProviderDiscovery ?? true;
    this.subscribeToAdapterEvents = this.subscribeToAdapterEvents.bind(this);
  }

  get connected(): boolean {
    return Boolean(this.connectedAdapterName);
  }

  get provider(): IProvider | null {
    if (this.status !== ADAPTER_STATUS.NOT_READY && this.commonJRPCProvider) {
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
      projectConfig = await fetchProjectConfig(
        this.coreOptions.clientId,
        this.coreOptions.web3AuthNetwork,
        (this.coreOptions.accountAbstractionProvider as AccountAbstractionProvider)?.config.smartAccountInit.name
      );
    } catch (e) {
      log.error("Failed to fetch project configurations", e);
      throw WalletInitializationError.notReady("failed to fetch project configurations", e);
    }

    const adapterFns = await this.loadDefaultAdapters(projectConfig);
    const config = { projectConfig, options: this.coreOptions };
    const adapterPromises = adapterFns.map(async (adapterFn) => {
      const adapter = adapterFn(config);
      if (this.walletAdapters[adapter.name]) return;
      this.walletAdapters[adapter.name] = adapter;
      this.subscribeToAdapterEvents(adapter);
      return adapter.init({ autoConnect: this.cachedAdapter === adapter.name }).catch((e) => log.error(e, adapter.name));
    });
    await Promise.all(adapterPromises);
    if (this.status === ADAPTER_STATUS.NOT_READY) {
      this.status = ADAPTER_STATUS.READY;
      this.emit(ADAPTER_EVENTS.READY);
    }
  }

  public getAdapter(adapterName: WALLET_ADAPTER_TYPE): IAdapter<unknown> | null {
    return this.walletAdapters[adapterName] || null;
  }

  public clearCache() {
    if (!storageAvailable(this.storage)) return;
    window[this.storage].removeItem(ADAPTER_CACHE_KEY);
    this.cachedAdapter = null;
  }

  public async switchChain(params: { chainId: string }): Promise<void> {
    if (this.status === ADAPTER_STATUS.CONNECTED && this.connectedAdapterName)
      return this.walletAdapters[this.connectedAdapterName]?.switchChain(params);
    if (this.commonJRPCProvider) return this.commonJRPCProvider.switchChain(params);
    throw WalletInitializationError.notReady(`No wallet is ready`);
  }

  /**
   * Connect to a specific wallet adapter
   * @param walletName - Key of the walletAdapter to use.
   */
  async connectTo<T>(walletName: WALLET_ADAPTER_TYPE, loginParams?: T): Promise<IProvider | null> {
    if (!this.walletAdapters[walletName] || !this.commonJRPCProvider)
      throw WalletInitializationError.notFound(`Please add wallet adapter for ${walletName} wallet, before connecting`);
    return new Promise((resolve, reject) => {
      this.once(ADAPTER_EVENTS.CONNECTED, (_) => {
        resolve(this.provider);
      });
      this.once(ADAPTER_EVENTS.ERRORED, (err) => {
        reject(err);
      });
      this.walletAdapters[walletName]?.connect(loginParams);
    });
  }

  async logout(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    if (this.status !== ADAPTER_STATUS.CONNECTED || !this.connectedAdapterName) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    await this.walletAdapters[this.connectedAdapterName]?.disconnect(options);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    log.debug("Getting user info", this.status, this.connectedAdapterName);
    if (this.status !== ADAPTER_STATUS.CONNECTED || !this.connectedAdapterName) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    return this.walletAdapters[this.connectedAdapterName]?.getUserInfo();
  }

  async enableMFA<T>(loginParams?: T): Promise<void> {
    if (this.status !== ADAPTER_STATUS.CONNECTED || !this.connectedAdapterName) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    if (this.connectedAdapterName !== WALLET_ADAPTERS.AUTH)
      throw WalletLoginError.unsupportedOperation(`EnableMFA is not supported for this adapter.`);
    return this.walletAdapters[this.connectedAdapterName]?.enableMFA(loginParams);
  }

  async manageMFA<T>(loginParams?: T): Promise<void> {
    if (this.status !== ADAPTER_STATUS.CONNECTED || !this.connectedAdapterName) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    if (this.connectedAdapterName !== WALLET_ADAPTERS.AUTH)
      throw WalletLoginError.unsupportedOperation(`ManageMFA is not supported for this adapter.`);
    return this.walletAdapters[this.connectedAdapterName]?.manageMFA(loginParams);
  }

  async authenticateUser(): Promise<UserAuthInfo> {
    if (this.status !== ADAPTER_STATUS.CONNECTED || !this.connectedAdapterName) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    return this.walletAdapters[this.connectedAdapterName]?.authenticateUser();
  }

  public addPlugin(plugin: IPlugin): IWeb3Auth {
    if (this.plugins[plugin.name]) throw WalletInitializationError.duplicateAdapterError(`Plugin ${plugin.name} already exist`);
    if (plugin.pluginNamespace !== PLUGIN_NAMESPACES.MULTICHAIN && plugin.pluginNamespace !== this.coreOptions.chainConfig.chainNamespace)
      throw WalletInitializationError.incompatibleChainNameSpace(
        `This plugin belongs to ${plugin.pluginNamespace} namespace which is incompatible with currently used namespace: ${this.coreOptions.chainConfig.chainNamespace}`
      );

    this.plugins[plugin.name] = plugin;
    if (this.status === ADAPTER_STATUS.CONNECTED && this.connectedAdapterName) {
      // web3auth is already connected. can initialize plugins
      this.connectToPlugins({ adapter: this.connectedAdapterName });
    }
    return this;
  }

  public getPlugin(name: string): IPlugin | null {
    return this.plugins[name] || null;
  }

  protected async loadDefaultAdapters(projectConfig: PROJECT_CONFIG_RESPONSE): Promise<AdapterFn[]> {
    const config = { projectConfig, options: this.coreOptions };
    const adapterFns = this.coreOptions.walletAdapters || [];

    // always add auth adapter
    adapterFns.push(authAdapter());

    // add injected wallets if multi injected provider discovery is enabled
    if (this.multiInjectedProviderDiscovery) {
      if (this.coreOptions.chainConfig.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
        const { getSolanaInjectedAdapters } = await import("@/core/default-solana-adapter");
        adapterFns.push(...getSolanaInjectedAdapters(config));
      } else if (this.coreOptions.chainConfig.chainNamespace === CHAIN_NAMESPACES.EIP155) {
        const { getEvmInjectedAdapters } = await import("@/core/default-evm-adapter");
        adapterFns.push(...getEvmInjectedAdapters(config));
      }
    }
    return adapterFns;
  }

  protected subscribeToAdapterEvents(walletAdapter: IAdapter<unknown>): void {
    walletAdapter.on(ADAPTER_EVENTS.CONNECTED, async (data: CONNECTED_EVENT_DATA) => {
      if (!this.commonJRPCProvider) throw WalletInitializationError.notFound(`CommonJrpcProvider not found`);
      const { provider } = data;

      let finalProvider = (provider as IBaseProvider<unknown>).provider || (provider as SafeEventEmitterProvider);
      // setup aa provider after adapter is connected and private key provider is setup
      if (
        this.coreOptions.accountAbstractionProvider &&
        (data.adapter === WALLET_ADAPTERS.AUTH || (data.adapter !== WALLET_ADAPTERS.AUTH && this.coreOptions.useAAWithExternalWallet))
      ) {
        await this.coreOptions.accountAbstractionProvider.setupProvider(provider); // Don't change this to finalProvider
        finalProvider = this.coreOptions.accountAbstractionProvider;
      }

      this.commonJRPCProvider.updateProviderEngineProxy(finalProvider);
      this.connectedAdapterName = data.adapter;
      this.status = ADAPTER_STATUS.CONNECTED;
      this.cacheWallet(data.adapter);
      log.debug("connected", this.status, this.connectedAdapterName);
      this.connectToPlugins(data);
      this.emit(ADAPTER_EVENTS.CONNECTED, { ...data });
    });

    walletAdapter.on(ADAPTER_EVENTS.DISCONNECTED, async () => {
      // get back to ready state for rehydrating.
      this.status = ADAPTER_STATUS.READY;
      if (storageAvailable(this.storage)) {
        const cachedAdapter = window[this.storage].getItem(ADAPTER_CACHE_KEY);
        if (this.connectedAdapterName === cachedAdapter) {
          this.clearCache();
        }
      }

      log.debug("disconnected", this.status, this.connectedAdapterName);
      await Promise.all(
        Object.values(this.plugins).map((plugin) => {
          return plugin.disconnect().catch((error: Web3AuthError) => {
            // swallow error if adapter doesn't supports this plugin.
            if (error.code === 5211) {
              return;
            }
            // throw error;
            log.error(error);
          });
        })
      );
      this.connectedAdapterName = null;
      this.emit(ADAPTER_EVENTS.DISCONNECTED);
    });
    walletAdapter.on(ADAPTER_EVENTS.CONNECTING, (data) => {
      this.status = ADAPTER_STATUS.CONNECTING;
      this.emit(ADAPTER_EVENTS.CONNECTING, data);
      log.debug("connecting", this.status, this.connectedAdapterName);
    });
    walletAdapter.on(ADAPTER_EVENTS.ERRORED, (data) => {
      this.status = ADAPTER_STATUS.ERRORED;
      this.clearCache();
      this.emit(ADAPTER_EVENTS.ERRORED, data);
      log.debug("errored", this.status, this.connectedAdapterName);
    });

    walletAdapter.on(ADAPTER_EVENTS.ADAPTER_DATA_UPDATED, (data) => {
      log.debug("adapter data updated", data);
      this.emit(ADAPTER_EVENTS.ADAPTER_DATA_UPDATED, data);
    });

    walletAdapter.on(ADAPTER_EVENTS.CACHE_CLEAR, (data) => {
      log.debug("adapter cache clear", data);
      if (storageAvailable(this.storage)) {
        this.clearCache();
      }
    });
  }

  protected checkInitRequirements(): void {
    if (this.status === ADAPTER_STATUS.CONNECTING) throw WalletInitializationError.notReady("Already pending connection");
    if (this.status === ADAPTER_STATUS.CONNECTED) throw WalletInitializationError.notReady("Already connected");
    if (this.status === ADAPTER_STATUS.READY) throw WalletInitializationError.notReady("Adapter is already initialized");
  }

  private cacheWallet(walletName: string) {
    if (!storageAvailable(this.storage)) return;
    window[this.storage].setItem(ADAPTER_CACHE_KEY, walletName);
    this.cachedAdapter = walletName;
  }

  private connectToPlugins(data: { adapter: WALLET_ADAPTER_TYPE }) {
    Object.values(this.plugins).map(async (plugin) => {
      try {
        if (!plugin.SUPPORTED_ADAPTERS.includes("all") && !plugin.SUPPORTED_ADAPTERS.includes(data.adapter)) {
          return;
        }
        if (plugin.status === PLUGIN_STATUS.CONNECTED) return;
        const { authInstance } = this.walletAdapters[this.connectedAdapterName] as AuthAdapter;
        const { options, sessionId, sessionNamespace } = authInstance || {};
        await plugin.initWithWeb3Auth(this, options?.whiteLabel);
        await plugin.connect({ sessionId, sessionNamespace });
      } catch (error: unknown) {
        // swallow error if connector adapter doesn't supports this plugin.
        if ((error as Web3AuthError).code === 5211) {
          return;
        }
        log.error(error);
      }
    });
  }
}
