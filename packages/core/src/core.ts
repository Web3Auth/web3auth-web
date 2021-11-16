import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { BASE_WALLET_EVENTS, IWalletAdapter, SafeEventEmitterProvider, Wallet } from "@web3auth/base";

export class Web3Auth extends SafeEventEmitter {
  public connectedAdapter: IWalletAdapter | undefined;

  public connected: boolean;

  public connecting: boolean;

  public provider: SafeEventEmitterProvider;

  public cachedWallet: string;

  private walletAdapters: Record<string, IWalletAdapter> = {};

  constructor() {
    super();
    this.cachedWallet = window.localStorage.getItem("Web3Auth-CachedWallet");
  }

  public addWallet(wallet: Wallet): void {
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
    await this.walletAdapters[walletName].init();
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
