import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  AdapterNamespaceType,
  BASE_WALLET_EVENTS,
  BaseWalletAdapter,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletConnectionError,
  WalletNotConnectedError,
  WalletNotFoundError,
  WalletNotInstalledError,
  WalletNotReadyError,
} from "@web3auth/base";

class MetamaskAdapter extends BaseWalletAdapter {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly walletType: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public connecting: boolean;

  public adapterData?: Record<string, string> = {};

  public ready: boolean;

  public connected: boolean;

  public provider: SafeEventEmitterProvider | any;

  async init(options: { connect: boolean }): Promise<void> {
    if (this.ready) return;
    const wallet = typeof window !== "undefined" && (window as any).ethereum;
    if (!wallet) throw new WalletNotFoundError();
    if (!wallet.isMetaMask) throw new WalletNotInstalledError();
    this.ready = true;
    this.emit(BASE_WALLET_EVENTS.READY, WALLET_ADAPTERS.METAMASK_WALLET);
    try {
      if (options.connect) {
        await this.connect();
      }
    } catch (error) {
      this.emit(BASE_WALLET_EVENTS.ERRORED, error);
    }
  }

  async connect(): Promise<SafeEventEmitterProvider> {
    return new Promise((resolve, reject) => {
      if (!this.ready) throw new WalletNotReadyError("Metamask extention is not installed");
      this.connecting = true;
      this.emit(BASE_WALLET_EVENTS.CONNECTING);
      try {
        this.provider = typeof window !== "undefined" && (window as any).ethereum;
        const onConnectHandler = () => {
          this.connected = true;
          this.provider.removeListener("connect", onConnectHandler);
          this.addEventListeners(this.provider);
          this.emit(BASE_WALLET_EVENTS.CONNECTED, WALLET_ADAPTERS.METAMASK_WALLET);
          resolve(this.provider);
        };
        this.provider.on("connect", onConnectHandler);
        this.provider
          .request({ method: "eth_requestAccounts" })
          .then(() => {
            if (this.provider.isConnected()) {
              onConnectHandler();
            }
            return true;
          })
          .catch((err) => {
            reject(err);
          });
      } catch (error) {
        this.emit(BASE_WALLET_EVENTS.ERRORED, error);
        throw new WalletConnectionError("Failed to login with metamask wallet", error);
      } finally {
        this.connecting = false;
      }
    });
  }

  async disconnect(): Promise<void> {
    if (!this.connected) throw new WalletNotConnectedError("Not connected with wallet");
    this.provider?.removeAllListeners();
    this.connected = false;
    this.emit(BASE_WALLET_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw new WalletNotConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  private addEventListeners(provider: SafeEventEmitterProvider): void {
    provider.on("disconnect", () => {
      this.connected = false;
      this.emit(BASE_WALLET_EVENTS.DISCONNECTED);
    });
    provider.on("connect", () => {
      // emit only if not already connected
      if (this.connected) return;
      this.connected = true;
      this.emit(BASE_WALLET_EVENTS.CONNECTED, WALLET_ADAPTERS.METAMASK_WALLET);
    });
  }
}

export { MetamaskAdapter };
