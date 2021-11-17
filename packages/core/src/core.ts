import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { ADAPTER_NAMESPACES, BASE_WALLET_EVENTS, ChainNamespaceType, IWalletAdapter, SafeEventEmitterProvider, Wallet } from "@web3auth/base";
export class Web3Auth extends SafeEventEmitter {
  readonly chainNamespace: ChainNamespaceType;

  public connectedAdapter: IWalletAdapter | undefined;

  public connected: boolean;

  public connecting: boolean;

  public provider: SafeEventEmitterProvider;

  public cachedWallet: string;

  private walletAdapters: Record<string, IWalletAdapter> = {};

  constructor(chainNamespace: ChainNamespaceType) {
    super();
    this.cachedWallet = window.localStorage.getItem("Web3Auth-CachedWallet");
    this.chainNamespace = chainNamespace;
  }

  public async init(): Promise<void> {
    const preAddedAdapters = Object.keys(this.walletAdapters);
    // TODO: add default adapters logic here
    if (preAddedAdapters.length > 0) {
      await Promise.all(preAddedAdapters.map((walletName) => this.walletAdapters[walletName].init()));
    }
  }

  public addWallet(wallet: Wallet): void {
    const adapterAlreadyExists = this.walletAdapters[wallet.name];
    if (adapterAlreadyExists) throw new Error(`Wallet adapter for ${wallet.name} already exists`);
    const adapter = wallet.adapter();
    if (adapter.namespace !== ADAPTER_NAMESPACES.MULTICHAIN && adapter.namespace !== this.chainNamespace)
      throw new Error(
        `This wallet adapter belongs to ${adapter.namespace} which is incompatible with currently used namespace: ${this.chainNamespace}`
      );
    if (adapter.namespace === ADAPTER_NAMESPACES.MULTICHAIN && this.chainNamespace !== adapter.currentChainNamespace)
      throw new Error(
        `${wallet.name} wallet adapter belongs to ${adapter.currentChainNamespace} which is incompatible with currently used namespace: ${this.chainNamespace}`
      );
    this.walletAdapters[wallet.name] = wallet.adapter();
  }

  public clearCache() {
    window.localStorage.removeItem("Web3Auth-CachedWallet");
    this.cachedWallet = undefined;
  }

  /**
   * Connect to a specific wallet adapter
   * @param walletName - Key of the walletAdapter to use.
   */
  async connectTo(walletName: string): Promise<void> {
    if (!this.walletAdapters[walletName]) throw new Error(`Please add wallet adapter for ${walletName} wallet, before connecting`);
    this.subscribeToEvents(this.walletAdapters[walletName]);
    await this.walletAdapters[walletName].connect();
    this.cacheWallet(walletName);
  }

  async logout(): Promise<void> {
    if (!this.connected) throw new Error(`No wallet is connected`);
    await this.connectedAdapter.disconnect();
  }

  async getUserInfo(): Promise<void> {
    if (!this.connected) throw new Error(`No wallet is connected`);
    await this.connectedAdapter.getUserInfo();
  }

  private subscribeToEvents(walletAdapter: IWalletAdapter): void {
    walletAdapter.on(BASE_WALLET_EVENTS.CONNECTED, (data) => {
      this.connected = true;
      this.connecting = false;
      this.emit(BASE_WALLET_EVENTS.CONNECTED, data);
    });
    walletAdapter.on(BASE_WALLET_EVENTS.DISCONNECTED, (data) => {
      this.connected = false;
      this.connecting = false;
      this.clearCache();
      this.emit(BASE_WALLET_EVENTS.DISCONNECTED, data);
    });
    walletAdapter.on(BASE_WALLET_EVENTS.CONNECTING, (data) => {
      this.connecting = true;
      this.emit(BASE_WALLET_EVENTS.CONNECTING, data);
    });
    walletAdapter.on(BASE_WALLET_EVENTS.ERRORED, (data) => {
      this.connecting = false;
      this.emit(BASE_WALLET_EVENTS.ERRORED, data);
    });
  }

  private cacheWallet(walletName: string) {
    window.localStorage.setItem("Web3Auth-CachedWallet", walletName);
    this.cachedWallet = walletName;
  }
}
