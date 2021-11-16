import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { BASE_WALLET_EVENTS, IWalletAdapter, SafeEventEmitterProvider, Wallet } from "@web3auth/base";

export class Web3Auth extends SafeEventEmitter {
  public connectedAdapter: IWalletAdapter | undefined;

  public connected: boolean;

  public connecting: boolean;

  public provider: SafeEventEmitterProvider;

  private walletAdapters: Record<string, IWalletAdapter>;

  constructor() {
    super();
    this.connectedAdapter.on(BASE_WALLET_EVENTS.CONNECTED, (data) => {
      this.connected = true;
      this.connecting = false;
      this.emit(BASE_WALLET_EVENTS.CONNECTED, data);
    });
    this.connectedAdapter.on(BASE_WALLET_EVENTS.DISCONNECTED, (data) => {
      this.connected = false;
      this.emit(BASE_WALLET_EVENTS.DISCONNECTED, data);
    });
  }

  public async addWallet(wallet: Wallet): Promise<void> {
    this.walletAdapters[wallet.name] = await wallet.adapter();
  }

  /**
   * Connect to a specific wallet adapter
   * @param walletName - Key of the walletAdapter to use.
   */
  async connectTo(walletName: string): Promise<void> {
    if (!this.walletAdapters[walletName]) throw new Error(`Please add wallet adapter for ${walletName} wallet, before connecting`);
    this.connecting = true;
    await this.walletAdapters[walletName].connect();
  }

  async logout(): Promise<void> {
    if (!this.connected) throw new Error(`No wallet is connected`);
    await this.connectedAdapter.disconnect();
  }

  async getUserInfo(): Promise<void> {
    if (!this.connected) throw new Error(`No wallet is connected`);
    await this.connectedAdapter.getUserInfo();
  }
}
