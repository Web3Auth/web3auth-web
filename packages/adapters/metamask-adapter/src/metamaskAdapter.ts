import detectEthereumProvider from "@metamask/detect-provider";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
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

  readonly name: string = WALLET_ADAPTERS.METAMASK;

  // added after connecting
  public provider!: SafeEventEmitterProvider | undefined;

  private metamaskProvider!: EthereumProvider;

  constructor(adapterOptions: { chainConfig?: CustomChainConfig } = {}) {
    super();
    this.chainConfig = adapterOptions.chainConfig;
  }

  async init(options: AdapterInitOptions): Promise<void> {
    if (this.status === ADAPTER_STATUS.READY) return;
    this.metamaskProvider = (await detectEthereumProvider({ mustBeMetaMask: true })) as EthereumProvider;
    if (!this.metamaskProvider) throw WalletInitializationError.notInstalled("Metamask extension is not installed");
    this.status = ADAPTER_STATUS.READY;
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

  async connect(): Promise<void> {
    // set default to mainnet
    if (!this.chainConfig) this.chainConfig = getChainConfig(CHAIN_NAMESPACES.EIP155, 1);
    if (this.status < ADAPTER_STATUS.READY) throw WalletInitializationError.notReady("Metamask extension is not installed");
    if (this.status === ADAPTER_STATUS.CONNECTING) throw WalletInitializationError.notReady("Already pending connection");
    if (this.status === ADAPTER_STATUS.CONNECTED) throw WalletInitializationError.notReady("Already connected");

    this.status = ADAPTER_STATUS.CONNECTING;
    this.emit(BASE_ADAPTER_EVENTS.CONNECTING, { adapter: WALLET_ADAPTERS.METAMASK });
    if (!this.metamaskProvider) throw WalletLoginError.notConnectedError("Not able to connect with metamask");
    try {
      await this.metamaskProvider.request({ method: "eth_requestAccounts" });
      const { chainId } = this.metamaskProvider;
      if (chainId !== (this.chainConfig as CustomChainConfig).chainId) {
        await this.switchChain(this.chainConfig as CustomChainConfig);
      }
      this.status = ADAPTER_STATUS.CONNECTED;
      this.provider = this.metamaskProvider;
      this.provider.once("disconnect", () => {
        this.status = ADAPTER_STATUS.DISCONNECTED;
        this.emit(BASE_ADAPTER_EVENTS.DISCONNECTED);
      });
      this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.METAMASK);
    } catch (error) {
      this.emit(BASE_ADAPTER_EVENTS.ERRORED, error);
      this.status = ADAPTER_STATUS.READY;
      throw WalletLoginError.connectionError("Failed to login with metamask wallet");
    }
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
