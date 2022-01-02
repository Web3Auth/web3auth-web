import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import {
  Adapter,
  ADAPTER_NAMESPACES,
  BASE_ADAPTER_EVENTS,
  ChainNamespaceType,
  getChainConfig,
  IAdapter,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";

import { WALLET_ADAPTER_TYPE } from "./constants";

export interface Web3AuthCoreOptions {
  /**
   * The chain namespace to use. Currently only supports "EIP155" and "SOLANA".
   */
  chainNamespace: ChainNamespaceType;
  /**
   * Numeric chainId for the chainNamespace being used, by default it will be mainnet id for the provided namespace..
   * For ex: it will be ethereum mainnet `1` for "EIP155" and solana mainnet `1` for "SOLANA".
   *
   * @defaultValue mainnnet id of provided chainNamespace
   */
  chainId?: number;
}
export class Web3AuthCore extends SafeEventEmitter {
  readonly coreOptions: Web3AuthCoreOptions;

  public connectedAdapterName: string | undefined;

  public connected: boolean;

  public connecting: boolean;

  public provider: SafeEventEmitterProvider;

  public cachedAdapter: string;

  protected initialized: boolean;

  protected walletAdapters: Record<string, IAdapter<unknown>> = {};

  constructor(options: Web3AuthCoreOptions) {
    super();
    this.cachedAdapter = window.sessionStorage.getItem("Web3Auth-cachedAdapter");
    this.coreOptions = options;
    this.subscribeToAdapterEvents = this.subscribeToAdapterEvents.bind(this);
  }

  public async init(): Promise<void> {
    if (this.initialized) throw new Error("Already initialized");

    const initPromises = Object.keys(this.walletAdapters).map((adapterName) => {
      this.subscribeToAdapterEvents(this.walletAdapters[adapterName]);
      // if adapter doesn't have any chain config yet thn set it based on modal namespace and chainId.
      // this applies only to multichain adapters where chainNamespace cannot be determined from adapter.
      if (this.walletAdapters[adapterName].namespace === ADAPTER_NAMESPACES.MULTICHAIN && !this.walletAdapters[adapterName].currentChainNamespace) {
        const chainConfig = getChainConfig(this.coreOptions.chainNamespace, this.coreOptions.chainId);
        this.walletAdapters[adapterName].setChainConfig(chainConfig);
      }
      return this.walletAdapters[adapterName].init({ autoConnect: this.cachedAdapter === adapterName }).catch((e) => e);
    });
    await Promise.all(initPromises);

    this.initialized = true;
  }

  public configureAdapter(adapter: Adapter<unknown>): Web3AuthCore {
    if (this.initialized) throw new Error("Wallets cannot be added after initialization");
    if (this.walletAdapters[WALLET_ADAPTERS.OPENLOGIN] && adapter.name === WALLET_ADAPTERS.CUSTOM_AUTH) {
      throw new Error(
        `Either ${WALLET_ADAPTERS.OPENLOGIN} or ${WALLET_ADAPTERS.CUSTOM_AUTH} can be used, ${WALLET_ADAPTERS.OPENLOGIN} adapter already exists.`
      );
    }
    if (this.walletAdapters[WALLET_ADAPTERS.CUSTOM_AUTH] && adapter.name === WALLET_ADAPTERS.OPENLOGIN) {
      throw new Error(
        `Either ${WALLET_ADAPTERS.OPENLOGIN} or ${WALLET_ADAPTERS.CUSTOM_AUTH} can be used, ${WALLET_ADAPTERS.CUSTOM_AUTH} adapter already exists.`
      );
    }
    const adapterAlreadyExists = this.walletAdapters[adapter.name];
    if (adapterAlreadyExists) throw WalletInitializationError.duplicateAdapterError(`Wallet adapter for ${adapter.name} already exists`);
    const adapterInstance = adapter.adapter();
    if (adapterInstance.namespace !== ADAPTER_NAMESPACES.MULTICHAIN && adapterInstance.namespace !== this.coreOptions.chainNamespace)
      throw WalletInitializationError.incompatibleChainNameSpace(
        `This wallet adapter belongs to ${adapterInstance.namespace} which is incompatible with currently used namespace: ${this.coreOptions.chainNamespace}`
      );
    if (
      adapterInstance.namespace === ADAPTER_NAMESPACES.MULTICHAIN &&
      adapterInstance.currentChainNamespace &&
      this.coreOptions.chainNamespace !== adapterInstance.currentChainNamespace
    )
      throw WalletInitializationError.incompatibleChainNameSpace(
        `${adapter.name} wallet adapter belongs to ${adapterInstance.currentChainNamespace} which is incompatible with currently used namespace: ${this.coreOptions.chainNamespace}`
      );
    this.walletAdapters[adapter.name] = adapterInstance;
    return this;
  }

  public clearCache() {
    window.sessionStorage.removeItem("Web3Auth-cachedAdapter");
    this.cachedAdapter = undefined;
  }

  /**
   * Connect to a specific wallet adapter
   * @param walletName - Key of the walletAdapter to use.
   */
  async connectTo<T>(walletName: WALLET_ADAPTER_TYPE, loginParams?: T): Promise<void> {
    if (!this.walletAdapters[walletName])
      throw WalletInitializationError.notFound(`Please add wallet adapter for ${walletName} wallet, before connecting`);
    await this.walletAdapters[walletName].connect(loginParams);
  }

  async logout(): Promise<void> {
    if (!this.connected) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    await this.walletAdapters[this.connectedAdapterName].disconnect();
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw WalletLoginError.notConnectedError(`No wallet is connected`);
    return this.walletAdapters[this.connectedAdapterName].getUserInfo();
  }

  protected subscribeToAdapterEvents(walletAdapter: IAdapter<unknown>): void {
    walletAdapter.on(BASE_ADAPTER_EVENTS.CONNECTED, (connectedAdapterName: WALLET_ADAPTER_TYPE) => {
      this.connected = true;
      this.connecting = false;
      const connectedAd = this.walletAdapters[connectedAdapterName];
      this.provider = connectedAd.provider;
      this.connectedAdapterName = connectedAdapterName;

      this.cacheWallet(connectedAdapterName);
      this.emit(BASE_ADAPTER_EVENTS.CONNECTED, connectedAdapterName);
    });
    walletAdapter.on(BASE_ADAPTER_EVENTS.DISCONNECTED, (data) => {
      this.connected = false;
      this.connecting = false;
      this.provider = undefined;
      this.clearCache();
      this.emit(BASE_ADAPTER_EVENTS.DISCONNECTED, data);
    });
    walletAdapter.on(BASE_ADAPTER_EVENTS.CONNECTING, (data) => {
      this.connecting = true;
      this.provider = undefined;
      this.emit(BASE_ADAPTER_EVENTS.CONNECTING, data);
    });
    walletAdapter.on(BASE_ADAPTER_EVENTS.ERRORED, (data) => {
      this.connecting = false;
      this.provider = undefined;
      this.emit(BASE_ADAPTER_EVENTS.ERRORED, data);
    });
  }

  private cacheWallet(walletName: string) {
    window.sessionStorage.setItem("Web3Auth-cachedAdapter", walletName);
    this.cachedAdapter = walletName;
  }
}
