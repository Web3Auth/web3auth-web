import detectEthereumProvider from "@metamask/detect-provider";
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

interface EthereumProvider extends SafeEventEmitterProvider {
  isMetaMask?: boolean;
  isConnected: () => boolean;
}

class MetamaskAdapter extends BaseAdapter<void> {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public connecting = false;

  public ready = false;

  public connected = false;

  // added after connecting
  public provider!: SafeEventEmitterProvider | undefined;

  private metamaskProvider!: EthereumProvider;

  async init(options: AdapterInitOptions): Promise<void> {
    if (this.ready) return;
    this.metamaskProvider = (await detectEthereumProvider({ mustBeMetaMask: true })) as EthereumProvider;
    if (!this.metamaskProvider) throw WalletInitializationError.notInstalled("Metamask extension is not installed");
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

  setAdapterSettings(_: unknown): void {}

  setChainConfig(_: CustomChainConfig): void {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ready) throw WalletInitializationError.notReady("Metamask extention is not installed");
      this.connecting = true;
      this.emit(BASE_ADAPTER_EVENTS.CONNECTING, { adapter: WALLET_ADAPTERS.METAMASK });
      try {
        if (!this.metamaskProvider) throw WalletLoginError.notConnectedError("Not able to connect with metamask");
        const onConnectHandler = () => {
          this.connected = true;
          this.provider = this.metamaskProvider;
          this.provider.removeListener("connect", onConnectHandler);
          this.addEventListeners(this.provider);
          this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.METAMASK);
          resolve();
        };
        this.metamaskProvider.on("connect", onConnectHandler);
        // trigger metamask to open
        (this.metamaskProvider as any)
          .request({ method: "eth_requestAccounts" })
          .then(() => {
            if (this.metamaskProvider.isConnected()) {
              onConnectHandler();
            }
            return true;
          })
          .catch((err: Error) => {
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
