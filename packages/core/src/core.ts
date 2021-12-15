import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import {
  ADAPTER_NAMESPACES,
  BASE_WALLET_EVENTS,
  ChainNamespaceType,
  CommonLoginOptions,
  DuplicateWalletAdapterError,
  IncompatibleChainNamespaceError,
  IWalletAdapter,
  SafeEventEmitterProvider,
  Wallet,
  WALLET_ADAPTERS,
  WalletNotConnectedError,
  WalletNotFoundError,
} from "@web3auth/base";

import { WALLET_ADAPTER_TYPE } from "./constants";
export class Web3Auth extends SafeEventEmitter {
  readonly chainNamespace: ChainNamespaceType;

  public connectedAdapter: IWalletAdapter | undefined;

  public connected: boolean;

  public connecting: boolean;

  public provider: SafeEventEmitterProvider;

  public cachedWallet: string;

  protected initialized: boolean;

  protected walletAdapters: Record<string, IWalletAdapter> = {};

  constructor(chainNamespace: ChainNamespaceType) {
    super();
    this.cachedWallet = window.localStorage.getItem("Web3Auth-CachedWallet");
    this.chainNamespace = chainNamespace;
  }

  public async init(): Promise<void> {
    if (this.initialized) throw new Error("Already initialized");

    await Promise.all(
      Object.keys(this.walletAdapters).map((adapterName) => {
        this.subscribeToAdapterEvents(this.walletAdapters[adapterName]);
        this.walletAdapters[adapterName].init({ connect: this.cachedWallet === adapterName });
        return true;
      })
    );

    this.initialized = true;
  }

  public configureWallet(wallet: Wallet): Web3Auth {
    if (this.initialized) throw new Error("Wallets cannot be added after initialization");
    if (this.walletAdapters[WALLET_ADAPTERS.OPENLOGIN_WALLET] && wallet.name === WALLET_ADAPTERS.CUSTOM_AUTH) {
      throw new Error(
        `Either ${WALLET_ADAPTERS.OPENLOGIN_WALLET} or ${WALLET_ADAPTERS.CUSTOM_AUTH} can be used, ${WALLET_ADAPTERS.OPENLOGIN_WALLET} adapter already exists.`
      );
    }
    if (this.walletAdapters[WALLET_ADAPTERS.CUSTOM_AUTH] && wallet.name === WALLET_ADAPTERS.OPENLOGIN_WALLET) {
      throw new Error(
        `Either ${WALLET_ADAPTERS.OPENLOGIN_WALLET} or ${WALLET_ADAPTERS.CUSTOM_AUTH} can be used, ${WALLET_ADAPTERS.CUSTOM_AUTH} adapter already exists.`
      );
    }
    const adapterAlreadyExists = this.walletAdapters[wallet.name];
    if (adapterAlreadyExists) throw new DuplicateWalletAdapterError(`Wallet adapter for ${wallet.name} already exists`);
    const adapter = wallet.adapter();
    if (adapter.namespace !== ADAPTER_NAMESPACES.MULTICHAIN && adapter.namespace !== this.chainNamespace)
      throw new IncompatibleChainNamespaceError(
        `This wallet adapter belongs to ${adapter.namespace} which is incompatible with currently used namespace: ${this.chainNamespace}`
      );
    if (adapter.namespace === ADAPTER_NAMESPACES.MULTICHAIN && this.chainNamespace !== adapter.currentChainNamespace)
      throw new IncompatibleChainNamespaceError(
        `${wallet.name} wallet adapter belongs to ${adapter.currentChainNamespace} which is incompatible with currently used namespace: ${this.chainNamespace}`
      );
    this.walletAdapters[wallet.name] = adapter;
    // if (adapter.walletType === ADAPTER_CATEGORY.IN_APP) {
    //   this.inAppLoginAdapter = wallet.name;
    // }
    return this;
  }

  public clearCache() {
    window.sessionStorage.removeItem("Web3Auth-CachedWallet");
    this.cachedWallet = undefined;
  }

  /**
   * Connect to a specific wallet adapter
   * @param walletName - Key of the walletAdapter to use.
   */
  async connectTo(walletName: WALLET_ADAPTER_TYPE, loginParams?: CommonLoginOptions): Promise<void> {
    if (!this.walletAdapters[walletName]) throw new WalletNotFoundError(`Please add wallet adapter for ${walletName} wallet, before connecting`);
    await this.walletAdapters[walletName].connect(loginParams);
  }

  async logout(): Promise<void> {
    if (!this.connected) throw new WalletNotConnectedError(`No wallet is connected`);
    await this.connectedAdapter.disconnect();
    this.connectedAdapter.removeAllListeners();
  }

  async getUserInfo(): Promise<void> {
    if (!this.connected) throw new WalletNotConnectedError(`No wallet is connected`);
    await this.connectedAdapter.getUserInfo();
  }

  protected subscribeToAdapterEvents(walletAdapter: IWalletAdapter): void {
    walletAdapter.on(BASE_WALLET_EVENTS.CONNECTED, (connectedAdapter: WALLET_ADAPTER_TYPE) => {
      // eslint-disable-next-line no-console
      console.log("Connected to", connectedAdapter, this.walletAdapters);
      this.connected = true;
      this.connecting = false;
      this.connectedAdapter = this.walletAdapters[connectedAdapter];
      this.provider = this.connectedAdapter.provider;
      this.cacheWallet(connectedAdapter);
      this.emit(BASE_WALLET_EVENTS.CONNECTED, connectedAdapter);
    });
    walletAdapter.on(BASE_WALLET_EVENTS.DISCONNECTED, (data) => {
      this.connected = false;
      this.connecting = false;
      this.provider = undefined;
      this.clearCache();
      this.emit(BASE_WALLET_EVENTS.DISCONNECTED, data);
    });
    walletAdapter.on(BASE_WALLET_EVENTS.CONNECTING, (data) => {
      this.connecting = true;
      this.provider = undefined;
      this.emit(BASE_WALLET_EVENTS.CONNECTING, data);
    });
    walletAdapter.on(BASE_WALLET_EVENTS.ERRORED, (data) => {
      this.connecting = false;
      this.provider = undefined;
      this.emit(BASE_WALLET_EVENTS.ERRORED, data);
    });
  }

  private cacheWallet(walletName: string) {
    window.sessionStorage.setItem("Web3Auth-CachedWallet", walletName);
    this.cachedWallet = walletName;
  }
}
