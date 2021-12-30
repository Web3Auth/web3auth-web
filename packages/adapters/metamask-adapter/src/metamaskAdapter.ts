import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  AdapterInitOptions,
  AdapterNamespaceType,
  BASE_ADAPTER_EVENTS,
  BaseAdapter,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CustomChainConfig,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import log from "loglevel";
class MetamaskAdapter extends BaseAdapter<void> {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public connecting: boolean;

  public ready: boolean;

  public connected: boolean;

  public provider: SafeEventEmitterProvider | any;

  async init(options: AdapterInitOptions): Promise<void> {
    if (this.ready) return;
    const wallet = typeof window !== "undefined" && (window as any).ethereum;
    if (!wallet) throw WalletInitializationError.notFound();
    if (!wallet.isMetaMask) throw WalletInitializationError.notInstalled();
    this.ready = true;
    this.emit(BASE_ADAPTER_EVENTS.READY, WALLET_ADAPTERS.METAMASK);
    try {
      if (options.autoConnect) {
        await this.connect();
      }
    } catch (error) {
      this.emit(BASE_ADAPTER_EVENTS.ERRORED, error);
    }
  }

  async connect(): Promise<SafeEventEmitterProvider> {
    return new Promise((resolve, reject) => {
      if (!this.ready) throw WalletInitializationError.notReady("Metamask extention is not installed");
      this.connecting = true;
      this.emit(BASE_ADAPTER_EVENTS.CONNECTING);
      try {
        this.provider = typeof window !== "undefined" && (window as any).ethereum;
        const onConnectHandler = () => {
          this.connected = true;
          this.provider.removeListener("connect", onConnectHandler);
          this.addEventListeners(this.provider);
          this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.METAMASK);
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
        this.emit(BASE_ADAPTER_EVENTS.ERRORED, error);
        throw WalletLoginError.connectionError("Failed to login with metamask wallet");
      } finally {
        this.connecting = false;
      }
    });
  }

  async disconnect(): Promise<void> {
    if (!this.connected) throw WalletLoginError.disconnectionError("Not connected with wallet");
    this.provider?.removeAllListeners();
    this.connected = false;
    this.emit(BASE_ADAPTER_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  updateChainConfig(customChainConfig: CustomChainConfig): void {
    log.debug("new chain config for metamask", customChainConfig);
  }

  private addEventListeners(provider: SafeEventEmitterProvider): void {
    provider.on("disconnect", () => {
      this.connected = false;
      this.emit(BASE_ADAPTER_EVENTS.DISCONNECTED);
    });
    provider.on("connect", () => {
      this.connected = true;
      this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.METAMASK);
    });
  }
}

export { MetamaskAdapter };
