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
  getChainConfig,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";

interface EthereumProvider extends SafeEventEmitterProvider {
  isMetaMask?: boolean;
  isConnected: () => boolean;
  chainId: string;
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

  constructor(adapterOptions: { chainConfig?: CustomChainConfig }) {
    super();
    this.chainConfig = adapterOptions.chainConfig;
  }

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

  setChainConfig(customChainConfig: CustomChainConfig): void {
    if (this.ready) return;
    this.chainConfig = customChainConfig;
  }

  async connect(): Promise<void> {
    // set default to mainnet
    if (!this.chainConfig) this.chainConfig = getChainConfig(CHAIN_NAMESPACES.EIP155, 1);
    return new Promise((resolve, reject) => {
      if (!this.ready) throw WalletInitializationError.notReady("Metamask extention is not installed");
      this.connecting = true;
      this.emit(BASE_ADAPTER_EVENTS.CONNECTING, { adapter: WALLET_ADAPTERS.METAMASK });
      try {
        if (!this.metamaskProvider) throw WalletLoginError.notConnectedError("Not able to connect with metamask");
        const onConnectHandler = async (connectInfo: { chainId: string }) => {
          const { chainId } = connectInfo;
          if (chainId !== (this.chainConfig as CustomChainConfig).chainId) {
            await this.switchChain(this.chainConfig as CustomChainConfig);
          }
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
              onConnectHandler({ chainId: this.metamaskProvider.chainId });
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

  private async switchChain(chainConfig: CustomChainConfig): Promise<void> {
    if (!this.metamaskProvider) throw WalletLoginError.notConnectedError("Not connected with wallet");
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await this.metamaskProvider.request!({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainConfig.chainId }],
      });
    } catch (switchError: unknown) {
      // This error code indicates that the chain has not been added to MetaMask.
      if ((switchError as any).code === 4902) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          await this.metamaskProvider.request!({
            method: "wallet_addEthereumChain",
            params: [{ chainId: chainConfig.chainId, chainName: chainConfig.displayName, rpcUrls: [chainConfig.rpcTarget] }],
          });
        } catch (addError) {
          // handle "add" error
        }
      }
      // handle other "switch" errors
    }
  }
}

export { MetamaskAdapter };
